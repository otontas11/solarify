<script setup>
import { systemCategories } from '~/data/on-grid.js'

useHead({
  title: 'Solarify | Gunes Enerjisi Simulatoru',
  meta: [
    {
      name: 'description',
      content:
        'Gunes enerjisi sistem tipini secin: On-Grid, Off-Grid ve daha fazlasi.',
    },
  ],
})

const selectCategory = (key) => {
  const cat = systemCategories.find((c) => c.key === key)
  if (!cat?.available) return

  if (key === 'on-grid') {
    navigateTo('/on-grid')
  } else if (key === 'off-grid') {
    navigateTo('/off-grid')
  }
}
</script>

<template>
  <main class="page-shell">
    <section class="hero hero-blue">
      <div class="hero-copy">
        <p class="eyebrow">Gunes Enerjisi Simulatoru / v1.1</p>
        <h1>Konum sec, cati alanini ciz, uretim ve tasarruf hesabi yap.</h1>
        <p class="hero-text">
          Adres arayarak konumunuzu secin, haritada panel kurulacak alani cizin,
          PVGIS verisiyle yillik uretim, tasarruf ve geri donus suresi hesaplayin.
        </p>
        <div class="hero-badges">
          <span>Google Places</span>
          <span>Polygon alan secimi</span>
          <span>PVGIS tabanli uretim</span>
        </div>
      </div>

      <aside class="hero-summary card">
        <p class="card-kicker">Hizli Baslangic</p>
        <div class="metric-row">
          <span>On-Grid</span>
          <strong>Sebekeye bagli sistem hesabi</strong>
        </div>
        <div class="metric-row">
          <span>Off-Grid</span>
          <strong>Bataryali bagimsiz sistem hesabi</strong>
        </div>
        <div class="metric-row">
          <span>PVGIS</span>
          <strong>Avrupa Komisyonu veritabani</strong>
        </div>
      </aside>
    </section>

    <section class="card">
      <div class="section-head">
        <p class="section-step">Kategori Secimi</p>
        <h2>Gunes enerjisi sistem tipini secin</h2>
      </div>

      <div class="category-grid">
        <button
          v-for="cat in systemCategories"
          :key="cat.key"
          class="system-card"
          :class="{ disabled: !cat.available }"
          type="button"
          @click="selectCategory(cat.key)"
        >
          <span class="category-icon">{{ cat.icon }}</span>
          <strong>{{ cat.label }}</strong>
          <span>{{ cat.description }}</span>
          <span v-if="!cat.available" class="system-badge">Yakinda</span>
        </button>
      </div>
    </section>
  </main>
</template>
