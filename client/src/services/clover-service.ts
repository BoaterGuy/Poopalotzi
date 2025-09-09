/**
 * Frontend Clover Service
 * 
 * Provides client-side interface to Clover functionality through our backend.
 * All Clover API calls should go through our backend routes, not directly to Clover.
 */

/**
 * Frontend API client - calls our backend routes only
 */
export class CloverApiClient {
  private baseUrl: string;

  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
  }

  /**
   * Get Clover connection status
   */
  async getStatus(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/admin/clover/status`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get Clover status: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Initiate OAuth flow
   */
  async initiateOAuth(merchantId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/admin/clover/oauth/initiate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ merchantId })
    });
    
    if (!response.ok) {
      throw new Error(`Failed to initiate OAuth: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Test Clover API connection
   */
  async testConnection(): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/admin/clover/test`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to test connection: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get merchant information through our backend
   */
  async getMerchantInfo(merchantId?: string): Promise<any> {
    const url = merchantId 
      ? `${this.baseUrl}/api/admin/clover/merchant/${merchantId}`
      : `${this.baseUrl}/api/admin/clover/merchant`;
      
    const response = await fetch(url, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get merchant info: ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Process payment through our backend
   */
  async processPayment(paymentData: {
    amount: number;
    source: string;
    description?: string;
    orderId?: string;
    metadata?: Record<string, any>;
  }): Promise<any> {
    const response = await fetch(`${this.baseUrl}/api/admin/clover/payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(paymentData)
    });
    
    if (!response.ok) {
      throw new Error(`Payment failed: ${response.statusText}`);
    }
    
    return response.json();
  }
}

// Export default instance
export const cloverApi = new CloverApiClient();