import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Registered in src/lib/swUpdate.ts, which also reloads onto a new
      // version while the visitor has not touched the page.
      injectRegister: false,
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'Bon Pain Fait Main',
        short_name: 'Bon Pain',
        lang: 'fr',
        categories: ['food', 'shopping'],
        description: 'Pains et viennoiseries au levain, façonnés à la main par Benjamin Ramakers à Waimes.',
        theme_color: '#A67C52',
        background_color: '#FAF6F1',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          // Full-bleed with the logo inside the safe zone: Android crops
          // maskable icons to circles or squircles. The "any" icons above
          // have transparent rounded corners and would be cut.
          {
            src: '/icons/icon-maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        // Long-press on the app icon (Android).
        shortcuts: [
          {
            name: 'Commander',
            short_name: 'Commander',
            url: '/#order',
            icons: [{ src: '/icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png' }],
          },
        ],
      },
      workbox: {
        // App shell only. Photos come from /assets/ (hashed, immutable) or
        // from the Sanity CDN and are cached when they are actually shown;
        // precaching them made every first visit download all of them.
        globPatterns: ['**/*.{js,css,html,svg,woff2}', 'bonpainfaitmain-logo.webp'],
        // The SPA fallback answers every navigation with index.html. Real
        // files (e.g. /allergenes.pdf, opened from a link or a mail) and the
        // API must reach the server, or a returning visitor gets the homepage.
        navigateFallbackDenylist: [/^\/api\//, /\.[a-z0-9]+$/i],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/cdn\.sanity\.io\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'sanity-images',
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
        ],
      },
    }),
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
