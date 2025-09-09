import { getTokens, upsertTokens } from '../store/token-store';
import { CLOVER_OAUTH_TOKEN } from '../config/clover';

interface CloverTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

/**
 * Refresh access token for a merchant using their refresh token
 */
export async function refreshToken(merchantId: string): Promise<string> {
  // Load current tokens from store
  const storedTokens = await getTokens(merchantId);
  
  if (!storedTokens || !storedTokens.refresh_token) {
    throw new Error(`No refresh token available for merchant ${merchantId}`);
  }
  
  const client_id = process.env.CLOVER_APP_ID;
  const client_secret = process.env.CLOVER_APP_SECRET;
  const redirect_uri = process.env.CLOVER_REDIRECT_URI;
  
  if (!client_id || !client_secret || !redirect_uri) {
    throw new Error('Clover app credentials not configured in environment');
  }
  
  console.log('🔄 Refreshing token for merchant:', merchantId);
  
  // POST to Clover OAuth token endpoint
  const response = await fetch(CLOVER_OAUTH_TOKEN, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id,
      client_secret,
      refresh_token: storedTokens.refresh_token,
      redirect_uri
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Token refresh failed:', response.status, errorText);
    throw new Error(`Token refresh failed: ${response.status} ${errorText}`);
  }

  const tokenData: CloverTokenResponse = await response.json();
  console.log('✅ Token refresh successful');
  
  // Calculate new expiry time
  const token_expires_at = Date.now() + (tokenData.expires_in * 1000);
  
  // Save new tokens via upsert
  await upsertTokens({
    merchantId,
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token || storedTokens.refresh_token,
    token_expires_at
  });
  
  return tokenData.access_token;
}