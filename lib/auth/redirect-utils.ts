/**
 * Utility functions for handling redirect URLs in authentication flows
 * Ensures proper domain handling across different environments
 */

/**
 * Gets the base URL for the current environment
 * Automatically detects localhost, staging, and production domains
 */
export function getBaseUrl(): string {
  // In browser environment
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // In server environment (SSR)
  if (typeof process !== 'undefined') {
    // Check for Vercel deployment
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    
    // Check for custom domain in production
    if (process.env.NEXT_PUBLIC_SITE_URL) {
      return process.env.NEXT_PUBLIC_SITE_URL;
    }
    
    // Fallback to localhost for development
    if (process.env.NODE_ENV === 'development') {
      return 'http://localhost:3000';
    }
  }
  
  // Ultimate fallback
  return 'http://localhost:3000';
}

/**
 * Creates a redirect URL for authentication callbacks
 * @param path - The path to redirect to (e.g., '/auth/callback')
 * @param params - URL parameters to include
 * @returns Complete redirect URL
 */
export function createAuthRedirectUrl(
  path: string, 
  params: Record<string, string> = {}
): string {
  const baseUrl = getBaseUrl();
  const url = new URL(path, baseUrl);
  
  // Add parameters
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  
  return url.toString();
}

/**
 * Creates a password reset redirect URL
 * @param role - The user role ('family' or 'provider')
 * @returns Complete redirect URL for password reset
 */
export function createPasswordResetRedirectUrl(role: 'family' | 'provider'): string {
  return createAuthRedirectUrl('/auth/callback', {
    role,
    type: 'recovery'
  });
}

/**
 * Creates an email confirmation redirect URL
 * @param role - The user role ('family' or 'provider')
 * @returns Complete redirect URL for email confirmation
 */
export function createEmailConfirmationRedirectUrl(role: 'family' | 'provider'): string {
  return createAuthRedirectUrl('/auth/callback', {
    role
  });
}

/**
 * Validates that a redirect URL is safe and belongs to our domain
 * @param url - The URL to validate
 * @returns True if the URL is safe to redirect to
 */
export function isValidRedirectUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const baseUrl = getBaseUrl();
    const baseUrlObj = new URL(baseUrl);
    
    // Check if the URL belongs to our domain
    return urlObj.origin === baseUrlObj.origin;
  } catch {
    return false;
  }
}
