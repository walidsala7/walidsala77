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
        manifest: {
          name: 'Walid Sala7 - Software Tools',
          short_name: 'Walid Sala7',
          description: 'Software Tool Rentals and Services',
          theme_color: '#2563eb',
          background_color: '#0b0f1a',
          display: 'standalone',
          orientation: 'portrait',
          icons: [
            {
              src: 'https://i.ibb.co/dszpmdjm/zx.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'https://i.ibb.co/dszpmdjm/zx.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
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
