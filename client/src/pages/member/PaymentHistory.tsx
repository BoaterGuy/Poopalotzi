import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard, Copy, Search, Filter, CheckCircle, XCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@/lib/queryClient";

interface PaymentTransaction {
  id: number;
  cloverPaymentId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string | null;
  cardLast4: string | null;
  cardBrand: string | null;
  cloverResponse: any;
  errorMessage: string | null;
  refundAmount: number | null;
  refundedAt: string | null;
  createdAt: string;
  updatedAt: string;
  requestId: number | null;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount / 100);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case 'failed':
      return <XCircle className="h-4 w-4 text-red-500" />;
    case 'pending':
      return <Clock className="h-4 w-4 text-yellow-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'bg-green-500';
    case 'failed':
      return 'bg-red-500';
    case 'pending':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-500';
  }
};

export default function PaymentHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  const { data: payments, isLoading } = useQuery<PaymentTransaction[]>({
    queryKey: ['/api/payments/history'],
  });

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`,
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const filteredPayments = payments?.filter(payment => {
    const matchesSearch = searchTerm === "" || 
      payment.cloverPaymentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (payment.cardLast4 && payment.cardLast4.includes(searchTerm));
    
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4 w-1/3"></div>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <CreditCard className="h-8 w-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Payment History</h1>
      </div>

      {/* Search and Filter Controls */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by transaction ID, order ID, or card last 4..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment List */}
      {filteredPayments.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No payments found</h3>
            <p className="text-gray-500">
              {payments?.length === 0 
                ? "You haven't made any payments yet." 
                : "No payments match your search criteria."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPayments.map((payment) => (
            <Card key={payment.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(payment.status)}
                    <div>
                      <CardTitle className="text-lg">
                        {formatCurrency(payment.amount)}
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        {formatDate(payment.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    className={`${getStatusColor(payment.status)} text-white`}
                  >
                    {payment.status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Transaction Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Transaction ID</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                        {payment.cloverPaymentId}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(payment.cloverPaymentId, "Transaction ID")}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700">Order ID</label>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                        {payment.orderId}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(payment.orderId, "Order ID")}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                {payment.cardLast4 && payment.cardBrand && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Payment Method</label>
                    <div className="flex items-center gap-2 mt-1">
                      <CreditCard className="h-4 w-4 text-gray-500" />
                      <span className="text-sm">
                        {payment.cardBrand} ending in {payment.cardLast4}
                      </span>
                    </div>
                  </div>
                )}

                {/* Refund Information */}
                {payment.refundAmount && payment.refundedAt && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-yellow-800">
                      Refunded: {formatCurrency(payment.refundAmount)}
                    </p>
                    <p className="text-xs text-yellow-600">
                      {formatDate(payment.refundedAt)}
                    </p>
                  </div>
                )}

                {/* Error Message */}
                {payment.errorMessage && payment.status === 'failed' && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-red-800">Error</p>
                    <p className="text-xs text-red-600">{payment.errorMessage}</p>
                  </div>
                )}

                {/* Additional Details from Clover Response */}
                {payment.cloverResponse?.cloverOrderDetails && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm font-medium text-blue-800 mb-2">Order Details</p>
                    <div className="space-y-1 text-xs text-blue-700">
                      {payment.cloverResponse.cloverOrderDetails.customerName && (
                        <p><strong>Customer:</strong> {payment.cloverResponse.cloverOrderDetails.customerName}</p>
                      )}
                      {payment.cloverResponse.cloverOrderDetails.description && (
                        <p><strong>Service:</strong> {payment.cloverResponse.cloverOrderDetails.description}</p>
                      )}
                      {payment.cloverResponse.taxAmount && (
                        <p><strong>Tax:</strong> {formatCurrency(payment.cloverResponse.taxAmount)}</p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}