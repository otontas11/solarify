<template>
  <section class="live-estimate-strip card">
    <div class="live-estimate-header">
      <p class="section-step">Anlik Tahmin</p>
      <strong v-if="cityLabel" class="estimate-location">{{ cityLabel }}</strong>
      <small class="estimate-note-inline">
        {{ hasPvgis ? 'PVGIS verimi kullaniliyor' : 'Turkiye ortalamasi (1400 kWh/kWp) ile tahmini hesap' }}
      </small>
      <div v-if="isCalculating" class="calc-indicator">Hesaplaniyor...</div>
    </div>
    <div class="live-estimate-grid">
      <div class="live-estimate-item">
        <span>Panel sayisi</span>
        <strong>{{ number(estimate.panelCount) }} adet</strong>
      </div>
      <div class="live-estimate-item">
        <span>Sistem gucu</span>
        <strong>{{ number(estimate.systemSizeKw, 2) }} kWp</strong>
      </div>
      <div class="live-estimate-item">
        <span>Yillik uretim</span>
        <strong>{{ number(estimate.yearlyProduction) }} kWh</strong>
      </div>
      <div class="live-estimate-item">
        <span>Yillik tasarruf</span>
        <strong>{{ currency(estimate.yearlySavings) }}</strong>
      </div>
      <div class="live-estimate-item">
        <span>Kurulum maliyeti</span>
        <strong>{{ currency(estimate.installationCost) }}</strong>
      </div>
      <div class="live-estimate-item">
        <span>Geri donus</span>
        <strong>{{
            estimate.paybackYears === Infinity ? '—' : number(estimate.paybackYears, 1) + ' yil'
          }}</strong>
      </div>
    </div>

  </section>
</template>

<script setup>
defineProps({
  cityLabel: { type: String, default: '' },
  estimate: { type: Object, required: true },
  hasPvgis: { type: Boolean, default: false },
  isCalculating: { type: Boolean, default: false },
})

const currency = (value) =>
    new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 0,
    }).format(value)

const number = (value, digits = 0) =>
    new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value)
</script>
