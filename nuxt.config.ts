export default defineNuxtConfig({
  ssr: false,
  modules: ['@pinia/nuxt', '@vite-pwa/nuxt'],
  css: ['~/assets/css/main.css'],
  app: {
    head: {
      link: [
        { rel: 'manifest', href: 'manifest.webmanifest' },
        { rel: 'icon', type: 'image/png', href: 'icon-192.png' },
      ],
      meta: [
        { name: 'theme-color', content: '#111827' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      ],
    },
  },
  pwa: {
    manifest: {
      name: 'Time Tracker',
      short_name: 'TimeTrack',
      description: 'Отслеживай время по занятиям',
      theme_color: '#111827',
      background_color: '#111827',
      display: 'standalone',
      orientation: 'portrait',
      icons: [
        { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      navigateFallback: 'index.html',
      globPatterns: ['**/*.{js,css,html,png,svg,ico}'],
    },
    registerType: 'autoUpdate',
    devOptions: { enabled: false },
  },
})
