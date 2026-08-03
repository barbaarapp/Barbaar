import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.barbaar.wellness',
  appName: 'Barbaar Wellness',
  webDir: 'dist',
  // Configure live update server to dynamically sync with Cloudflare Pages
  server: {
    // Official app domain URL
    url: 'https://app.barbaar.org', 
    allowNavigation: [
      '*.barbaar.org',
      'app.barbaar.org'
    ],
    cleartext: true
  }
};

export default config;

