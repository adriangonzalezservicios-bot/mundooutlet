import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: './',
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['pwa-icon.svg'],
        workbox: {
          maximumFileSizeToCacheInBytes: 5000000 // 5 MB
        },
        manifest: {
          name: 'Mundo Outlet ERP',
          short_name: 'MO ERP',
          description: 'Gestión y control de inventario.',
          theme_color: '#0f172a',
          icons: [
            {
              src: 'pwa-icon.svg',
              sizes: '512x512',
              type: 'image/svg+xml'
            },
            {
              src: 'pwa-icon.svg',
              sizes: '192x192',
              type: 'image/svg+xml'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.META_AI_TOKEN': JSON.stringify(env.META_AI_TOKEN),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
