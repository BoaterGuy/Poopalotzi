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

export default function CloverConnect() {
  const [merchantId, setMerchantId] = useState('PFHDQ8MSX5F81');
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = () => {
    if (!merchantId.trim()) {
      alert('Please enter your Clover Merchant ID');
      return;
    }

    setIsConnecting(true);
    
    // Clear everything that could interfere
    sessionStorage.clear();
    localStorage.clear();
    
    // Use production Clover configuration
    const redirectUri = window.location.origin.replace('http:', 'https:') + '/api/admin/clover/oauth/callback';
    const cloverUrl = `https://www.clover.com/oauth/authorize?client_id=8QSDCRTWSBPWT&merchant_id=${merchantId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${Date.now()}`;
    
    console.log('Redirecting to Clover OAuth:', cloverUrl);
    
    // Force immediate redirect
    window.location.replace(cloverUrl);
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