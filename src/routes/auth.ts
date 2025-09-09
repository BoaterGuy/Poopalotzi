/**
 * Clover OAuth Authentication Routes
 * 
 * Handles OAuth authorization flow with standardized endpoints:
 * - Authorization redirect to Clover
 * - Callback handling with token exchange
 * - Token refresh functionality
 * - Storage of access tokens and merchant data
 */

import { Request, Response } from 'express';
import { CLOVER_OAUTH_AUTHORIZE, CLOVER_OAUTH_TOKEN } from '../config/clover';

export interface CloverTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

export interface CloverAuthState {
  merchant_id: string;
  redirect_uri: string;
  timestamp: number;
}

/**
 * Initiate OAuth authorization flow
 * Redirects user to Clover authorization page
 */
export async function authorizeHandler(req: Request, res: Response) {
  try {
    const { merchant_id, redirect_uri } = req.body;
    
    if (!merchant_id || !redirect_uri) {
      return res.status(400).json({ 
        error: 'merchant_id and redirect_uri are required' 
      });
    }

    const client_id = process.env.CLOVER_APP_ID;
    if (!client_id) {
      return res.status(500).json({ 
        error: 'CLOVER_APP_ID not configured' 
      });
    }

    // Create state parameter for security
    const state = Buffer.from(JSON.stringify({
      merchant_id,
      redirect_uri,
      timestamp: Date.now()
    } as CloverAuthState)).toString('base64');

    // Build authorization URL
    const authUrl = new URL(CLOVER_OAUTH_AUTHORIZE);
    authUrl.searchParams.set('client_id', client_id);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('redirect_uri', redirect_uri);
    authUrl.searchParams.set('state', state);

    console.log('=== CLOVER OAUTH AUTHORIZATION ===');
    console.log('Authorization URL:', authUrl.toString());
    console.log('Merchant ID:', merchant_id);
    console.log('Redirect URI:', redirect_uri);
    console.log('State:', state);

    res.json({
      authUrl: authUrl.toString(),
      merchant_id,
      redirect_uri,
      state
    });

  } catch (error) {
    console.error('OAuth authorization error:', error);
    res.status(500).json({ 
      error: 'Failed to initiate OAuth flow' 
    });
  }
}

/**
 * Handle OAuth callback
 * Exchange authorization code for access token
 */
export async function callbackHandler(req: Request, res: Response) {
  try {
    console.log('=== CLOVER OAUTH CALLBACK ===');
    console.log('Query params:', req.query);
    
    const { code, state, error, error_description } = req.query;

    // Handle OAuth errors
    if (error) {
      console.error('Clover OAuth error:', error, error_description);
      return res.status(400).json({
        error: 'OAuth authorization failed',
        details: error_description || error
      });
    }

    // Validate required parameters
    if (!code || !state) {
      return res.status(400).json({
        error: 'Missing required OAuth parameters',
        missing: !code ? 'code' : 'state'
      });
    }

    // Parse and validate state
    let authState: CloverAuthState;
    try {
      authState = JSON.parse(Buffer.from(state as string, 'base64').toString());
    } catch (stateError) {
      return res.status(400).json({
        error: 'Invalid state parameter'
      });
    }

    // Validate state timestamp (5 minute expiry)
    if (Date.now() - authState.timestamp > 5 * 60 * 1000) {
      return res.status(400).json({
        error: 'OAuth state expired'
      });
    }

    // Exchange code for tokens
    const tokenResponse = await exchangeCodeForTokens(
      code as string,
      authState.redirect_uri,
      authState.merchant_id
    );

    console.log('Token exchange successful');
    console.log('Merchant ID:', authState.merchant_id);
    console.log('Expires in:', tokenResponse.expires_in);

    // Store tokens and merchant data
    await storeTokens({
      merchant_id: authState.merchant_id,
      access_token: tokenResponse.access_token,
      refresh_token: tokenResponse.refresh_token,
      expires_in: tokenResponse.expires_in
    });

    // Return success response
    res.json({
      success: true,
      merchant_id: authState.merchant_id,
      expires_in: tokenResponse.expires_in,
      message: 'OAuth authorization successful'
    });

  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({
      error: 'Failed to complete OAuth flow',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Exchange authorization code for access tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  redirect_uri: string,
  merchant_id: string
): Promise<CloverTokenResponse> {
  const client_id = process.env.CLOVER_APP_ID;
  const client_secret = process.env.CLOVER_APP_SECRET;

  if (!client_id || !client_secret) {
    throw new Error('Clover app credentials not configured');
  }

  // Prepare form data for token exchange
  const formData = new URLSearchParams();
  formData.append('client_id', client_id);
  formData.append('client_secret', client_secret);
  formData.append('code', code);
  formData.append('redirect_uri', redirect_uri);

  console.log('=== TOKEN EXCHANGE ===');
  console.log('URL:', CLOVER_OAUTH_TOKEN);
  console.log('Form data:', {
    client_id,
    code: code.substring(0, 10) + '...',
    redirect_uri,
    client_secret: '***'
  });

  const response = await fetch(CLOVER_OAUTH_TOKEN, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: formData
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Token exchange failed:', response.status, errorText);
    throw new Error(`Token exchange failed: ${response.status} ${errorText}`);
  }

  const tokenData: CloverTokenResponse = await response.json();
  console.log('Token exchange successful');
  
  return tokenData;
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refresh_token: string): Promise<CloverTokenResponse> {
  const client_id = process.env.CLOVER_APP_ID;
  const client_secret = process.env.CLOVER_APP_SECRET;

  if (!client_id || !client_secret) {
    throw new Error('Clover app credentials not configured');
  }

  const formData = new URLSearchParams();
  formData.append('client_id', client_id);
  formData.append('client_secret', client_secret);
  formData.append('grant_type', 'refresh_token');
  formData.append('refresh_token', refresh_token);

  console.log('=== TOKEN REFRESH ===');
  console.log('URL:', CLOVER_OAUTH_TOKEN);

  const response = await fetch(CLOVER_OAUTH_TOKEN, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json'
    },
    body: formData
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Token refresh failed:', response.status, errorText);
    throw new Error(`Token refresh failed: ${response.status} ${errorText}`);
  }

  const tokenData: CloverTokenResponse = await response.json();
  console.log('Token refresh successful');
  
  return tokenData;
}

/**
 * Store tokens and merchant data
 * This function should be implemented to store in your database
 */
async function storeTokens(data: {
  merchant_id: string;
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}) {
  // TODO: Implement storage logic
  // This should save to your database/storage system
  console.log('Storing tokens for merchant:', data.merchant_id);
  console.log('Token expires in:', data.expires_in, 'seconds');
  
  // Example implementation would call your storage service:
  // await storage.saveCloverConfiguration({
  //   merchantId: data.merchant_id,
  //   accessToken: data.access_token,
  //   refreshToken: data.refresh_token,
  //   tokenExpiresAt: new Date(Date.now() + (data.expires_in * 1000))
  // });
}

/**
 * Helper to refresh tokens when needed
 */
export async function refreshTokenHelper(merchant_id: string): Promise<string> {
  // TODO: Implement token refresh logic
  // 1. Load current refresh token from storage
  // 2. Call refreshAccessToken()
  // 3. Store new tokens
  // 4. Return new access token
  
  console.log('Token refresh needed for merchant:', merchant_id);
  throw new Error('Token refresh not yet implemented');
}