'use client';

import { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Bot, CircleUser, CornerDownLeft, Mic, Loader2, Play, Pause, Trash2 } from 'lucide-react';
import { voiceQueryProcess } from '@/ai/flows/voice-query-processing';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { VoiceQueryProcessOutput } from '@/ai/flows/voice-query-processing';
import { textQueryProcess } from '@/ai/flows/text-query-processing';
import type { TextQueryProcessOutput } from '@/ai/flows/text-query-processing';

interface Message {
  id: string;
  type: 'user' | 'ai';
  text: string;
  audioUrl?: string;
  timestamp: string;
}

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<{ audio: HTMLAudioElement; id: string } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const handleNewMessage = (type: 'user' | 'ai', text: string, audioUrl?: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      text,
      audioUrl,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, newMessage]);
    return newMessage;
  };

  const processQuery = async (audioDataUri: string) => {
    setIsLoading(true);
    try {
      const result: VoiceQueryProcessOutput = await voiceQueryProcess({ audioDataUri });
      handleNewMessage('user', result.userText);
      const aiMessage = handleNewMessage('ai', result.aiText, result.aiAudioUrl);

      if (result.aiAudioUrl) {
        const audio = new Audio(result.aiAudioUrl);
        playAudio(audio, aiMessage.id);
      }

    } catch (error) {
      console.error('Error processing voice query:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to process your request. Please try again.',
      });
      handleNewMessage('ai', 'Sorry, I encountered an error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Media Devices API not supported.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          processQuery(base64data);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        variant: 'destructive',
        title: 'Microphone Error',
        description: 'Could not access microphone. Please check permissions.',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    handleNewMessage('user', inputValue);
    setInputValue('');
    setIsLoading(true);

    try {
      const result: TextQueryProcessOutput = await textQueryProcess({ text: inputValue });
      const aiMessage = handleNewMessage('ai', result.aiText, result.aiAudioUrl);

      if (result.aiAudioUrl) {
        const audio = new Audio(result.aiAudioUrl);
        playAudio(audio, aiMessage.id);
      }
    } catch (error) {
      console.error('Error processing text query:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to process your request. Please try again.',
      });
      handleNewMessage('ai', 'Sorry, I encountered an error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const playAudio = (audio: HTMLAudioElement, id: string) => {
    if (currentAudio) {
      currentAudio.audio.pause();
    }
    setCurrentAudio({ audio, id });
    setIsPlaying(true);
    audio.play();
    audio.onended = () => {
      setIsPlaying(false);
      setCurrentAudio(null);
    };
    audio.onpause = () => {
      setIsPlaying(false);
    };
  };

  const togglePlayPause = (message: Message) => {
    if (currentAudio && currentAudio.id === message.id) {
      if (isPlaying) {
        currentAudio.audio.pause();
      } else {
        currentAudio.audio.play();
        setIsPlaying(true);
      }
    } else {
      if (message.audioUrl) {
        const audio = new Audio(message.audioUrl);
        playAudio(audio, message.id);
      }
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
    if (currentAudio) {
      currentAudio.audio.pause();
      setCurrentAudio(null);
      setIsPlaying(false);
    }
  };


  return (
    <div className="flex flex-col h-[calc(100dvh-5rem)]">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold font-headline">AI Assistant</h1>
        <Button variant="ghost" size="icon" onClick={clearChat} disabled={messages.length === 0} aria-label="Clear Chat">
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Clear Chat</span>
        </Button>
      </div>
      <Card className="flex-1 flex flex-col shadow-lg">
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1" viewportRef={scrollAreaRef}>
            <div className="p-6 space-y-6">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground pt-16">
                  <Bot size={48} className="mx-auto opacity-50" />
                  <p className="mt-4">Ask me anything about insurance. <br /> Press the microphone to start.</p>
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
                      {msg.audioUrl && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 mt-2" onClick={() => togglePlayPause(msg)} aria-label={currentAudio?.id === msg.id && isPlaying ? "Pause audio" : "Play audio"}>
                          {currentAudio?.id === msg.id && isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                      )}
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
            <div className="relative">
              <form onSubmit={handleTextSubmit}>
                <Input
                  placeholder={isRecording ? "Recording... Click mic to stop" : "Type a message or use the microphone..."}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={isRecording || isLoading}
                  className="pr-20"
                />
                <Button type="submit" size="icon" className="absolute right-11 top-1/2 -translate-y-1/2 h-8 w-8" disabled={isLoading || !inputValue.trim()} aria-label="Send message">
                  <CornerDownLeft className="h-4 w-4" />
                </Button>
              </form>
              <Button size="icon" onClick={handleMicClick} disabled={isLoading} className={cn("absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8", isRecording && 'bg-destructive hover:bg-destructive/90 recording-indicator ripple-btn')} aria-label={isRecording ? "Stop recording" : "Start recording"}>
                <Mic className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
