/**
 * Simplified Clover Settings Page - Production Only
 * Avoids React Query complexity that was causing TypeScript errors
 */

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
  AlertTriangle
} from 'lucide-react';

interface CloverStatus {
  isConfigured: boolean;
  merchantId?: string;
  environment?: string;
  tokenExpiry?: string;

export default function CloverSettingsSimple() {
  const [merchantId, setMerchantId] = useState('PFHDQ8MSX5F81');
  const [isConnecting, setIsConnecting] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [cloverStatus, setCloverStatus] = useState<CloverStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Fetch Clover status
  const fetchCloverStatus = async () => {
    try {
      const response = await fetch('/api/admin/clover/status', {
        credentials: 'include'
      if (response.ok) {
        const data = await response.json();
        setCloverStatus(data);
    } catch (error) {
      console.error('Failed to fetch Clover status:', error);
    } finally {
      setIsLoading(false);
  };

  useEffect(() => {
    fetchCloverStatus();
    
    // Check URL parameters for OAuth callback status
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');
    
    if (success === 'connected') {
      toast({
        title: "Clover Connected",
        description: "Your Clover account has been successfully connected!",
      window.history.replaceState({}, '', '/admin/clover-settings');
      fetchCloverStatus();
    } else if (error) {
      toast({
        title: "Connection Failed",
        description: error === 'oauth_failed' ? "OAuth authorization failed. Please try again." : 
                    error === 'missing_params' ? "Missing authorization parameters." :
                    "Failed to connect your Clover account. Please try again.",
        variant: "destructive",
      window.history.replaceState({}, '', '/admin/clover-settings');
  }, [toast]);

  // Handle OAuth connection
  const handleConnectClover = async () => {
    if (!merchantId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a Merchant ID",
        variant: "destructive",
      return;

    setIsConnecting(true);
    try {
      const response = await fetch('/api/admin/clover/oauth/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ merchantId: merchantId.trim() }),
        credentials: 'include'

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OAuth initiation failed: ${response.status}`);

      const data = await response.json();
      
      // Redirect to Clover OAuth
      window.location.href = data.authUrl;
      
    } catch (error) {
      setIsConnecting(false);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "OAuth initiation failed",
        variant: "destructive",
  };

  // Handle manual OAuth completion
  const handleManualComplete = async () => {
    if (!manualCode.trim() || !merchantId.trim()) {
      toast({
        title: "Error",
        description: "Please enter both merchant ID and authorization code",
        variant: "destructive",
      return;

    setIsConnecting(true);
    try {
      const response = await fetch('/api/admin/clover/oauth/manual-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: manualCode.trim(),
          merchantId: merchantId.trim()
        })

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "Success",
          description: "Clover connected successfully!",
        setManualCode('');
        fetchCloverStatus();
      } else {
        throw new Error(data.error || 'Manual completion failed');
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Manual completion failed",
        variant: "destructive",
    } finally {
      setIsConnecting(false);
  };

  const getStatusDisplay = () => {
    if (isLoading) {
      return (
        <div className="flex items-center">
          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          <span>Checking status...</span>
        </div>
      );

    if (cloverStatus?.isConfigured) {
      return (
        <div className="flex items-center">
          <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
          <Badge variant="default" className="bg-green-100 text-green-800">
            Connected
          </Badge>
        </div>
      );

    return (
      <div className="flex items-center">
        <XCircle className="h-4 w-4 mr-2 text-red-600" />
        <Badge variant="destructive">Not Connected</Badge>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Clover Payment Settings</h1>
        <p className="text-muted-foreground">
          Connect your Clover merchant account to process payments
        </p>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Connection Status</span>
            {getStatusDisplay()}
          </CardTitle>
          <CardDescription>
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ExternalLink className="h-5 w-5 mr-2" />
              Connect Your Clover Account
            </CardTitle>
            <CardDescription>
              Use OAuth to securely connect your live Clover merchant account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h3 className="font-medium text-green-800 mb-2">Production OAuth Setup</h3>
                <p className="text-sm text-green-700 mb-4">
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
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ExternalLink className="h-4 w-4 mr-2" />
                    )}
                    Connect to Live Clover Account
                  </Button>
                  <div className="text-xs text-green-600 mt-2">
                    <strong>This will redirect to:</strong> https://www.clover.com/oauth/authorize<br/>
                    <strong>For production payments only</strong>
                  </div>
                </div>
              </div>

              {/* Manual OAuth completion */}
              {isConnecting && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">OAuth Taking Too Long?</h4>
                  <p className="text-sm text-blue-700 mb-3">
                    If OAuth gets stuck, you can complete it manually with the authorization code:
                  </p>
                  <div className="space-y-2">
                    <Input
                      type="text"
                      placeholder="Paste authorization code from OAuth callback URL"
                      value={manualCode}
                      onChange={(e) => setManualCode(e.target.value)}
                    />
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={handleManualComplete}
                      disabled={!manualCode.trim() || !merchantId.trim()}
                    >
                      Complete Connection Manually
                    </Button>
                  </div>
                  <div className="text-xs text-blue-600 mt-2">
                    <strong>Instructions:</strong><br/>
                    1. Complete Clover authorization in the popup/tab<br/>
                    2. Copy the "code=" parameter from the final URL<br/>
                    3. Paste it above and click "Complete Connection Manually"
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Environment Variables */}
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
  );
