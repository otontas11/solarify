<template>
  <aside class="results-column">
    <section class="card sticky-card">
      <div class="section-head">
        <p class="section-step">Tahmini Sonuclar</p>
        <h2>Off-Grid Sistem Ozeti</h2>
      </div>

      <div v-if="isCalculating" class="loading-state">
        PVGIS verisi aliniyor...
      </div>

      <div v-else-if="calculationError" class="error-state">
        {{ calculationError }}
      </div>

      <template v-else-if="result">
        <div class="result-grid one-col">
          <div class="result-tile">
            <span>Sehir</span>
            <strong>{{ result.cityLabel || '-' }}</strong>
          </div>
          <div class="result-tile">
            <span>Sistem Gucu</span>
            <strong>{{ number(result.systemSizeKw, 2) }} kWp</strong>
          </div>
          <div class="result-tile">
            <span>Yillik Uretim</span>
            <strong>{{ number(result.yearlyProduction) }} kWh</strong>
          </div>
          <div class="result-tile">
            <span>Panel Sayisi</span>
            <strong>{{ number(result.panelCount) }}</strong>
          </div>
          <div class="result-tile">
            <span>Anlik Tuketim</span>
            <strong>{{ number(result.instantaneousConsumptionKw, 2) }} kW</strong>
          </div>
          <div class="result-tile">
            <span>Gunluk Tuketim</span>
            <strong>{{ number(result.dailyConsumptionKwh, 2) }} kWh</strong>
          </div>
          <div class="result-tile">
            <span>Gunezsiz Tuketim</span>
            <strong>{{ number(result.nighttimeConsumptionKwh, 2) }} kWh</strong>
          </div>
          <div class="result-tile">
            <span>Batarya Kapasitesi</span>
            <strong>{{ number(result.batterySizeKwh, 1) }} kWh</strong>
            <small>3 gun otonom</small>
          </div>
          <div class="result-tile">
            <span>Tahmini Maliyet</span>
            <strong>{{ currency(result.installationCost) }}</strong>
            <small>Panel + Inverter + Batarya</small>
          </div>
          <div class="result-tile">
            <span>Verim</span>
            <strong>%{{ number(result.efficiency, 1) }}</strong>
          </div>
          <div class="result-tile">
            <span>Panel Alani</span>
            <strong>{{ number(result.areaM2, 1) }} m²</strong>
          </div>
        </div>
      </template>

      <div v-else class="validation-hint">
        Konum secin, cihaz ekleyin — sonuclar otomatik hesaplanacak.
      </div>
    </section>
  </aside>
</template>

<script setup>
defineProps({
  result: { type: Object, default: null },
  isCalculating: { type: Boolean, default: false },
  calculationError: { type: String, default: '' },
})

const number = (value, digits = 0) =>
    new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value)

const currency = (value) =>
    new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      maximumFractionDigits: 0,
    }).format(value)
</script>
