export type StoredTokens = {
  merchantId: string;
  access_token: string;
  refresh_token: string;
  token_expires_at?: number;
  created_at: number;
  region: 'NA' | 'EU' | 'LA';
};

/**
 * Save tokens to database (insert new record)
 */
export async function saveTokens(tokens: StoredTokens): Promise<void> {
  const { storage } = await import('../../server/index');
  
  await storage.createCloverConfig({
    merchantId: tokens.merchantId,
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    tokenExpiresAt: tokens.token_expires_at ? new Date(tokens.token_expires_at) : null,
    environment: 'production',
    appId: process.env.CLOVER_APP_ID || '',
    appSecret: process.env.CLOVER_APP_SECRET || '',
    isActive: true,
    webhookSecret: null
  });
}

/**
 * Get tokens by merchant ID
 */
export async function getTokens(merchantId: string): Promise<StoredTokens | null> {
  const { storage } = await import('../../server/index');
  
  const config = await storage.getCloverConfig();
  
  if (!config || config.merchantId !== merchantId || !config.accessToken || !config.refreshToken) {
    return null;
  }
  
  return {
    merchantId: config.merchantId,
    access_token: config.accessToken,
    refresh_token: config.refreshToken,
    token_expires_at: config.tokenExpiresAt ? config.tokenExpiresAt.getTime() : undefined,
    created_at: config.createdAt ? config.createdAt.getTime() : Date.now(),
    region: (process.env.CLOVER_REGION as 'NA' | 'EU' | 'LA') || 'NA'
  };
}

/**
 * Upsert tokens (update existing or create new)
 */
export async function upsertTokens(partial: Partial<StoredTokens> & { merchantId: string }): Promise<void> {
  const { storage } = await import('../../server/index');
  
  // Check if config exists
  const existingConfig = await storage.getCloverConfig();
  
  if (existingConfig && existingConfig.merchantId === partial.merchantId) {
    // Update existing config
    const updateData: any = {};
    
    if (partial.access_token) updateData.accessToken = partial.access_token;
    if (partial.refresh_token) updateData.refreshToken = partial.refresh_token;
    if (partial.token_expires_at) updateData.tokenExpiresAt = new Date(partial.token_expires_at);
    
    await storage.updateCloverConfig(existingConfig.id, updateData);
  } else {
    // Create new config
    const newTokens: StoredTokens = {
      merchantId: partial.merchantId,
      access_token: partial.access_token || '',
      refresh_token: partial.refresh_token || '',
      token_expires_at: partial.token_expires_at,
      created_at: partial.created_at || Date.now(),
      region: partial.region || 'NA'
    };
    
    await saveTokens(newTokens);
  }
}