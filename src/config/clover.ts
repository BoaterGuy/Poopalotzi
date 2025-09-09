export type CloverRegion = 'NA' | 'EU' | 'LA';

export function cloverApiBase(region: CloverRegion = 'NA'): string {
  switch (region) {
    case 'EU': return 'https://api.eu.clover.com';
    case 'LA': return 'https://api.la.clover.com';
    default:   return 'https://api.clover.com';
  }
}

export function cloverEcommerceBase(region: CloverRegion = 'NA'): string {
  switch (region) {
    case 'EU': return 'https://scl.eu.clover.com';
    case 'LA': return 'https://scl.la.clover.com';
    default:   return 'https://scl.clover.com';
  }
}

export const CLOVER_OAUTH_AUTHORIZE = 'https://www.clover.com/oauth/v2/authorize';
export const CLOVER_OAUTH_TOKEN     = 'https://www.clover.com/oauth/token';