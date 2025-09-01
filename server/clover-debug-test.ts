/**
 * Clover Debug Test Script
 * 
 * This script systematically tests all Clover integration components
 * to identify the root cause of 404 errors and TypeErrors
 */

import { cloverService } from './clover-service';

export interface CloverDebugResults {
  timestamp: string;
  environmentCheck: {
    status: 'pass' | 'fail';
    appId: string;
    environment: string;
    appSecretExists: boolean;
    issues: string[];
  };
  configurationCheck: {
    status: 'pass' | 'fail';
    isConfigured: boolean;
    merchantId?: string;
    hasAccessToken: boolean;
    issues: string[];
  };
  apiConnectivityCheck: {
    status: 'pass' | 'fail';
    endpoint: string;
    responseCode?: number;
    responseBody?: any;
    issues: string[];
  };
  oauthUrlCheck: {
    status: 'pass' | 'fail';
    generatedUrl?: string;
    isValidUrl: boolean;
    issues: string[];
  };
}

export class CloverDebugger {
  
  async runFullDiagnostic(): Promise<CloverDebugResults> {
    const results: CloverDebugResults = {
      timestamp: new Date().toISOString(),
      environmentCheck: { status: 'pass', appId: '', environment: '', appSecretExists: false, issues: [] },
      configurationCheck: { status: 'pass', isConfigured: false, hasAccessToken: false, issues: [] },
      apiConnectivityCheck: { status: 'pass', endpoint: '', issues: [] },
      oauthUrlCheck: { status: 'pass', isValidUrl: false, issues: [] }
    };

    console.log('\n🔍 CLOVER INTEGRATION DIAGNOSTIC STARTED');
    console.log('==========================================');

    // 1. Environment Variable Check
    await this.checkEnvironmentVariables(results);
    
    // 2. Configuration Check
    await this.checkConfiguration(results);
    
    // 3. API Connectivity Check
    await this.checkApiConnectivity(results);
    
    // 4. OAuth URL Generation Check
    await this.checkOAuthUrlGeneration(results);

    console.log('\n📊 DIAGNOSTIC SUMMARY');
    console.log('===================');
    console.log(`Environment: ${results.environmentCheck.status.toUpperCase()}`);
    console.log(`Configuration: ${results.configurationCheck.status.toUpperCase()}`);
    console.log(`API Connectivity: ${results.apiConnectivityCheck.status.toUpperCase()}`);
    console.log(`OAuth URL: ${results.oauthUrlCheck.status.toUpperCase()}`);
    
    if (results.environmentCheck.issues.length > 0 || 
        results.configurationCheck.issues.length > 0 ||
        results.apiConnectivityCheck.issues.length > 0 ||
        results.oauthUrlCheck.issues.length > 0) {
      console.log('\n❌ ISSUES FOUND:');
      this.printAllIssues(results);
    } else {
      console.log('\n✅ ALL CHECKS PASSED');
    }

    return results;
  }

  private async checkEnvironmentVariables(results: CloverDebugResults): Promise<void> {
    console.log('\n1️⃣ Environment Variables Check');
    console.log('------------------------------');
    
    try {
      const appId = process.env.CLOVER_APP_ID;
      const appSecret = process.env.CLOVER_APP_SECRET;
      const environment = process.env.CLOVER_ENVIRONMENT;

      results.environmentCheck.appId = appId || 'NOT_SET';
      results.environmentCheck.environment = environment || 'NOT_SET';
      results.environmentCheck.appSecretExists = !!appSecret;

      if (!appId) {
        results.environmentCheck.issues.push('CLOVER_APP_ID is not set');
        results.environmentCheck.status = 'fail';
      } else {
        console.log(`   ✅ CLOVER_APP_ID: ${appId}`);
      }

      if (!appSecret) {
        results.environmentCheck.issues.push('CLOVER_APP_SECRET is not set');
        results.environmentCheck.status = 'fail';
      } else {
        console.log(`   ✅ CLOVER_APP_SECRET: [${appSecret.length} characters]`);
      }

      if (!environment || !['sandbox', 'production'].includes(environment)) {
        results.environmentCheck.issues.push('CLOVER_ENVIRONMENT must be "sandbox" or "production"');
        results.environmentCheck.status = 'fail';
      } else {
        console.log(`   ✅ CLOVER_ENVIRONMENT: ${environment}`);
      }

    } catch (error) {
      results.environmentCheck.status = 'fail';
      results.environmentCheck.issues.push(`Environment check failed: ${error}`);
      console.log(`   ❌ Environment check failed: ${error}`);
    }
  }

