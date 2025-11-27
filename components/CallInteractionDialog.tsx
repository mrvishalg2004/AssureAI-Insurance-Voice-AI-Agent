'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Phone, Clock, User, AlertCircle, Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CallInteractionDialogProps {
  callId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CallInteraction {
  callId: string;
  name: string;
  phone: string;
  status: string;
  conversationTime?: number;
  transcript?: string;
  recordingUrl?: string;
  callStatus?: string;
  hangupBy?: string;
  hangupReason?: string;
  extractedData?: Record<string, any>;
  costBreakdown?: {
    llm?: number;
    network?: number;
    platform?: number;
    synthesizer?: number;
    transcriber?: number;
  };
  createdAt?: string;
  updatedAt?: string;
  cached?: boolean;
}

export function CallInteractionDialog({ callId, open, onOpenChange }: CallInteractionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [interaction, setInteraction] = useState<CallInteraction | null>(null);
  const { toast } = useToast();

  const fetchInteraction = async () => {
    if (!callId) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

      const response = await fetch(`${apiUrl}/api/bulk-calls/${callId}/interaction`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to fetch call interaction');
      }

      const data: CallInteraction = await response.json();
      setInteraction(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && callId) {
      fetchInteraction();
    } else {
      setInteraction(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, callId]);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0s';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden p-0">
        <div className="flex flex-col h-full">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-xl font-semibold">Call Interaction Details</DialogTitle>
            <DialogDescription className="text-sm">
              View conversation transcript, recording, and extracted data
            </DialogDescription>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-center space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Loading call details...</p>
              </div>
            </div>
          ) : interaction ? (
            <div className="flex-1 overflow-hidden">
              <div className="h-full flex flex-col">
                {/* Header Info Card */}
                <div className="px-6 py-4 bg-muted/30 border-b">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs text-muted-foreground mb-1">Contact</div>
                        <div className="text-sm font-semibold truncate">{interaction.name}</div>
                        <div className="text-xs text-muted-foreground">{interaction.phone}</div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Clock className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Duration</div>
                        <div className="text-sm font-semibold">
                          {formatDuration(interaction.conversationTime)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-green-500/10 rounded-lg">
                        <Phone className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Status</div>
                        <Badge 
                          variant={interaction.callStatus === 'completed' ? 'default' : 'secondary'}
                          className="mt-1"
                        >
                          {interaction.callStatus || interaction.status}
                        </Badge>
                      </div>
                    </div>

                    {interaction.hangupBy && (
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-orange-500/10 rounded-lg">
                          <AlertCircle className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Hangup By</div>
                          <div className="text-sm font-semibold capitalize">{interaction.hangupBy}</div>
                          {interaction.hangupReason && (
                            <div className="text-xs text-muted-foreground mt-1">{interaction.hangupReason}</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {interaction.cached && (
                    <div className="flex items-center gap-2 mt-4 px-3 py-2 bg-amber-50 border border-amber-200 rounded-md">
                      <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                      <span className="text-xs text-amber-800">Showing cached data (Bolna API unavailable)</span>
                    </div>
                  )}
                </div>

                {/* Tabs Content */}
                <ScrollArea className="flex-1 px-6">
                  <Tabs defaultValue="transcript" className="w-full py-6">
                    <TabsList className="grid w-full grid-cols-3 mb-6">
                      <TabsTrigger value="transcript" className="text-sm">
                        📝 Transcript
                      </TabsTrigger>
                      <TabsTrigger value="recording" className="text-sm">
                        🎵 Recording
                      </TabsTrigger>
                      <TabsTrigger value="data" className="text-sm">
                        📊 Data & Costs
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="transcript" className="mt-0">
                      <Card className="border-2">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <span className="text-2xl">💬</span>
                            Conversation Transcript
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {interaction.transcript ? (
                            <ScrollArea className="h-[400px] w-full">
                              <div className="prose prose-sm max-w-none">
                                <pre className="whitespace-pre-wrap text-sm leading-relaxed bg-muted/50 p-4 rounded-lg font-mono">
                                  {interaction.transcript}
                                </pre>
                              </div>
                            </ScrollArea>
                          ) : (
                            <div className="text-center py-16">
                              <div className="text-5xl mb-4">📭</div>
                              <div className="text-base font-medium text-muted-foreground">
                                No transcript available
                              </div>
                              <div className="text-sm text-muted-foreground mt-2">
                                The conversation transcript will appear here once available
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="recording" className="mt-0">
                      <Card className="border-2">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <span className="text-2xl">🎧</span>
                            Call Recording
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {interaction.recordingUrl ? (
                            <div className="space-y-6">
                              <div className="bg-gradient-to-r from-primary/10 to-blue-500/10 p-6 rounded-xl">
                                <audio 
                                  controls 
                                  className="w-full h-12"
                                  style={{ filter: 'contrast(0.9)' }}
                                >
                                  <source src={interaction.recordingUrl} type="audio/mpeg" />
                                  Your browser does not support the audio element.
                                </audio>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="outline" className="flex-1" asChild>
                                  <a href={interaction.recordingUrl} download target="_blank" rel="noopener noreferrer">
                                    <Download className="h-4 w-4 mr-2" />
                                    Download Recording
                                  </a>
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-16">
                              <div className="text-5xl mb-4">🎤</div>
                              <div className="text-base font-medium text-muted-foreground">
                                No recording available
                              </div>
                              <div className="text-sm text-muted-foreground mt-2">
                                The call recording will appear here once available
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="data" className="mt-0 space-y-6">
                      {/* Extracted Data */}
                      <Card className="border-2">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base flex items-center gap-2">
                            <span className="text-2xl">🔍</span>
                            Extracted Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {interaction.extractedData && Object.keys(interaction.extractedData).length > 0 ? (
                            <div className="grid gap-3">
                              {Object.entries(interaction.extractedData).map(([key, value]) => (
                                <div 
                                  key={key} 
                                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-muted/30 rounded-lg border hover:border-primary/50 transition-colors"
                                >
                                  <span className="font-medium text-sm capitalize mb-1 sm:mb-0">
                                    {key.replace(/_/g, ' ')}
                                  </span>
                                  <span className="text-sm text-muted-foreground font-mono">
                                    {typeof value === 'boolean' 
                                      ? (value ? '✓ Yes' : '✗ No') 
                                      : typeof value === 'object'
                                      ? JSON.stringify(value)
                                      : String(value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-12">
                              <div className="text-5xl mb-4">📋</div>
                              <div className="text-base font-medium text-muted-foreground">
                                No extracted data available
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Cost Breakdown */}
                      {interaction.costBreakdown && Object.keys(interaction.costBreakdown).length > 0 && (
                        <Card className="border-2 border-green-200 bg-green-50/50">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                              <span className="text-2xl">💰</span>
                              Cost Breakdown
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {Object.entries(interaction.costBreakdown).map(([key, value]) => (
                                <div 
                                  key={key} 
                                  className="flex items-center justify-between p-3 bg-white rounded-lg border"
                                >
                                  <span className="capitalize text-sm font-medium">{key}</span>
                                  <span className="font-mono text-sm font-semibold text-green-700">
                                    ${(value / 100).toFixed(4)}
                                  </span>
                                </div>
                              ))}
                              <div className="flex items-center justify-between p-4 bg-green-100 rounded-lg border-2 border-green-300 mt-4">
                                <span className="font-semibold">Total Cost</span>
                                <span className="font-mono text-lg font-bold text-green-700">
                                  ${(Object.values(interaction.costBreakdown).reduce((a, b) => a + b, 0) / 100).toFixed(4)}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </TabsContent>
                  </Tabs>
                </ScrollArea>
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">📞</div>
              <div className="text-lg font-medium text-muted-foreground">
                No interaction data available
              </div>
              <div className="text-sm text-muted-foreground mt-2">
                Call details will appear here once available
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
