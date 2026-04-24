// Detect which host the app is running on
// Useful for routing API calls and configuration

export const HOSTS = {
  VERCEL: 'vercel.app',
  CLOUDFLARE: 'pages.dev',
  LOCAL: 'localhost',
  CUSTOM: 'custom-domain',
} as const;

export function detectHost(): keyof typeof HOSTS | 'server' {
  // Server-side rendering
  if (typeof window === 'undefined') return 'server';

  const hostname = window.location.hostname;

  if (hostname.includes('vercel.app')) return 'VERCEL';
  if (hostname.includes('pages.dev')) return 'CLOUDFLARE';
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1'))
    return 'LOCAL';

  return 'CUSTOM';
}

export function getApiUrl(): string {
  if (typeof window === 'undefined') return '';

  const host = detectHost();
  const hostname = window.location.hostname;

  // On Cloudflare or custom domain, route to Vercel for API
  if (host === 'CLOUDFLARE' || host === 'CUSTOM') {
    // Replace with your actual Vercel URL
    const vercelUrl = (import.meta as any).env?.VITE_VERCEL_API_URL;
    if (vercelUrl) return vercelUrl;
  }

  // On Vercel or local, use relative URLs
  return '';
}

export const HOST = detectHost();

export default {
  HOSTS,
  detectHost,
  getApiUrl,
  HOST,
};
