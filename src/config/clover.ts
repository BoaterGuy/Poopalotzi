export type CloverRegion='NA'|'EU'|'LA';
export function cloverApiBase(r:CloverRegion='NA'){ return r==='EU'?'https://api.eu.clover.com':r==='LA'?'https://api.la.clover.com':'https://api.clover.com'; }
export function cloverEcommerceBase(r:CloverRegion='NA'){ return r==='EU'?'https://scl.eu.clover.com':r==='LA'?'https://scl.la.clover.com':'https://scl.clover.com'; }
export const CLOVER_OAUTH_AUTHORIZE='https://www.clover.com/oauth/v2/authorize';
export const CLOVER_OAUTH_TOKEN='https://www.clover.com/oauth/token';