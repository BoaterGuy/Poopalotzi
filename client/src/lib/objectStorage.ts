/**
 * Helper function to transform object storage paths to API paths
 * Converts /objects/... to /api/objects/...
 * Converts /public-objects/... to /api/public-objects/...
 * Leaves absolute URLs unchanged
 */
export function resolveObjectUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  // If it's already an absolute URL, return as-is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Transform object storage paths to go through API
  if (url.startsWith('/objects/')) {
    return `/api${url}`;
  }
  
  if (url.startsWith('/public-objects/')) {
    return `/api${url}`;
  }
  
  // Return as-is for other relative paths
  return url;
}