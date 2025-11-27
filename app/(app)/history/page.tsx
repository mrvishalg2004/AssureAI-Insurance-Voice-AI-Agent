'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, Clock, Search, Loader2, RefreshCw, Eye, Calendar, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CallInteractionDialog } from '@/components/CallInteractionDialog';

interface CallHistory {
  id: string;
  name: string;
  phone: string;
  city?: string;
  status: string;
  bolnaCallId?: string;
  callAttempts: number;
  lastAttemptAt?: string;
  createdAt: string;
}

export default function HistoryPage() {
  const [calls, setCalls] = useState<CallHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [interactionDialogOpen, setInteractionDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchCallHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

      const response = await fetch(`${apiUrl}/api/bulk-calls?limit=100`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch call history');
      }

      const data = await response.json();
      setCalls(data.calls);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load call history',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCallHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredCalls = calls.filter(call => {
    const matchesSearch = call.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         call.phone.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || call.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'processing': return 'secondary';
      case 'failed': return 'destructive';
      default: return 'outline';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleViewInteraction = (callId: string) => {
    setSelectedCallId(callId);
    setInteractionDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-headline">Call History</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review all your outbound call conversations
          </p>
        </div>
        <Button onClick={fetchCallHistory} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle>All Call Records</CardTitle>
              <CardDescription>
                Total {calls.length} call{calls.length !== 1 ? 's' : ''} made
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background text-sm"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Loading call history...</p>
              </div>
            </div>
          ) : filteredCalls.length === 0 ? (
            <div className="text-center py-12">
              <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-base font-medium text-muted-foreground">
                {searchQuery || statusFilter !== 'all' ? 'No calls found matching your filters' : 'No call history yet'}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                {!searchQuery && statusFilter === 'all' && 'Upload contacts and make calls to see history here'}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Contact</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="hidden md:table-cell">Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Attempts</TableHead>
                    <TableHead className="hidden xl:table-cell">Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCalls.map(call => (
                    <TableRow key={call.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-500/10 rounded-full">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="font-medium">{call.name}</div>
                            {call.city && (
                              <div className="text-xs text-muted-foreground">{call.city}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3 text-muted-foreground" />
                          <span className="font-mono text-sm">{call.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant={getStatusColor(call.status)}>
                          {call.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">{call.callAttempts}x</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden xl:table-cell">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(call.lastAttemptAt || call.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {call.bolnaCallId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewInteraction(call.id)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Call Interaction Dialog */}
      <CallInteractionDialog
        callId={selectedCallId}
        open={interactionDialogOpen}
        onOpenChange={setInteractionDialogOpen}
      />
    </div>
  );
}
