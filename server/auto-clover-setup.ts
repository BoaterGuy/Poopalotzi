/**
 * Automated Clover Setup
 * This script automatically configures Clover integration with existing environment variables
 */

import { storage } from './index';

export async function autoConfigureClover() {
  try {
    // Use existing environment variables
    const appId = process.env.CLOVER_APP_ID || process.env.CLOVER_CLIENT_ID;
    const appSecret = process.env.CLOVER_APP_SECRET || process.env.CLOVER_CLIENT_SECRET;
    const merchantId = process.env.CLOVER_MERCHANT_ID || 'PFHDQ8MSX5F81';
    
    if (!appId || !appSecret) {
      console.log('❌ Missing Clover credentials in environment variables');
      return false;
    }

    console.log('🔧 Auto-configuring Clover with credentials:');
    console.log(`   APP_ID: ${appId}`);
    console.log(`   MERCHANT_ID: ${merchantId}`);
    console.log(`   Environment: production`);

    // Check if already configured
    const existingConfig = await storage.getCloverConfig();
    if (existingConfig) {
      console.log('✅ Clover already configured');
      return true;
    }

    // Auto-create configuration with proper typing
    const config = {
      merchantId,
      environment: 'production' as const,
      // We'll get the access token through OAuth flow
      accessToken: null,
      publicKey: null,
      isActive: true
    };

    await storage.createCloverConfig(config);
    console.log('✅ Clover configuration created successfully');
    return true;

  } catch (error) {
    console.error('❌ Failed to auto-configure Clover:', error);
    return false;
  }
}

// Auto-run on import
autoConfigureClover();