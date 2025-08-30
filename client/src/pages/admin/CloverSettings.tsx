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

export default function CloverSettings() {
  const [merchantId, setMerchantId] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [refundDialog, setRefundDialog] = useState<{ open: boolean; transaction?: PaymentTransaction }>({ open: false });
  const [refundAmount, setRefundAmount] = useState('');
  const [manualCode, setManualCode] = useState('');
  const { toast } = useToast();
  // React Query removed

  // Get Clover configuration status
  // React Query removed
    refetchInterval: 30000 // Refresh every 30 seconds

  // Get payment transactions
  // React Query removed
    refetchInterval: 60000 // Refresh every minute

  // Check URL parameters for OAuth callback status
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');
    
    if (success === 'connected') {
      toast({
        title: "Clover Connected",
        description: "Your Clover account has been successfully connected!",
      // Clean up URL
      window.history.replaceState({}, '', '/admin/clover-settings');
    } else if (error) {
      toast({
        title: "Connection Failed",
        description: error === 'oauth_failed' ? "OAuth authorization failed. Please try again." : 
                    error === 'missing_params' ? "Missing authorization parameters." :
                    "Failed to connect your Clover account. Please try again.",
        variant: "destructive",
      // Clean up URL
      window.history.replaceState({}, '', '/admin/clover-settings');
  }, [toast, queryClient]);

  // Initiate OAuth flow using server-side endpoint
  // React Query mutation removed
      console.log('Making API request to initiate OAuth...');
      try {
        const response = await fetch('/api/admin/clover/oauth/initiate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ merchantId }),
          credentials: 'include'
        
        console.log('API response status:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API error:', errorText);
          throw new Error(`Failed to initiate OAuth flow: ${response.status}`);
        
        const data = await response.json();
        console.log('API response data:', data);
        return data;
      } catch (error) {
        console.error('OAuth initiation error:', error);
        throw error;
    },
      setIsConnecting(true);
      console.log('Redirecting to OAuth URL:', data.authUrl);
      // Redirect to Clover OAuth
      window.location.href = data.authUrl;
    },
      console.error('OAuth mutation error:', error);
      toast({
        title: "Connection Error",
        description: error.message || "Failed to initiate Clover connection",
        variant: "destructive",
      setIsConnecting(false);

  // Disconnect Clover
  // React Query mutation removed
      const response = await apiRequest('DELETE', '/api/admin/clover/config');
