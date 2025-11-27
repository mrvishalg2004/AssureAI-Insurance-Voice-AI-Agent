'use client';

import React, { useState, useEffect } from 'react';
import { Phone, RefreshCw, Search, Filter, Download, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { BulkCallUpload } from '@/components/BulkCallUpload';
import { CallInteractionDialog } from '@/components/CallInteractionDialog';
import { useToast } from '@/hooks/use-toast';

interface BulkCall {
  id: string;
  name: string;
  phone: string;
  city?: string;
  email?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  bolnaCallId?: string;
  errorMessage?: string;
  callAttempts: number;
  lastAttemptAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface CallsResponse {
  calls: BulkCall[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  summary: {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
}

export default function BulkCallsPage() {
  const [calls, setCalls] = useState<BulkCall[]>([]);
  const [summary, setSummary] = useState({
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedCalls, setSelectedCalls] = useState<string[]>([]);
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);
  const [interactionDialogOpen, setInteractionDialogOpen] = useState(false);
  const { toast } = useToast();

  const fetchCalls = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Not authenticated');
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`${apiUrl}/api/bulk-calls?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch calls');
      }

      const data: CallsResponse = await response.json();
      setCalls(data.calls);
      setPagination(data.pagination);
      setSummary(data.summary);
    } catch (error: any) {
      console.error('Fetch error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to fetch bulk calls',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, statusFilter]);

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchCalls();
  };

  const handleRetryFailed = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

      const response = await fetch(`${apiUrl}/api/bulk-calls/retry-all`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to retry calls');
      }

      toast({
        title: 'Success',
        description: data.message,
      });

      fetchCalls();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleRetrySelected = async () => {
    if (selectedCalls.length === 0) return;

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

      const response = await fetch(`${apiUrl}/api/bulk-calls/retry`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ callIds: selectedCalls }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to retry calls');
      }

      toast({
        title: 'Success',
        description: data.message,
      });

      setSelectedCalls([]);
      fetchCalls();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      processing: 'default',
      completed: 'outline',
      failed: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'default'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const toggleSelectCall = (callId: string) => {
    setSelectedCalls(prev =>
      prev.includes(callId)
        ? prev.filter(id => id !== callId)
        : [...prev, callId]
    );
  };

  const handleViewInteraction = (callId: string) => {
    setSelectedCallId(callId);
    setInteractionDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Upload contact lists and manage automated voice calls
        </p>
      </div>

      {/* Upload Section */}
      <BulkCallUpload />

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{summary.pending}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-600">Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{summary.processing}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-600">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summary.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-600">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summary.failed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Call Status</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchCalls}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              {summary.failed > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetryFailed}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Retry All Failed
                </Button>
              )}
              {selectedCalls.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetrySelected}
                >
                  Retry Selected ({selectedCalls.length})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1 flex items-center gap-2">
              <Input
                placeholder="Search by name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} size="icon" variant="outline">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={selectedCalls.length === calls.length && calls.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCalls(calls.map(c => c.id));
                        } else {
                          setSelectedCalls([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead>Last Attempt</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : calls.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No calls found. Upload a contact file to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  calls.map((call) => (
                    <TableRow key={call.id}>
                      <TableCell>
                        <input
                          type="checkbox"
                          checked={selectedCalls.includes(call.id)}
                          onChange={() => toggleSelectCall(call.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{call.name}</TableCell>
                      <TableCell>{call.phone}</TableCell>
                      <TableCell>{call.city || '-'}</TableCell>
                      <TableCell>{getStatusBadge(call.status)}</TableCell>
                      <TableCell>{call.callAttempts}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {call.lastAttemptAt
                          ? new Date(call.lastAttemptAt).toLocaleString()
                          : '-'}
                      </TableCell>
                      <TableCell className="text-sm text-red-600 max-w-xs truncate">
                        {call.errorMessage || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {(call.status === 'completed' || call.bolnaCallId) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewInteraction(call.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} calls
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page === pagination.pages}
                >
                  Next
                </Button>
              </div>
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