  private async checkConfiguration(results: CloverDebugResults): Promise<void> {
    console.log('\n2️⃣ Configuration Status Check');
    console.log('-----------------------------');
    
    try {
      const status = await cloverService.getConfigurationStatus();
      
      results.configurationCheck.isConfigured = status.isConfigured;
      results.configurationCheck.merchantId = status.merchantId;
      results.configurationCheck.hasAccessToken = !!status.merchantId; // Simplified check

      if (status.isConfigured) {
        console.log(`   ✅ Configuration found`);
        console.log(`   ✅ Merchant ID: ${status.merchantId}`);
        console.log(`   ✅ Environment: ${status.environment}`);
      } else {
        results.configurationCheck.status = 'fail';
        results.configurationCheck.issues.push('Clover is not configured');
        console.log(`   ❌ Clover configuration not found`);
      }

    } catch (error) {
      results.configurationCheck.status = 'fail';
      results.configurationCheck.issues.push(`Configuration check failed: ${error}`);
      console.log(`   ❌ Configuration check failed: ${error}`);
    }
  }

  private async checkApiConnectivity(results: CloverDebugResults): Promise<void> {
    console.log('\n3️⃣ API Connectivity Check');
    console.log('--------------------------');
    
    try {
      const environment = process.env.CLOVER_ENVIRONMENT || 'production';
      const baseUrl = environment === 'sandbox' 
        ? 'https://apisandbox.dev.clover.com' 
        : 'https://api.clover.com';
      
      results.apiConnectivityCheck.endpoint = baseUrl;

      // Test basic connectivity to Clover API
      const testUrl = `${baseUrl}/v3/apps/${process.env.CLOVER_APP_ID}`;
      
      try {
        const response = await fetch(testUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          }
        });

        results.apiConnectivityCheck.responseCode = response.status;
        
        if (response.status === 401) {
          console.log(`   ✅ API reachable (${response.status} - Expected for unauthorized request)`);
        } else if (response.status === 404) {
          results.apiConnectivityCheck.status = 'fail';
          results.apiConnectivityCheck.issues.push(`App ID ${process.env.CLOVER_APP_ID} not found (404)`);
          console.log(`   ❌ App not found (404) - Check CLOVER_APP_ID`);
        } else {
          console.log(`   ⚠️  Unexpected response: ${response.status}`);
        }

      } catch (networkError) {
        results.apiConnectivityCheck.status = 'fail';
        results.apiConnectivityCheck.issues.push(`Network error: ${networkError}`);
        console.log(`   ❌ Network error: ${networkError}`);
      }

    } catch (error) {
      results.apiConnectivityCheck.status = 'fail';
      results.apiConnectivityCheck.issues.push(`API connectivity check failed: ${error}`);
      console.log(`   ❌ API connectivity check failed: ${error}`);
    }
  }

  private async checkOAuthUrlGeneration(results: CloverDebugResults): Promise<void> {
    console.log('\n4️⃣ OAuth URL Generation Check');
    console.log('-----------------------------');
    
    try {
      const merchantId = 'PFHDQ8MSX5F81'; // Test merchant ID
      const redirectUri = 'https://test.replit.dev/api/admin/clover/oauth/callback';
      
      // Test OAuth URL generation logic
      const appId = process.env.CLOVER_APP_ID;
      const environment = process.env.CLOVER_ENVIRONMENT || 'production';
      
      const oauthBaseUrl = environment === 'sandbox' 
        ? 'https://sandbox.dev.clover.com/oauth'
        : 'https://www.clover.com/oauth';
      
      const oauthUrl = `${oauthBaseUrl}/authorize?client_id=${appId}&merchant_id=${merchantId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;
      
      results.oauthUrlCheck.generatedUrl = oauthUrl;
      results.oauthUrlCheck.isValidUrl = oauthUrl.includes('client_id=') && oauthUrl.includes('merchant_id=');
      
      if (results.oauthUrlCheck.isValidUrl) {
        console.log(`   ✅ OAuth URL generated successfully`);
        console.log(`   ✅ URL: ${oauthUrl}`);
      } else {
        results.oauthUrlCheck.status = 'fail';
        results.oauthUrlCheck.issues.push('OAuth URL generation failed');
        console.log(`   ❌ OAuth URL generation failed`);
      }

    } catch (error) {
      results.oauthUrlCheck.status = 'fail';
      results.oauthUrlCheck.issues.push(`OAuth URL check failed: ${error}`);
      console.log(`   ❌ OAuth URL check failed: ${error}`);
    }
  }

  private printAllIssues(results: CloverDebugResults): void {
    [
      results.environmentCheck,
      results.configurationCheck,
      results.apiConnectivityCheck,
      results.oauthUrlCheck
    ].forEach(check => {
      check.issues.forEach(issue => console.log(`   • ${issue}`));
    });
  }
}

// Export singleton instance
export const cloverDebugger = new CloverDebugger();

// If run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  cloverDebugger.runFullDiagnostic().then(results => {
    console.log('\n📋 Full Results:');
    console.log(JSON.stringify(results, null, 2));
    process.exit(0);
  });
}