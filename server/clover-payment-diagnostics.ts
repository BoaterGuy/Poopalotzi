/**
 * Clover Payment Diagnostics
 * 
 * Comprehensive diagnostics to identify and resolve Clover payment integration issues
 */

export interface PaymentDiagnosticResult {
  step: string;
  status: 'success' | 'failed' | 'warning';
  details: string;
  data?: any;
}

export class CloverPaymentDiagnostics {
  private config: any;
  
  constructor(config: any) {
    this.config = config;
  }

  async runFullDiagnostics(): Promise<PaymentDiagnosticResult[]> {
    const results: PaymentDiagnosticResult[] = [];
    
    // Step 1: Test merchant access
    results.push(await this.testMerchantAccess());
    
    // Step 2: Test tenders endpoint
    results.push(await this.testTendersAccess());
    
    // Step 3: Test order creation
    results.push(await this.testOrderCreation());
    
    // Step 4: Test payment endpoints
    results.push(await this.testPaymentEndpoints());
    
    // Step 5: Generate recommendations
    results.push(this.generateRecommendations(results));
    
    return results;
  }

  private async testMerchantAccess(): Promise<PaymentDiagnosticResult> {
    try {
      const response = await fetch(`https://apisandbox.dev.clover.com/v3/merchants/${this.config.merchantId}`, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const merchant = await response.json();
        return {
          step: 'Merchant Access',
          status: 'success',
          details: `Successfully accessed merchant: ${merchant.name || 'Unknown'}`,
          data: { merchantId: merchant.id, name: merchant.name }
        };
      } else {
        const error = await response.text();
        return {
          step: 'Merchant Access',
          status: 'failed',
          details: `Failed to access merchant: ${response.status} - ${error}`
        };
      }
    } catch (error) {
      return {
        step: 'Merchant Access',
        status: 'failed',
        details: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async testTendersAccess(): Promise<PaymentDiagnosticResult> {
    try {
      const response = await fetch(`https://apisandbox.dev.clover.com/v3/merchants/${this.config.merchantId}/tenders`, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const tenders = await response.json();
        const creditCardTender = tenders.elements?.find((t: any) => 
          t.labelKey === 'com.clover.tender.credit_card' || t.label === 'Credit Card'
        );
        
        return {
          step: 'Tenders Access',
          status: creditCardTender ? 'success' : 'warning',
          details: creditCardTender 
            ? `Found credit card tender: ${creditCardTender.id}`
            : `No credit card tender found. Available: ${tenders.elements?.map((t: any) => t.label).join(', ') || 'None'}`,
          data: tenders.elements
        };
      } else {
        const error = await response.text();
        return {
          step: 'Tenders Access',
          status: 'failed',
          details: `Failed to access tenders: ${response.status} - ${error}`
        };
      }
    } catch (error) {
      return {
        step: 'Tenders Access',
        status: 'failed',
        details: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async testOrderCreation(): Promise<PaymentDiagnosticResult> {
    try {
      const orderData = {
        total: 100,
        currency: 'USD',
        state: 'open',
        type: 'manual',
        title: 'Diagnostic Test Order'
      };

      const response = await fetch(`https://apisandbox.dev.clover.com/v3/merchants/${this.config.merchantId}/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        const order = await response.json();
        return {
          step: 'Order Creation',
          status: 'success',
          details: `Successfully created test order: ${order.id}`,
          data: { orderId: order.id, total: order.total }
        };
      } else {
        const error = await response.text();
        return {
          step: 'Order Creation',
          status: 'failed',
          details: `Failed to create order: ${response.status} - ${error}`
        };
      }
    } catch (error) {
      return {
        step: 'Order Creation',
        status: 'failed',
        details: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  private async testPaymentEndpoints(): Promise<PaymentDiagnosticResult> {
    const results = [];
    
    // Test direct payments endpoint
    try {
      const paymentData = {
        amount: 100,
        currency: 'USD',
        source: 'test_token'
      };

      const response = await fetch(`https://apisandbox.dev.clover.com/v3/merchants/${this.config.merchantId}/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });

      const error = await response.text();
      results.push(`Direct payments: ${response.status} - ${error}`);
    } catch (error) {
      results.push(`Direct payments: Network error`);
    }

    // Test ecommerce endpoint
    try {
      const ecomData = {
        amount: 100,
        currency: 'usd',
        source: 'test_token'
      };

      const response = await fetch('https://scl-sandbox.dev.clover.com/v1/charges', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(ecomData)
      });

      const error = await response.text();
      results.push(`Ecommerce API: ${response.status} - ${error}`);
    } catch (error) {
      results.push(`Ecommerce API: Network error`);
    }

    return {
      step: 'Payment Endpoints',
      status: 'warning',
      details: results.join(' | '),
      data: results
    };
  }

  private generateRecommendations(results: PaymentDiagnosticResult[]): PaymentDiagnosticResult {
    const recommendations = [];
    
    const merchantAccess = results.find(r => r.step === 'Merchant Access');
    const tendersAccess = results.find(r => r.step === 'Tenders Access');
    const orderCreation = results.find(r => r.step === 'Order Creation');
    
    if (merchantAccess?.status === 'failed') {
      recommendations.push('- Check API token validity and merchant ID');
    }
    
    if (tendersAccess?.status === 'failed') {
      recommendations.push('- API token lacks payment permissions - request new token with "Payments" scope');
    } else if (tendersAccess?.status === 'warning') {
      recommendations.push('- Configure credit card tender in Clover dashboard');
    }
    
    if (orderCreation?.status === 'failed') {
      recommendations.push('- API token lacks order creation permissions');
    }
    
    recommendations.push('- For real payments, use Clover\'s iframe or hosted checkout instead of direct API');
    recommendations.push('- Consider using simulation mode for development and testing');
    
    return {
      step: 'Recommendations',
      status: 'success',
      details: recommendations.join('\n'),
      data: recommendations
    };
  }
}