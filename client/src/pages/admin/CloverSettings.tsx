/**
 * Clover Payment Settings Page - Admin Interface
 * 
 * This page allows administrators to:
 * - Connect their Clover merchant account via OAuth
 * - Configure payment settings
 * - View payment transaction history
 * - Manage refunds
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  CreditCard, 
  Settings, 
  RefreshCw, 
  DollarSign,
  AlertTriangle,
  Calendar,
  User,
  Receipt
} from 'lucide-react';
import { format } from 'date-fns';

interface CloverStatus {
  isConfigured: boolean;
  merchantId?: string;
  environment?: string;
  tokenExpiry?: string;
}

interface PaymentTransaction {
  id: number;
  cloverPaymentId: string;
  orderId?: string;
  userId: number;
  amount: number;
  currency: string;
  status: string;
  paymentMethod?: string;
  cardLast4?: string;
  cardBrand?: string;
  errorMessage?: string;
  refundAmount: number;
  refundedAt?: string;
  createdAt: string;
}

export default function CloverSettings() {
  const [merchantId, setMerchantId] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [refundDialog, setRefundDialog] = useState<{ open: boolean; transaction?: PaymentTransaction }>({ open: false });
  const [refundAmount, setRefundAmount] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get Clover configuration status
  const { data: cloverStatus, isLoading: statusLoading } = useQuery<CloverStatus>({
    queryKey: ['/api/admin/clover/status'],
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Get payment transactions
  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<PaymentTransaction[]>({
    queryKey: ['/api/admin/payments'],
    refetchInterval: 60000 // Refresh every minute
  });

  // Check URL parameters for OAuth callback status
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');
    
    if (success === 'connected') {
      toast({
        title: "Clover Connected",
        description: "Your Clover account has been successfully connected!",
      });
      // Clean up URL
      window.history.replaceState({}, '', '/admin/clover-settings');
      queryClient.invalidateQueries({ queryKey: ['/api/admin/clover/status'] });
    } else if (error) {
      toast({
        title: "Connection Failed",
        description: error === 'oauth_failed' ? "OAuth authorization failed. Please try again." : 
                    error === 'missing_params' ? "Missing authorization parameters." :
                    "Failed to connect your Clover account. Please try again.",
        variant: "destructive",
      });
      // Clean up URL
      window.history.replaceState({}, '', '/admin/clover-settings');
    }
  }, [toast, queryClient]);

  // Initiate OAuth flow using server-side endpoint
  const connectCloverMutation = useMutation({
    mutationFn: async (merchantId: string) => {
      const response = await fetch('/api/admin/clover/oauth/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ merchantId }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to initiate OAuth flow');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setIsConnecting(true);
      console.log('Redirecting to OAuth URL:', data.authUrl);
      // Redirect to Clover OAuth
      window.location.href = data.authUrl;
    },
    onError: (error: any) => {
      toast({
        title: "Connection Error",
        description: error.message || "Failed to initiate Clover connection",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  });

  // Disconnect Clover
  const disconnectCloverMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', '/api/admin/clover/config');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Disconnected",
        description: "Clover integration has been disconnected.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/clover/status'] });
    },
    onError: (error: any) => {
      toast({
        title: "Disconnect Error",
        description: error.message || "Failed to disconnect Clover",
        variant: "destructive",
      });
    }
  });

  // Process refund
  const refundMutation = useMutation({
    mutationFn: async ({ paymentId, amount }: { paymentId: string; amount?: number }) => {
      const response = await apiRequest('POST', `/api/admin/payments/${paymentId}/refund`, 
        amount ? { amount: Math.round(amount * 100) } : {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Refund Processed",
        description: "The refund has been successfully processed.",
      });
      setRefundDialog({ open: false });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payments'] });
    },
    onError: (error: any) => {
      toast({
        title: "Refund Error",
        description: error.message || "Failed to process refund",
        variant: "destructive",
      });
    }
  });

  const handleConnectClover = async () => {
    if (!merchantId.trim()) {
      toast({
        title: "Merchant ID Required",
        description: "Please enter your Clover Merchant ID",
        variant: "destructive",
      });
      return;
    }

    // Clear browser cache to prevent conflicts
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      // Clear session storage
      sessionStorage.clear();
      
      // Add timestamp to prevent any caching
      const timestamp = Date.now();
      console.log(`[${timestamp}] Initiating fresh Clover connection for merchant: ${merchantId}`);
      
    } catch (error) {
      console.log('Cache clearing failed, continuing anyway:', error);
    }

    connectCloverMutation.mutate(merchantId);
  };

  const handleRefund = () => {
    if (!refundDialog.transaction) return;
    
    const amount = refundAmount ? parseFloat(refundAmount) : undefined;
    refundMutation.mutate({ 
      paymentId: refundDialog.transaction.cloverPaymentId, 
      amount 
    });
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      completed: { label: 'Completed', variant: 'default' as const },
      pending: { label: 'Pending', variant: 'secondary' as const },
      failed: { label: 'Failed', variant: 'destructive' as const },
      refunded: { label: 'Refunded', variant: 'outline' as const },
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  if (statusLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading Clover settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clover Payment Settings</h1>
          <p className="text-muted-foreground">
            Configure and manage your Clover payment integration
          </p>
          <div className="text-xs text-blue-600 font-mono mt-1">
            v2.1 - HTTPS OAuth Fixed
          </div>
        </div>
      </div>

      <Tabs defaultValue="configuration" className="space-y-4">
        <TabsList>
          <TabsTrigger value="configuration">
            <Settings className="h-4 w-4 mr-2" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="transactions">
            <Receipt className="h-4 w-4 mr-2" />
            Transactions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Clover Integration Status
              </CardTitle>
              <CardDescription>
                Connect your Clover merchant account to accept payments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {cloverStatus?.isConfigured ? (
                <div className="space-y-4">
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Connected:</strong> Your Clover account is successfully connected and ready to process payments.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Merchant ID</Label>
                      <p className="text-sm text-muted-foreground">{cloverStatus.merchantId}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Environment</Label>
                      <Badge variant={cloverStatus.environment === 'production' ? 'default' : 'secondary'}>
                        {cloverStatus.environment}
                      </Badge>
                    </div>
                  </div>

                  {cloverStatus.tokenExpiry && (
                    <div>
                      <Label className="text-sm font-medium">Token Expires</Label>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(cloverStatus.tokenExpiry), 'PPP at pp')}
                      </p>
                    </div>
                  )}

                  <Separator />

                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium">Disconnect Integration</h4>
                      <p className="text-sm text-muted-foreground">
                        This will stop all payment processing through Clover
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => disconnectCloverMutation.mutate()}
                      disabled={disconnectCloverMutation.isPending}
                    >
                      {disconnectCloverMutation.isPending ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-2" />
                      )}
                      Disconnect
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Not Connected:</strong> Connect your Clover merchant account to start accepting payments.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label htmlFor="merchantId">Clover Merchant ID</Label>
                    <Input
                      id="merchantId"
                      placeholder="Enter your Clover Merchant ID"
                      value={merchantId}
                      onChange={(e) => setMerchantId(e.target.value)}
                      disabled={isConnecting}
                    />
                    <p className="text-sm text-muted-foreground">
                      You can find your Merchant ID in your Clover dashboard under Account & Setup → Business Information
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Button
                      onClick={() => {
                        // Use HTTPS redirect URI - Clover requires secure callbacks
                        const redirectUri = window.location.origin.replace('http:', 'https:') + '/api/admin/clover/oauth/callback';
                        window.location.href = `https://sandbox.dev.clover.com/oauth/authorize?client_id=0S0NEMDA19CJW&merchant_id=${merchantId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;
                      }}
                      disabled={!merchantId.trim() || isConnecting}
                      className="w-full"
                    >
                      {isConnecting ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <ExternalLink className="h-4 w-4 mr-2" />
                      )}
                      Connect to Clover (Direct)
                    </Button>
                    
                    <Button
                      onClick={handleConnectClover}
                      disabled={connectCloverMutation.isPending || isConnecting}
                      className="w-full"
                      variant="secondary"
                    >
                      {(connectCloverMutation.isPending || isConnecting) ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-2" />
                      )}
                      Clear Cache & Connect
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Environment Variables</CardTitle>
              <CardDescription>
                Required environment variables for Clover integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="font-mono text-sm bg-muted p-3 rounded">
                  <div>CLOVER_APP_ID=your_clover_app_id</div>
                  <div>CLOVER_APP_SECRET=your_clover_app_secret</div>
                  <div>CLOVER_ENVIRONMENT=sandbox # or 'production'</div>
                </div>
                <p className="text-sm text-muted-foreground">
                  These must be set in your environment before connecting to Clover. 
                  Get these values from your Clover developer dashboard.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transactions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Payment Transactions
              </CardTitle>
              <CardDescription>
                View and manage all payment transactions processed through Clover
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="flex items-center justify-center h-32">
                  <RefreshCw className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading transactions...</span>
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-8">
                  <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No transactions yet</h3>
                  <p className="text-muted-foreground">Payment transactions will appear here once you start processing payments.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Payment ID</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Card</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                            {format(new Date(transaction.createdAt), 'MMM dd, yyyy')}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {transaction.cloverPaymentId.slice(0, 12)}...
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(transaction.amount)}
                          {transaction.refundAmount > 0 && (
                            <div className="text-sm text-muted-foreground">
                              Refunded: {formatCurrency(transaction.refundAmount)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(transaction.status)}
                        </TableCell>
                        <TableCell>
                          {transaction.cardLast4 ? (
                            <div className="text-sm">
                              <div>{transaction.cardBrand} ****{transaction.cardLast4}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {transaction.status === 'completed' && transaction.refundAmount === 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setRefundDialog({ open: true, transaction })}
                            >
                              Refund
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Refund Dialog */}
      <Dialog open={refundDialog.open} onOpenChange={(open) => setRefundDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogDescription>
              Refund payment for transaction {refundDialog.transaction?.cloverPaymentId}
            </DialogDescription>
          </DialogHeader>
          
          {refundDialog.transaction && (
            <div className="space-y-4">
              <div>
                <Label>Original Amount</Label>
                <p className="text-lg font-medium">{formatCurrency(refundDialog.transaction.amount)}</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="refundAmount">Refund Amount (optional)</Label>
                <Input
                  id="refundAmount"
                  type="number"
                  step="0.01"
                  placeholder="Leave empty for full refund"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Leave empty to refund the full amount
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRefundDialog({ open: false })}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRefund}
              disabled={refundMutation.isPending}
            >
              {refundMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Process Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}