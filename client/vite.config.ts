import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import { fileURLToPath } from 'url';

// Fix pour ESM : __dirname n'existe pas nativement, on le reconstruit
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'lumo_logo.svg',
        'apple-touch-icon.png',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'maskable-icon.png'
      ],
      manifest: {
        name: 'LUMO',
        short_name: 'LUMO',
        description: 'Solution ERP complète pour commerçants en RDC',
        theme_color: '#C2410C',
        background_color: '#FAFAF9',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        lang: 'fr',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'apple touch icon'
          },
          {
            src: '/maskable-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 4194304,
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // Heavy optional tools and screenshots load only when actually requested.
        globIgnores:['**/screen*.png','**/team/*.png','**/xlsx-*.js','**/BarcodeScanner-*.js'],
        navigateFallbackDenylist:[/^\/api(?:\/|$)/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // ALL API routes must bypass Service Worker — no cache for backend calls
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkOnly'
          },
          {urlPattern: /\/assets\/(?:xlsx|BarcodeScanner)-[^/]+\.js$/i,handler:'CacheFirst',options:{cacheName:'lumo-optional-tools-v1',expiration:{maxEntries:8,maxAgeSeconds:7*86400},cacheableResponse:{statuses:[200]}}}
        ]
      }
    })
  ],
  resolve: {
    alias: {
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
      'react/jsx-runtime': path.resolve(__dirname, 'node_modules/react/jsx-runtime'),
    },
    dedupe: ['react', 'react-dom', 'react/jsx-runtime']
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'zustand',
      'framer-motion',
      'lucide-react',
      'react-router-dom'
    ],
  },
  server: {
    port: 3001,
    strictPort: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 3001
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'build',
  },
});
