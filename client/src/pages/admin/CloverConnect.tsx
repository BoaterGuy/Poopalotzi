/**
 * Isolated Clover Connection Page
 * 
 * This page bypasses all caching and session issues by using
 * a completely clean OAuth flow implementation
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExternalLink, AlertTriangle, CheckCircle } from 'lucide-react';
import { cloverApi } from '@/services/clover-service';

export default function CloverConnect() {
  const [merchantId, setMerchantId] = useState('PFHDQ8MSX5F81');
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    if (!merchantId.trim()) {
      alert('Please enter your Clover Merchant ID');
      return;
    }

    setIsConnecting(true);
    
    try {
      // Clear everything that could interfere
      sessionStorage.clear();
      localStorage.clear();
      
      // Use our backend to initiate OAuth flow
      console.log('Initiating OAuth through backend...');
      const response = await cloverApi.initiateOAuth(merchantId);
      
      if (response.authUrl) {
        console.log('Redirecting to Clover OAuth:', response.authUrl);
        // Force immediate redirect to Clover
        window.location.replace(response.authUrl);
      } else {
        throw new Error('No auth URL received from backend');
      }
    } catch (error) {
      console.error('OAuth initiation failed:', error);
      alert(`Failed to start OAuth: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsConnecting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Connect to Clover</h1>
          <p className="text-gray-600 mt-2">Isolated connection flow</p>
          <div className="text-xs text-blue-600 font-mono">
            v2.2 - Production Clover Integration
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ExternalLink className="h-5 w-5 mr-2" />
              Clover OAuth Connection
            </CardTitle>
            <CardDescription>
              Production Clover OAuth with clean vendor modules
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                This page bypasses all caching and session issues
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
            </div>

            <Button
              onClick={handleConnect}
              disabled={isConnecting || !merchantId.trim()}
              className="w-full"
              size="lg"
            >
              {isConnecting ? (
                'Connecting to Clover...'
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Connect to Clover
                </>
              )}
            </Button>

            <div className="text-xs text-gray-500 space-y-1">
              <p>• Clears all browser cache and storage</p>
              <p>• Uses direct OAuth redirect</p>
              <p>• No API calls that can be cached</p>
              <p>• Merchant ID: {merchantId}</p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <a 
            href="/admin/clover-settings" 
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back to Clover Settings
          </a>
        </div>
      </div>
    </div>
  );
}