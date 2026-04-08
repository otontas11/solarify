// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      googleMapsApiKey: 'AIzaSyDwx1-vBQwxZ5qvyTXf1E4zBymYby3Kl64',
    },
  },
})
