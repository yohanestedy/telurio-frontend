export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt',
    '@vueuse/nuxt',
  ],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000',
      apiPrefix: process.env.NUXT_PUBLIC_API_PREFIX ?? '/api',
      appName: 'Telurio',
    },
  },
  app: {
    head: {
      title: 'Telurio',
      meta: [
        {
          name: 'viewport',
          content: 'width=device-width, initial-scale=1, maximum-scale=1',
        },
        {
          name: 'description',
          content: 'Telurio Egg Farm Management System',
        },
      ],
    },
  },
  typescript: {
    strict: true,
    typeCheck: false,
  },
  imports: {
    dirs: ['app/composables', 'app/stores', 'app/utils', 'app/types'],
  },
})
