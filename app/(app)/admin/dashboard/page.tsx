'use client';

import { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, CircleUser, Mic, Loader2, Pause, Trash2 } from 'lucide-react';
import { voiceQueryProcess } from '@/ai/flows/voice-query-processing';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  type: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export default function AdminDashboard() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleNewMessage = (type: 'user' | 'ai', text: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, newMessage]);
    return newMessage;
  };
  
  const processQuery = async (userText: string) => {
      console.log('Processing query:', userText);
      setIsLoading(true);
      handleNewMessage('user', userText);
      
      try {
        console.log('Calling voiceQueryProcess...');
        const result = await voiceQueryProcess({ userText });
        console.log('Got result:', result);
        handleNewMessage('ai', result.aiText);
        
        // Speak the AI response
        if (synthRef.current && result.aiText) {
          speakText(result.aiText);
        }

      } catch (error: any) {
        console.error('Error processing voice query:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: error?.message || 'Failed to process your request. Please try again.',
        });
        handleNewMessage('ai', 'Sorry, I encountered an error. Please try again.');
      } finally {
        setIsLoading(false);
      }
  }

  const speakText = (text: string) => {
    if (!synthRef.current) {
      console.warn('Speech synthesis not available');
      return;
    }
    
    console.log('Speaking text:', text.substring(0, 50) + '...');
    
    // Cancel any ongoing speech
    synthRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    // Try to find a female voice
    const voices = synthRef.current.getVoices();
    const femaleVoice = voices.find(voice => 
      voice.name.includes('Female') || 
      voice.name.includes('Samantha') ||
      voice.name.includes('Karen')
    );
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    }
    
    utterance.onstart = () => {
      console.log('Started speaking');
      setIsSpeaking(true);
    };
    utterance.onend = () => {
      console.log('Finished speaking');
      setIsSpeaking(false);
    };
    utterance.onerror = (error) => {
      console.error('Speech error:', error);
      setIsSpeaking(false);
    };
    
    synthRef.current.speak(utterance);
  };

  // Initialize speech recognition and synthesis
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        
        recognition.onstart = () => {
          console.log('Recognition started');
          setIsListening(true);
        };
        
        recognition.onend = () => {
          console.log('Recognition ended');
          setIsListening(false);
          setIsRecording(false);
        };
        
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          console.log('Transcript received:', transcript);
          if (transcript && transcript.trim()) {
            processQuery(transcript);
          } else {
            console.warn('Empty transcript received');
            toast({
              variant: 'destructive',
              title: 'No Speech Detected',
              description: 'Please try speaking again.',
            });
          }
        };
        
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          setIsRecording(false);
          
          let errorMessage = 'Please try again.';
          if (event.error === 'not-allowed' || event.error === 'permission-denied') {
            errorMessage = 'Microphone access denied. Please allow microphone access in your browser settings.';
          } else if (event.error === 'no-speech') {
            errorMessage = 'No speech detected. Please try speaking again.';
          } else if (event.error === 'network') {
            errorMessage = 'Network error. Please check your internet connection.';
          }
          
          toast({
            variant: 'destructive',
            title: 'Speech Recognition Error',
            description: errorMessage,
          });
        };
        
        recognitionRef.current = recognition;
        console.log('Speech recognition initialized');
      } else {
        console.warn('Speech recognition not supported');
      }
      
      synthRef.current = window.speechSynthesis;
      
      // Load voices
      if (window.speechSynthesis) {
        const loadVoices = () => {
          const voices = window.speechSynthesis.getVoices();
          console.log('Available voices:', voices.length);
        };
        loadVoices();
        window.speechSynthesis.onvoiceschanged = loadVoices;
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.log('Recognition cleanup - already stopped');
        }
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [toast]);

  const startRecording = () => {
    console.log('Start recording clicked');
    
    if (!recognitionRef.current) {
      console.error('Recognition not initialized');
      toast({
        variant: 'destructive',
        title: 'Not Supported',
        description: 'Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.',
      });
      return;
    }
    
    try {
      console.log('Starting recognition...');
      recognitionRef.current.start();
      setIsRecording(true);
    } catch (error: any) {
      console.error('Error starting recognition:', error);
      
      // If already started, try stopping and restarting
      if (error.message && error.message.includes('already started')) {
        try {
          recognitionRef.current.stop();
          setTimeout(() => {
            recognitionRef.current.start();
            setIsRecording(true);
          }, 100);
        } catch (retryError) {
          console.error('Retry failed:', retryError);
          toast({
            variant: 'destructive',
            title: 'Microphone Error',
            description: 'Could not start speech recognition. Please refresh the page and try again.',
          });
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Microphone Error',
          description: 'Could not start speech recognition. Please check microphone permissions.',
        });
      }
    }
  };

  const stopRecording = () => {
    console.log('Stop recording clicked');
    if (recognitionRef.current && isRecording) {
      try {
        recognitionRef.current.stop();
        setIsRecording(false);
      } catch (error) {
        console.error('Error stopping recognition:', error);
        setIsRecording(false);
      }
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  useEffect(() => {
    const el = scrollAreaRef.current;
    if (el) {
      el.querySelector('div:first-child')?.scrollTo({ top: el.querySelector('div:first-child')?.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const clearChat = () => {
    setMessages([]);
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
  };


  return (
    <div className="flex flex-col h-[calc(100dvh-5rem)]">
        <div className="flex justify-between items-center mb-4">
            <h1 className="text-xl font-bold font-headline">AssureAI</h1>
            <div className="flex gap-2">
                {isSpeaking && (
                    <Button variant="outline" size="icon" onClick={stopSpeaking} aria-label="Stop Speaking">
                        <Pause className="h-4 w-4" />
                    </Button>
                )}
                <Button variant="ghost" size="icon" onClick={clearChat} disabled={messages.length === 0} aria-label="Clear Chat">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
      <Card className="flex-1 flex flex-col shadow-lg">
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1" viewportRef={scrollAreaRef}>
            <div className="p-6 space-y-6">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground pt-16">
                    <Bot size={48} className="mx-auto opacity-50" />
                    <p className="mt-4">Welcome to the AssureAI Dashboard! <br/> Press the microphone button below and start speaking.</p>
                    <p className="mt-2 text-sm">Uses browser-native speech recognition and AI-powered responses.</p>
                </div>
              )}
              {messages.map((msg) => (
                <div key={msg.id} className={cn('flex items-start gap-4', msg.type === 'user' && 'justify-end')}>
                  {msg.type === 'ai' && (
                    <Avatar className="h-9 w-9 border">
                      <AvatarFallback className="bg-primary text-primary-foreground"><Bot size={20} /></AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn("max-w-[75%] space-y-1", msg.type === 'user' && 'text-right')}>
                    <div
                      className={cn(
                        'rounded-lg px-4 py-2 shadow-sm',
                        msg.type === 'ai' ? 'bg-secondary' : 'bg-primary text-primary-foreground'
                      )}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{msg.timestamp}</p>
                  </div>
                  {msg.type === 'user' && (
                    <Avatar className="h-9 w-9 border">
                      <AvatarFallback><CircleUser size={20} /></AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isLoading && (
                 <div className="flex items-start gap-4">
                    <Avatar className="h-9 w-9 border">
                        <AvatarFallback className="bg-primary text-primary-foreground"><Bot size={20} /></AvatarFallback>
                    </Avatar>
                    <div className="max-w-[75%] space-y-1">
                        <div className="rounded-lg px-4 py-2 bg-secondary shadow-sm">
                            <Loader2 className="h-5 w-5 animate-spin" />
                        </div>
                    </div>
                 </div>
              )}
            </div>
          </ScrollArea>
          <div className="border-t p-4 bg-card">
            <div className="relative flex items-center justify-center">
              <Button 
                size="lg" 
                onClick={handleMicClick} 
                disabled={isLoading} 
                className={cn(
                  "h-16 w-16 rounded-full transition-all duration-200",
                  (isRecording || isListening) && 'bg-destructive hover:bg-destructive/90 animate-pulse scale-110'
                )} 
                aria-label={(isRecording || isListening) ? "Stop recording" : "Start recording"}
              >
                <Mic className="h-6 w-6" />
              </Button>
              {(isRecording || isListening) && (
                <div className="absolute -top-8 text-sm font-medium text-destructive animate-pulse">
                  Listening... Click to stop
                </div>
              )}
              {!isRecording && !isListening && messages.length === 0 && (
                <div className="absolute -top-8 text-sm text-muted-foreground">
                  Click to start speaking
                </div>
              )}
              {isSpeaking && (
                <div className="absolute -bottom-8 text-sm text-primary animate-pulse">
                  AI is speaking...
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

