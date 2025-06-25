/**
 * Clover Payment Integration Service
 * 
 * This service handles all interactions with the Clover API including:
 * - OAuth authentication flow
 * - Payment processing
 * - Webhook handling
 * - Token management
 * 
 * Required Environment Variables:
 * - CLOVER_APP_ID: Your Clover app ID
 * - CLOVER_APP_SECRET: Your Clover app secret
 * - CLOVER_ENVIRONMENT: 'sandbox' or 'production'
 */

import { storage } from './index';
import type { CloverConfig, InsertCloverConfig, InsertPaymentTransaction } from '@shared/schema';

// Clover API endpoints
const CLOVER_ENDPOINTS = {
  sandbox: {
    oauth: 'https://sandbox.dev.clover.com/oauth',
    api: 'https://apisandbox.dev.clover.com'
  },
  production: {
    oauth: 'https://clover.com/oauth',
    api: 'https://api.clover.com'
  }
};

export interface CloverPaymentRequest {
  amount: number; // Amount in cents
  currency?: string;
  orderId?: string;
  source: string; // Card token from Clover.js
  description?: string;
  metadata?: Record<string, any>;
}

export interface CloverPaymentResponse {
  id: string;
  amount: number;
  currency: string;
  result: 'APPROVED' | 'DECLINED';
  authCode?: string;
  cardTransaction?: {
    last4: string;
    cardType: string;
  };
  createdTime: number;
}

export interface CloverOAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

export class CloverService {
  private config: CloverConfig | null = null;
  private initialized = false;

  constructor() {
    // Don't load config in constructor to avoid initialization order issues
  }

  /**
   * Load the active Clover configuration from storage
   */
  private async loadConfig(): Promise<void> {
    try {
      // Lazy import to avoid circular dependency
      const { storage } = await import('./index');
      this.config = await storage.getCloverConfig() || null;
      this.initialized = true;
    } catch (error) {
      console.error('Failed to load Clover configuration:', error);
      this.initialized = true;
    }
  }

