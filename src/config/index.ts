/**
 * Configuration validation and setup
 * 
 * Validates required environment variables at startup
 * Throws descriptive errors if any required configs are missing
 */

export interface CloverConfig {
  appId: string;
  appSecret: string;
  redirectUri: string;
  region: 'NA' | 'EU' | 'LA';
}

/**
 * Validates and returns Clover configuration
 * Warns about missing environment variables but doesn't crash the app
 */
export function validateCloverConfig(): CloverConfig {
  const missing: string[] = [];
  
  const appId = process.env.CLOVER_APP_ID;
  if (!appId) {
    missing.push('CLOVER_APP_ID');
  }
  
  const appSecret = process.env.CLOVER_APP_SECRET;
  if (!appSecret) {
    missing.push('CLOVER_APP_SECRET');
  }
  
  const redirectUri = process.env.CLOVER_REDIRECT_URI;
  if (!redirectUri) {
    missing.push('CLOVER_REDIRECT_URI');
  }
  
  if (missing.length > 0) {
    console.warn(
      `⚠️  Missing Clover environment variables: ${missing.join(', ')}\n` +
      `   Clover payment functionality will be disabled.\n` +
      `   To enable Clover integration, add to your environment:\n` +
      `   CLOVER_APP_ID=your_app_id\n` +
      `   CLOVER_APP_SECRET=your_app_secret\n` +
      `   CLOVER_REDIRECT_URI=https://yourdomain.com/auth/clover/callback\n` +
      `   CLOVER_REGION=NA (optional, defaults to NA)`
    );
    
    // Return default values to prevent crashes
    return {
      appId: appId || 'not_configured',
      appSecret: appSecret || 'not_configured', 
      redirectUri: redirectUri || 'not_configured',
      region: 'NA'
    };
  }
  
  // Default CLOVER_REGION to 'NA' if unset
  const region = (process.env.CLOVER_REGION || 'NA') as 'NA' | 'EU' | 'LA';
  
  // Validate region is one of the allowed values
  if (!['NA', 'EU', 'LA'].includes(region)) {
    throw new Error(
      `Invalid CLOVER_REGION: ${region}. Must be one of: NA, EU, LA`
    );
  }
  
  return {
    appId: appId!,
    appSecret: appSecret!,
    redirectUri: redirectUri!,
    region
  };
}

/**
 * Performs all startup configuration checks
 * Call this early in application startup to fail fast on missing config
 */
export function validateStartupConfig(): void {
  console.log('🔧 Validating startup configuration...');
  
  try {
    // Validate Clover config
    const cloverConfig = validateCloverConfig();
    console.log('✅ Clover configuration valid:', {
      appId: cloverConfig.appId.substring(0, 8) + '...',
      hasSecret: !!cloverConfig.appSecret,
      redirectUri: cloverConfig.redirectUri,
      region: cloverConfig.region
    });
    
    // Set default region if not already set
    if (!process.env.CLOVER_REGION) {
      process.env.CLOVER_REGION = 'NA';
      console.log('✅ CLOVER_REGION defaulted to NA');
    }
    
    console.log('✅ All startup configuration checks passed');
    
  } catch (error) {
    console.error('❌ Startup configuration validation failed:');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

// Export the validated config for use throughout the application
export const config = {
  clover: validateCloverConfig()
};