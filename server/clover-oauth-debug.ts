/**
 * Clover OAuth Debug Utilities
 * 
 * Comprehensive debugging tools for Clover OAuth integration
 * to help identify and resolve connection issues
 */

import { Request, Response } from 'express';

export interface CloverOAuthDebugInfo {
  timestamp: string;
  environment: string;
  appId: string;
  merchantId: string;
  redirectUri: string;
  authUrl: string;
  callbackReceived: boolean;
  tokenExchange: {
    attempted: boolean;
    successful: boolean;
    error?: string;
  };
  apiResponse?: any;
  headers?: Record<string, string>;
}

export class CloverOAuthDebugger {
  private debugSessions: Map<string, CloverOAuthDebugInfo> = new Map();

  /**
   * Start a new debug session for OAuth flow
   */
  startDebugSession(merchantId: string, redirectUri: string): CloverOAuthDebugInfo {
    const sessionId = `${merchantId}-${Date.now()}`;
    const appId = process.env.CLOVER_APP_ID || 'NOT_SET';
    const environment = process.env.CLOVER_ENVIRONMENT || 'NOT_SET';
    
    const authUrl = `https://sandbox.dev.clover.com/oauth/authorize?client_id=${appId}&merchant_id=${merchantId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;
    
    const debugInfo: CloverOAuthDebugInfo = {
      timestamp: new Date().toISOString(),
      environment,
      appId,
      merchantId,
      redirectUri,
      authUrl,
      callbackReceived: false,
      tokenExchange: {
        attempted: false,
        successful: false
      }
    };

    this.debugSessions.set(sessionId, debugInfo);
    
    console.log('\n=== CLOVER OAUTH DEBUG SESSION STARTED ===');
    console.log(`Session ID: ${sessionId}`);
    console.log(`Merchant ID: ${merchantId}`);
    console.log(`App ID: ${appId}`);
    console.log(`Environment: ${environment}`);
    console.log(`Auth URL: ${authUrl}`);
    console.log('==========================================\n');

    return debugInfo;
  }

  /**
   * Log callback receipt
   */
  logCallbackReceived(merchantId: string, code: string, req: Request): void {
    const session = this.findSessionByMerchant(merchantId);
    if (session) {
      session.callbackReceived = true;
      session.headers = req.headers as Record<string, string>;
      
      console.log('\n=== CLOVER OAUTH CALLBACK RECEIVED ===');
      console.log(`Merchant ID: ${merchantId}`);
      console.log(`Authorization Code: ${code}`);
      console.log(`Callback Headers:`, req.headers);
      console.log(`Callback Query:`, req.query);
      console.log('====================================\n');
    }
  }

  /**
   * Log token exchange attempt
   */
  logTokenExchange(merchantId: string, success: boolean, response?: any, error?: string): void {
    const session = this.findSessionByMerchant(merchantId);
    if (session) {
      session.tokenExchange.attempted = true;
      session.tokenExchange.successful = success;
      session.tokenExchange.error = error;
      session.apiResponse = response;
      
      console.log('\n=== CLOVER TOKEN EXCHANGE ===');
      console.log(`Merchant ID: ${merchantId}`);
      console.log(`Success: ${success}`);
      if (error) {
        console.log(`Error: ${error}`);
      }
      if (response) {
        console.log(`Response:`, response);
      }
      console.log('============================\n');
    }
  }

  /**
   * Get debug information for a merchant
   */
  getDebugInfo(merchantId: string): CloverOAuthDebugInfo | null {
    return this.findSessionByMerchant(merchantId);
  }

  /**
   * Get all debug sessions
   */
  getAllDebugSessions(): CloverOAuthDebugInfo[] {
    return Array.from(this.debugSessions.values());
  }

  /**
   * Clear old debug sessions (older than 1 hour)
   */
  cleanupOldSessions(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    for (const [sessionId, session] of this.debugSessions.entries()) {
      const sessionTime = new Date(session.timestamp).getTime();
      if (sessionTime < oneHourAgo) {
        this.debugSessions.delete(sessionId);
      }
    }
  }

  /**
   * Generate debug report
   */
  generateDebugReport(merchantId?: string): string {
    const sessions = merchantId 
      ? [this.findSessionByMerchant(merchantId)].filter(Boolean)
      : this.getAllDebugSessions();

    let report = '\n=== CLOVER OAUTH DEBUG REPORT ===\n';
    report += `Generated: ${new Date().toISOString()}\n`;
    report += `Total Sessions: ${sessions.length}\n\n`;

    sessions.forEach((session, index) => {
      if (session) {
        report += `Session ${index + 1}:\n`;
        report += `  Merchant ID: ${session.merchantId}\n`;
        report += `  Timestamp: ${session.timestamp}\n`;
        report += `  Environment: ${session.environment}\n`;
        report += `  App ID: ${session.appId}\n`;
        report += `  Callback Received: ${session.callbackReceived}\n`;
        report += `  Token Exchange Attempted: ${session.tokenExchange.attempted}\n`;
        report += `  Token Exchange Successful: ${session.tokenExchange.successful}\n`;
        if (session.tokenExchange.error) {
          report += `  Error: ${session.tokenExchange.error}\n`;
        }
        report += `  Auth URL: ${session.authUrl}\n`;
        report += '\n';
      }
    });

    report += '================================\n';
    return report;
  }

  private findSessionByMerchant(merchantId: string): CloverOAuthDebugInfo | null {
    for (const session of this.debugSessions.values()) {
      if (session.merchantId === merchantId) {
        return session;
      }
    }
    return null;
  }
}

// Singleton instance
export const cloverOAuthDebugger = new CloverOAuthDebugger();

// Cleanup old sessions every 30 minutes
setInterval(() => {
  cloverOAuthDebugger.cleanupOldSessions();
}, 30 * 60 * 1000);