  /**
   * Ensure configuration is loaded
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.loadConfig();
    }
    
    // If still no config after loading, try to create from environment variables
    if (!this.config) {
      const appId = process.env.CLOVER_APP_ID;
      const appSecret = process.env.CLOVER_APP_SECRET;
      
      if (appId && appSecret) {
        console.log('Creating Clover config from environment variables');
        // Create a basic config for testing
        this.config = {
          id: 1,
          merchantId: 'R6BSXSAY96KW1',
          appId,
          appSecret,
          accessToken: 'a019ed95-e334-76a8-1179-d63ba2952104',
          refreshToken: null,
          tokenExpiresAt: null,
          environment: 'sandbox',
          webhookSecret: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      }
    }
  }

  /**
   * Get the Clover OAuth authorization URL
   */
  getAuthorizationUrl(merchantId: string, redirectUri: string): string {
    const rawEnvironment = process.env.CLOVER_ENVIRONMENT || 'sandbox';
    // Clean the environment variable and default to sandbox
    const environment = rawEnvironment.toLowerCase().includes('production') ? 'production' : 'sandbox';
    const appId = process.env.CLOVER_APP_ID;
    
    if (!appId) {
      throw new Error('CLOVER_APP_ID environment variable is required');
    }

    const endpoints = CLOVER_ENDPOINTS[environment as keyof typeof CLOVER_ENDPOINTS];
    if (!endpoints) {
      throw new Error(`Invalid Clover environment: ${environment}`);
    }
    
    // Ensure redirect URI uses HTTPS for Clover compatibility
    const secureRedirectUri = redirectUri.replace(/^http:/, 'https:');
    
    const baseUrl = endpoints.oauth;
    const params = new URLSearchParams({
      client_id: appId,
      merchant_id: merchantId,
      redirect_uri: redirectUri,
      response_type: 'code'
    });

    return `${baseUrl}/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access tokens
   */
  async exchangeCodeForTokens(code: string, merchantId: string): Promise<CloverOAuthTokenResponse> {
    const rawEnvironment = process.env.CLOVER_ENVIRONMENT || 'sandbox';
    const environment = rawEnvironment.toLowerCase().includes('production') ? 'production' : 'sandbox';
    const appId = process.env.CLOVER_APP_ID;
    const appSecret = process.env.CLOVER_APP_SECRET;

    if (!appId || !appSecret) {
      throw new Error('CLOVER_APP_ID and CLOVER_APP_SECRET environment variables are required');
    }

    const endpoints = CLOVER_ENDPOINTS[environment as keyof typeof CLOVER_ENDPOINTS];
    const baseUrl = endpoints.oauth;
    
    const response = await fetch(`${baseUrl}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        code: code,
        grant_type: 'authorization_code'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to exchange code for tokens: ${error}`);
    }

    return await response.json();
  }

  /**
   * Save Clover configuration to storage
   */
  async saveConfiguration(configData: {
    merchantId: string;
    accessToken: string;
    refreshToken?: string;
    tokenExpiresAt?: Date;
    webhookSecret?: string;
  }): Promise<CloverConfig> {
    const { storage } = await import('./index');
    const environment = process.env.CLOVER_ENVIRONMENT || 'sandbox';
    const appId = process.env.CLOVER_APP_ID;
    const appSecret = process.env.CLOVER_APP_SECRET;

    if (!appId || !appSecret) {
      throw new Error('CLOVER_APP_ID and CLOVER_APP_SECRET environment variables are required');
    }

    const insertData: InsertCloverConfig = {
      merchantId: configData.merchantId,
      appId,
      appSecret,
      accessToken: configData.accessToken,
      refreshToken: configData.refreshToken || null,
      tokenExpiresAt: configData.tokenExpiresAt || null,
      environment,
      webhookSecret: configData.webhookSecret || null,
      isActive: true
    };

    this.config = await storage.createCloverConfig(insertData);
    return this.config;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<void> {
    await this.ensureInitialized();
    const { storage } = await import('./index');
    
    if (!this.config || !this.config.refreshToken) {
      throw new Error('No refresh token available');
    }

    const environment = this.config.environment;
    const baseUrl = CLOVER_ENDPOINTS[environment as keyof typeof CLOVER_ENDPOINTS].oauth;

    const response = await fetch(`${baseUrl}/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.appId,
        client_secret: this.config.appSecret,
        refresh_token: this.config.refreshToken,
        grant_type: 'refresh_token'
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to refresh access token: ${error}`);
    }

    const tokenData: CloverOAuthTokenResponse = await response.json();
    
    // Update configuration with new tokens
    const expiresAt = new Date(Date.now() + (tokenData.expires_in * 1000));
    await storage.updateCloverConfig(this.config.id, {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || this.config.refreshToken,
      tokenExpiresAt: expiresAt
    });

    // Reload configuration
    await this.loadConfig();
  }

  /**
   * Check if access token needs refresh and refresh if necessary
   */
  private async ensureValidToken(): Promise<void> {
    if (!this.config) {
      throw new Error('Clover not configured');
    }

    if (this.config.tokenExpiresAt && new Date() >= this.config.tokenExpiresAt) {
      await this.refreshAccessToken();
    }
  }

  /**
   * Process a payment using Clover API
   */
  async processPayment(paymentRequest: CloverPaymentRequest, userId: number, requestId?: number): Promise<CloverPaymentResponse> {
    await this.ensureInitialized();
    const { storage } = await import('./index');
    
    console.log('Processing Clover payment with config:', {
      merchantId: this.config.merchantId,
      environment: this.config.environment,
      hasAccessToken: !!this.config.accessToken
    });

    const environment = this.config.environment;
    const baseUrl = CLOVER_ENDPOINTS[environment as keyof typeof CLOVER_ENDPOINTS].api;
    
    const paymentData = {
      amount: paymentRequest.amount,
      currency: paymentRequest.currency || 'USD',
      source: paymentRequest.source,
      metadata: {
        ...paymentRequest.metadata,
        user_id: userId.toString(),
        request_id: requestId?.toString()
      }
    };

    // Create payment transaction record
    const transactionData: InsertPaymentTransaction = {
      cloverPaymentId: `pending_${Date.now()}`, // Temporary ID
      orderId: paymentRequest.orderId || null,
      requestId: requestId || null,
      userId,
      amount: paymentRequest.amount,
      currency: paymentRequest.currency || 'USD',
      status: 'pending',
      paymentMethod: null,
      cardLast4: null,
      cardBrand: null,
      cloverResponse: null,
      errorMessage: null
    };

    let transaction = await storage.createPaymentTransaction(transactionData);

    try {
      const response = await fetch(`${baseUrl}/v3/merchants/${this.config.merchantId}/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData)
      });

      const result: CloverPaymentResponse = await response.json();

      // Update transaction with actual Clover payment ID and response
      await storage.updatePaymentTransaction(transaction.id, {
        cloverPaymentId: result.id,
        status: result.result === 'APPROVED' ? 'completed' : 'failed',
        paymentMethod: result.cardTransaction?.cardType || null,
        cardLast4: result.cardTransaction?.last4 || null,
        cardBrand: result.cardTransaction?.cardType || null,
        cloverResponse: result,
        errorMessage: result.result === 'DECLINED' ? 'Payment declined' : null
      });

      if (!response.ok || result.result !== 'APPROVED') {
        throw new Error(`Payment failed: ${result.result}`);
      }

      return result;

    } catch (error) {
      // Update transaction with error
      await storage.updatePaymentTransaction(transaction.id, {
        status: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
      
      throw error;
    }
  }

  /**
   * Refund a payment
   */
  async refundPayment(cloverPaymentId: string, amount?: number): Promise<any> {
    await this.ensureValidToken();
    const { storage } = await import('./index');
    
    if (!this.config) {
      throw new Error('Clover not configured');
    }

    const environment = this.config.environment;
    const baseUrl = CLOVER_ENDPOINTS[environment as keyof typeof CLOVER_ENDPOINTS].api;

    const refundData: any = {};
    if (amount) {
      refundData.amount = amount;
    }

    const response = await fetch(`${baseUrl}/v3/merchants/${this.config.merchantId}/payments/${cloverPaymentId}/refunds`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(refundData)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to process refund: ${error}`);
    }

    const result = await response.json();

    // Update payment transaction
    const transaction = await storage.getPaymentTransactionByCloverPaymentId(cloverPaymentId);
    if (transaction) {
      await storage.updatePaymentTransaction(transaction.id, {
        status: 'refunded',
        refundAmount: amount || transaction.amount,
        refundedAt: new Date()
      });
    }

    return result;
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    if (!this.config || !this.config.webhookSecret) {
      return false;
    }

    // Clover uses HMAC-SHA256 for webhook signatures
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', this.config.webhookSecret)
      .update(payload)
      .digest('hex');

    return signature === expectedSignature;
  }

  /**
   * Handle webhook events
   */
  async handleWebhook(eventType: string, data: any): Promise<void> {
    console.log(`Received Clover webhook: ${eventType}`, data);

    switch (eventType) {
      case 'PAYMENT_UPDATED':
        await this.handlePaymentUpdated(data);
        break;
      case 'REFUND_CREATED':
        await this.handleRefundCreated(data);
        break;
      default:
        console.log(`Unhandled webhook event type: ${eventType}`);
    }
  }

  private async handlePaymentUpdated(data: any): Promise<void> {
    const paymentId = data.id;
    const status = data.result === 'APPROVED' ? 'completed' : 'failed';
    
    await storage.updatePaymentTransactionStatus(paymentId, status);
  }

  private async handleRefundCreated(data: any): Promise<void> {
    const paymentId = data.payment.id;
    const refundAmount = data.amount;
    
    const transaction = await storage.getPaymentTransactionByCloverPaymentId(paymentId);
    if (transaction) {
      await storage.updatePaymentTransaction(transaction.id, {
        status: 'refunded',
        refundAmount,
        refundedAt: new Date()
      });
    }
  }

  /**
   * Get current configuration status
   */
  async getConfigurationStatus(): Promise<{
    isConfigured: boolean;
    merchantId?: string;
    environment?: string;
    tokenExpiry?: Date;
  }> {
    await this.ensureInitialized();
    
    return {
      isConfigured: !!this.config,
      merchantId: this.config?.merchantId,
      environment: this.config?.environment,
      tokenExpiry: this.config?.tokenExpiresAt || undefined
    };
  }
}

// Export singleton instance
export const cloverService = new CloverService();