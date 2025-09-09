/**
 * Server-side Clover API Helpers
 * 
 * These functions use fetch/undici to make direct calls to Clover APIs
 * Import cloverApiBase for regional support
 */

import { cloverApiBase, cloverEcommerceBase, type CloverRegion } from '../../src/config/clover';

/**
 * Generic Clover API GET request helper (server-side only)
 */
export async function cloverGet(path: string, token: string, region?: CloverRegion): Promise<Response> {
  const apiBase = cloverApiBase(region || process.env.CLOVER_REGION as CloverRegion);
  const url = `${apiBase}${path}`;
  
  return fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });
}

/**
 * Get merchant information (server-side only)
 */
export async function getMerchant(merchantId: string, token: string, region?: CloverRegion): Promise<any> {
  const response = await cloverGet(`/v3/merchants/${merchantId}`, token, region);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get merchant: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  return response.json();
}

/**
 * Get merchant orders (server-side only)
 */
export async function getMerchantOrders(merchantId: string, token: string, region?: CloverRegion): Promise<any> {
  const response = await cloverGet(`/v3/merchants/${merchantId}/orders`, token, region);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get orders: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  return response.json();
}

/**
 * Get merchant customers (server-side only)
 */
export async function getMerchantCustomers(merchantId: string, token: string, region?: CloverRegion): Promise<any> {
  const response = await cloverGet(`/v3/merchants/${merchantId}/customers`, token, region);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get customers: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  return response.json();
}

/**
 * Create an order (server-side only)
 */
export async function createOrder(merchantId: string, token: string, orderData: any, region?: CloverRegion): Promise<any> {
  const apiBase = cloverApiBase(region || process.env.CLOVER_REGION as CloverRegion);
  const url = `${apiBase}/v3/merchants/${merchantId}/orders`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(orderData)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create order: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  return response.json();
}

/**
 * Process payment via ecommerce API (server-side only)
 */
export async function processEcommercePayment(token: string, paymentData: any, region?: CloverRegion): Promise<any> {
  const ecommerceBase = cloverEcommerceBase(region || process.env.CLOVER_REGION as CloverRegion);
  const url = `${ecommerceBase}/v1/charges`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(paymentData)
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to process payment: ${response.status} ${response.statusText} - ${errorText}`);
  }
  
  return response.json();
}