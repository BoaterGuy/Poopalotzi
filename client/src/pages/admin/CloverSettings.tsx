import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  ExternalLink, 
  RefreshCw, 
  AlertTriangle,
  CreditCard,
  DollarSign
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useQuery, useMutation } from '@/lib/queryClient';

interface CloverStatus {
  isConfigured: boolean;
  merchantId?: string;
  environment?: string;
  tokenExpiry?: string;
}

interface PaymentTransaction {
  id: string;
  amount: number;
  status: string;
  date: string;
  description?: string;
}

export default function CloverSettings() {
  const [merchantId, setMerchantId] = useState('PFHDQ8MSX5F81');
  const [isConnecting, setIsConnecting] = useState(false);
  const [cloverStatus, setCloverStatus] = useState<CloverStatus | null>(null);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [statusLoading, setStatusLoading] = useState(true);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch Clover status
  const fetchCloverStatus = async () => {
    try {
      const response = await fetch('/api/admin/clover/status', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setCloverStatus(data);
      }
    } catch (error) {
      console.error('Failed to fetch Clover status:', error);
    } finally {
      setStatusLoading(false);
    }
  };

  // Fetch payment transactions
  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/admin/payments', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
    } finally {
      setTransactionsLoading(false);
    }
  };

  useEffect(() => {
    fetchCloverStatus();
    fetchTransactions();
    
    // Set up intervals for refreshing data
    const statusInterval = setInterval(fetchCloverStatus, 30000);
    const transactionsInterval = setInterval(fetchTransactions, 60000);
    
    return () => {
      clearInterval(statusInterval);
      clearInterval(transactionsInterval);
    };
  }, []);

  // Handle Clover OAuth connection
  const handleConnectClover = async () => {
    if (!merchantId.trim()) {
      toast({
        title: "Error",
        description: "Please enter your Merchant ID",
        variant: "destructive"
      });
      return;
    }

    setIsConnecting(true);
    try {
      const response = await fetch('/api/admin/clover/oauth/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ merchantId })
      });

      if (response.ok) {
        const { authUrl } = await response.json();
        window.location.href = authUrl;
      } else {
        throw new Error('Failed to initiate OAuth');
      }
    } catch (error) {
      console.error('OAuth initiation failed:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Clover. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const getStatusDisplay = () => {
    if (statusLoading) {
      return (
        <div className="flex items-center">
          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          <span>Checking status...</span>
        </div>
      );
    }

    if (cloverStatus?.isConfigured) {
      return (
        <div className="flex items-center">
          <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
          <Badge variant="default" className="bg-green-100 text-green-800">
            Connected
          </Badge>
        </div>
      );
    }

    return (
      <div className="flex items-center">
        <XCircle className="h-4 w-4 mr-2 text-red-600" />
        <Badge variant="destructive">Not Connected</Badge>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Clover Payment Settings</h1>
          <p className="text-lg text-gray-600">
            Connect your Clover merchant account to process payments
          </p>
        </div>

        {/* Connection Status */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between text-xl font-semibold text-gray-800">
              <span>Connection Status</span>
              {getStatusDisplay()}
            </CardTitle>
            <CardDescription className="text-gray-600">
              Current status of your Clover integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            {cloverStatus?.isConfigured ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Merchant ID:</span>
                  <span className="font-mono text-sm">{cloverStatus.merchantId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium">Environment:</span>
                  <Badge variant="outline">{cloverStatus.environment}</Badge>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                No Clover configuration found. Please connect your account below.
              </div>
            )}
          </CardContent>
        </Card>

        {/* OAuth Setup */}
        {!cloverStatus?.isConfigured && (
          <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-xl font-semibold text-gray-800">
                <ExternalLink className="h-5 w-5 mr-2 text-blue-600" />
                Connect Your Clover Account
              </CardTitle>
              <CardDescription className="text-gray-600">
                Use OAuth to securely connect your live Clover merchant account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2 text-lg">Production OAuth Setup</h3>
                  <p className="text-green-700 mb-4">
                    Connect your live Clover account for real payment processing
                  </p>
                  
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="merchantId">Merchant ID</Label>
                      <Input
                        id="merchantId"
                        placeholder="PFHDQ8MSX5F81"
                        value={merchantId}
                        onChange={(e) => setMerchantId(e.target.value)}
                        disabled={isConnecting}
                      />
                      <p className="text-xs text-green-700 mt-1">
                        Your production merchant ID from https://clover.com
                      </p>
                    </div>
                    <Button
                      onClick={handleConnectClover}
                      disabled={isConnecting || !merchantId.trim()}
                      className="w-full bg-green-700 hover:bg-green-800"
                    >
                      {isConnecting ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Connect to Clover
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Transactions */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center text-xl font-semibold text-gray-800">
              <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
              Recent Transactions
            </CardTitle>
            <CardDescription className="text-gray-600">
              Latest payment transactions from your Clover account
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transactionsLoading ? (
              <div className="flex items-center justify-center py-4">
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                <span>Loading transactions...</span>
              </div>
            ) : transactions.length > 0 ? (
              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                    <div>
                      <p className="font-medium">{transaction.description || 'Payment'}</p>
                      <p className="text-sm text-gray-600">{transaction.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${(transaction.amount / 100).toFixed(2)}</p>
                      <Badge variant={transaction.status === 'approved' ? 'default' : 'secondary'}>
                        {transaction.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-4">
                No transactions found
              </div>
            )}
          </CardContent>
        </Card>

        {/* Environment Variables */}
        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl font-semibold text-gray-800">Environment Variables</CardTitle>
            <CardDescription className="text-gray-600">
              Required environment variables for Clover integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="font-mono text-sm bg-muted p-3 rounded">
                <div>CLOVER_APP_ID=8QSDCRTWSBPWT</div>
                <div>CLOVER_APP_SECRET=your_clover_app_secret</div>
                <div>CLOVER_ENVIRONMENT=production</div>
              </div>
              <p className="text-sm text-muted-foreground">
                These must be set in your environment before connecting to Clover. 
                Get these values from your Clover developer dashboard.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}