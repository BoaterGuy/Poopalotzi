/**
 * Payment Routes with Clover Integration
 * 
 * All Clover API calls use regional configuration and proper error handling:
 * - cloverApiBase(...)/v3/... (not www)
 * - Authorization: Bearer <access_token> header
 * - try/catch with meaningful error logging (status, url, body preview)
 * - 401 handling with automatic token refresh and retry
 */

import { Request, Response, NextFunction } from 'express';
import { cloverApiBase, cloverEcommerceBase, type CloverRegion } from '../config/clover';
import { refreshTokenHelper } from './auth';

interface AuthRequest extends Request {
  user?: any;
  isAuthenticated?(): boolean;
}

/**
 * Enhanced fetch wrapper for Clover API calls
 * Includes automatic token refresh on 401 and comprehensive error handling
 */
async function cloverApiFetch(
  url: string, 
  options: RequestInit, 
  merchantId: string,
  accessToken: string,
  retryCount = 0
): Promise<globalThis.Response> {
  
  console.log(`🔗 Clover API Call: ${options.method || 'GET'} ${url}`);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      }
    });

    // Handle successful responses
    if (response.ok) {
      return response;
    }

    // Handle 401 with token refresh (retry once)
    if (response.status === 401 && retryCount === 0) {
      console.log('🔄 Got 401, attempting token refresh...');
      
      try {
        const newAccessToken = await refreshTokenHelper(merchantId);
        console.log('✅ Token refreshed, retrying API call...');
        
        // Retry with new token
        return cloverApiFetch(url, options, merchantId, newAccessToken, retryCount + 1);
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);
        // Fall through to error handling below
      }
    }

    // Log error details
    const bodyPreview = await response.text().then(text => 
      text.length > 400 ? text.substring(0, 400) + '...' : text
    ).catch(() => '[Unable to read response body]');
    
    console.error('❌ Clover API Error:', {
      status: response.status,
      statusText: response.statusText,
      url,
      bodyPreview
    });

    // Throw error with details
    throw new Error(`Clover API Error: ${response.status} ${response.statusText} - ${bodyPreview}`);

  } catch (error) {
    if (error instanceof Error && error.message.includes('Clover API Error:')) {
      throw error; // Re-throw our formatted errors
    }
    
    // Network or other errors
    console.error('❌ Network/Fetch Error:', {
      url,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    throw new Error(`Network error calling Clover API: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create a Clover order
 */
export async function createCloverOrder(
  merchantId: string,
  accessToken: string,
  orderData: {
    total: number;
    currency?: string;
    title?: string;
    note?: string;
  },
  region?: CloverRegion
): Promise<any> {
  const apiBase = cloverApiBase(region || process.env.CLOVER_REGION as CloverRegion);
  const url = `${apiBase}/v3/merchants/${merchantId}/orders`;
  
  const payload = {
    total: orderData.total,
    currency: orderData.currency || 'USD',
    title: orderData.title || 'Marina Service',
    note: orderData.note,
    state: 'open'
  };

  const response = await cloverApiFetch(
    url,
    {
      method: 'POST',
      body: JSON.stringify(payload)
    },
    merchantId,
    accessToken
  );

  return response.json();
}

/**
 * Process payment via Clover ecommerce API
 */
export async function processCloverPayment(
  accessToken: string,
  paymentData: {
    amount: number;
    currency?: string;
    source: string;
    description?: string;
    metadata?: Record<string, any>;
  },
  merchantId: string,
  region?: CloverRegion
): Promise<any> {
  const ecommerceBase = cloverEcommerceBase(region || process.env.CLOVER_REGION as CloverRegion);
  const url = `${ecommerceBase}/v1/charges`;
  
  const payload = {
    amount: paymentData.amount,
    currency: paymentData.currency?.toLowerCase() || 'usd',
    source: paymentData.source,
    description: paymentData.description || 'Marina Service Payment',
    metadata: paymentData.metadata || {}
  };

  const response = await cloverApiFetch(
    url,
    {
      method: 'POST',
      body: JSON.stringify(payload)
    },
    merchantId,
    accessToken
  );

  return response.json();
}

/**
 * Get merchant information
 */
export async function getCloverMerchant(
  merchantId: string,
  accessToken: string,
  region?: CloverRegion
): Promise<any> {
  const apiBase = cloverApiBase(region || process.env.CLOVER_REGION as CloverRegion);
  const url = `${apiBase}/v3/merchants/${merchantId}`;
  
  const response = await cloverApiFetch(
    url,
    { method: 'GET' },
    merchantId,
    accessToken
  );

  return response.json();
}

/**
 * Get orders for merchant
 */
export async function getCloverOrders(
  merchantId: string,
  accessToken: string,
  filters?: {
    limit?: number;
    offset?: number;
    filter?: string;
  },
  region?: CloverRegion
): Promise<any> {
  const apiBase = cloverApiBase(region || process.env.CLOVER_REGION as CloverRegion);
  let url = `${apiBase}/v3/merchants/${merchantId}/orders`;
  
  if (filters) {
    const params = new URLSearchParams();
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());
    if (filters.filter) params.append('filter', filters.filter);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
  }
  
  const response = await cloverApiFetch(
    url,
    { method: 'GET' },
    merchantId,
    accessToken
  );

  return response.json();
}

/**
 * Create a payment on an existing order
 */
export async function createCloverPayment(
  merchantId: string,
  orderId: string,
  accessToken: string,
  paymentData: {
    amount: number;
    tipAmount?: number;
    taxAmount?: number;
    source: string;
  },
  region?: CloverRegion
): Promise<any> {
  const apiBase = cloverApiBase(region || process.env.CLOVER_REGION as CloverRegion);
  const url = `${apiBase}/v3/merchants/${merchantId}/orders/${orderId}/payments`;
  
  const payload = {
    amount: paymentData.amount,
    tipAmount: paymentData.tipAmount || 0,
    taxAmount: paymentData.taxAmount || 0,
    source: paymentData.source
  };

  const response = await cloverApiFetch(
    url,
    {
      method: 'POST',
      body: JSON.stringify(payload)
    },
    merchantId,
    accessToken
  );

  return response.json();
}

/**
 * Get payment details
 */
export async function getCloverPayment(
  merchantId: string,
  paymentId: string,
  accessToken: string,
  region?: CloverRegion
): Promise<any> {
  const apiBase = cloverApiBase(region || process.env.CLOVER_REGION as CloverRegion);
  const url = `${apiBase}/v3/merchants/${merchantId}/payments/${paymentId}`;
  
  const response = await cloverApiFetch(
    url,
    { method: 'GET' },
    merchantId,
    accessToken
  );

  return response.json();
}

/**
 * Refund a payment
 */
export async function refundCloverPayment(
  merchantId: string,
  paymentId: string,
  accessToken: string,
  refundData: {
    amount?: number;
    fullRefund?: boolean;
  },
  region?: CloverRegion
): Promise<any> {
  const apiBase = cloverApiBase(region || process.env.CLOVER_REGION as CloverRegion);
  const url = `${apiBase}/v3/merchants/${merchantId}/payments/${paymentId}/refunds`;
  
  let payload: any = {};
  if (refundData.fullRefund) {
    payload.fullRefund = true;
  } else if (refundData.amount) {
    payload.amount = refundData.amount;
  }

  const response = await cloverApiFetch(
    url,
    {
      method: 'POST',
      body: JSON.stringify(payload)
    },
    merchantId,
    accessToken
  );

  return response.json();
}