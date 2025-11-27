'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Send, Bot, User, Loader2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Load conversation history
    loadConversationHistory();
  }, []);

  const loadConversationHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

      const response = await fetch(`${apiUrl}/api/chat/history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.conversation) {
          setConversationId(data.conversation.id);
          setMessages(data.conversation.messages.map((msg: any) => ({
            id: `${msg.timestamp}-${msg.role}`,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp),
          })));
        }
      }
    } catch (error) {
      console.error('Failed to load conversation history:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

      const response = await fetch(`${apiUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: userMessage.content,
          conversationId: conversationId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      
      // Update conversation ID if new
      if (!conversationId && data.conversationId) {
        setConversationId(data.conversationId);
      }

    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });

      // Add error message
      const errorMessage: Message = {
        id: `${Date.now()}-error`,
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = async () => {
    if (!confirm('Are you sure you want to clear this conversation?')) return;

    try {
      if (conversationId) {
        const token = localStorage.getItem('token');
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

        await fetch(`${apiUrl}/api/chat/${conversationId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }

      setMessages([]);
      setConversationId(null);

      toast({
        title: 'Success',
        description: 'Conversation cleared successfully',
      });
    } catch (error) {
      console.error('Error clearing conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear conversation',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] w-full">
      <Card className="flex flex-col flex-1 shadow-lg border-2 m-2 sm:m-4 md:m-6 max-w-7xl mx-auto w-full">
        <CardHeader className="border-b bg-gradient-to-r from-primary/5 to-blue-500/5 px-3 py-3 sm:px-4 sm:py-4 md:px-6 md:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg flex-shrink-0">
                <Bot className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <CardTitle className="text-lg sm:text-xl md:text-2xl truncate">Chat Assistant</CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 sm:mt-1 truncate">
                  Ask me anything about insurance
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearChat}
              disabled={messages.length === 0}
              className="gap-1.5 sm:gap-2 flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3"
            >
              <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Clear</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3 sm:space-y-4 px-2">
              <div className="p-3 sm:p-4 bg-primary/10 rounded-full">
                <Bot className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 text-primary" />
              </div>
              <div className="space-y-2 max-w-md">
                <h3 className="text-lg sm:text-xl font-semibold">Welcome to AssureAI Chat</h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  I'm your AI insurance assistant. Ask me anything about insurance policies, 
                  claims, coverage, or any insurance-related questions.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mt-4 sm:mt-6 w-full max-w-2xl">
                <Button
                  variant="outline"
                  className="text-left justify-start h-auto p-3 sm:p-4 text-xs sm:text-sm"
                  onClick={() => setInput("What types of insurance do you offer?")}
                >
                  <span>What types of insurance do you offer?</span>
                </Button>
                <Button
                  variant="outline"
                  className="text-left justify-start h-auto p-3 sm:p-4 text-xs sm:text-sm"
                  onClick={() => setInput("How do I file a claim?")}
                >
                  <span>How do I file a claim?</span>
                </Button>
                <Button
                  variant="outline"
                  className="text-left justify-start h-auto p-3 sm:p-4 text-xs sm:text-sm"
                  onClick={() => setInput("What is the difference between term and whole life insurance?")}
                >
                  <span>What is the difference between term and whole life insurance?</span>
                </Button>
                <Button
                  variant="outline"
                  className="text-left justify-start h-auto p-3 sm:p-4 text-xs sm:text-sm"
                  onClick={() => setInput("How much coverage do I need?")}
                >
                  <span>How much coverage do I need?</span>
                </Button>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex items-start gap-2 sm:gap-3',
                    msg.role === 'user' && 'flex-row-reverse'
                  )}
                >
                  <Avatar className={cn(
                    'h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 border-2 flex-shrink-0',
                    msg.role === 'assistant' ? 'border-primary/20' : 'border-blue-500/20'
                  )}>
                    <AvatarFallback className={cn(
                      msg.role === 'assistant' 
                        ? 'bg-primary/10 text-primary' 
                        : 'bg-blue-500/10 text-blue-600'
                    )}>
                      {msg.role === 'assistant' ? (
                        <Bot className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                      ) : (
                        <User className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                      )}
                    </AvatarFallback>
                  </Avatar>

                  <div className={cn(
                    'flex flex-col max-w-[85%] sm:max-w-[80%] md:max-w-[75%] space-y-1',
                    msg.role === 'user' && 'items-end'
                  )}>
                    <div
                      className={cn(
                        'rounded-2xl px-3 py-2 sm:px-4 sm:py-3 shadow-sm break-words',
                        msg.role === 'assistant'
                          ? 'bg-secondary border'
                          : 'bg-gradient-to-br from-primary to-blue-600 text-primary-foreground'
                      )}
                    >
                      <p className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed">
                        {msg.content}
                      </p>
                    </div>
                    <span className="text-[10px] sm:text-xs text-muted-foreground px-2">
                      {msg.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex items-start gap-2 sm:gap-3">
                  <Avatar className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9 border-2 border-primary/20 flex-shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      <Bot className="h-3 w-3 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-secondary rounded-2xl px-3 py-2 sm:px-4 sm:py-3 border">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin text-primary" />
                      <span className="text-xs sm:text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
        </CardContent>

        <div className="border-t bg-background p-2 sm:p-3 md:p-4">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your message..."
              className="min-h-[50px] sm:min-h-[60px] max-h-[150px] sm:max-h-[200px] resize-none text-xs sm:text-sm"
              disabled={loading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={loading || !input.trim()}
              size="lg"
              className="px-3 sm:px-4 md:px-6 flex-shrink-0"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
              ) : (
                <Send className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </Button>
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-1.5 sm:mt-2 text-center px-2">
            AI-powered responses may contain errors. Please verify important information.
          </p>
        </div>
      </Card>
    </div>
  );
}
