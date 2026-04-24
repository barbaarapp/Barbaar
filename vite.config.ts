import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.VITE_APP_URL': JSON.stringify(env.VITE_APP_URL || 'https://barbaar-phi.vercel.app'),
      global: 'globalThis',
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    optimizeDeps: {
      esbuildOptions: {
        define: {
          global: 'globalThis',
        },
      },
      include: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/database', 'firebase/storage', 'firebase/messaging'],
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      minify: 'terser',
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'ui-vendor': ['lucide-react', 'motion/react'],
            'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          },
        },
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
