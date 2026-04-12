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
  hooks: {
    'pages:extend'(pages) {
      // pages/ altindaki components/ klasorlerini route olarak algilamamasi icin
      const removeComponentRoutes = (list) => {
        for (let i = list.length - 1; i >= 0; i--) {
          if (list[i].path.includes('/components')) {
            list.splice(i, 1)
          } else if (list[i].children) {
            removeComponentRoutes(list[i].children)
          }
        }
      }
      removeComponentRoutes(pages)
    },
  },
})
