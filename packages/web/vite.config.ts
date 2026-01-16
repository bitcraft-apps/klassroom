import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/klassroom/',
  plugins: [
    VitePWA({
      registerType: 'prompt',
      scope: '/klassroom/',
      manifest: {
        name: 'Klassroom',
        short_name: 'Klassroom',
        description: 'Generator prezentacji z ocenami dla zebrań z rodzicami',
        theme_color: '#2563eb',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/klassroom/',
        lang: 'pl',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          // Note: Maskable icon removed - current icon has baked-in rounded corners
          // which causes clipping issues. Create a dedicated maskable icon with
          // full-bleed background and content within 80% safe zone if needed.
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
      },
    }),
  ],
});
