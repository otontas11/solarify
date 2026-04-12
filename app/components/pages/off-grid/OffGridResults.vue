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
            <small>2 gun otonom, %80 DoD</small>
          </div>
          <div class="result-tile">
            <span>Tahmini Maliyet</span>
            <strong>{{ currency(result.costMin) }} — {{ currency(result.costMax) }}</strong>
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
          <div class="result-tile">
            <span>CO2 Azaltma</span>
            <strong>{{ number(result.co2OffsetKg) }} kg/yil</strong>
          </div>
          <div class="result-tile">
            <span>Agac Esdegeri</span>
            <strong>{{ number(result.treeEquivalent) }} agac</strong>
            <small>yillik CO2 absorpsiyonu</small>
          </div>
          <div class="result-tile">
            <span>Yol Esdegeri</span>
            <strong>{{ number(result.roadEquivalentKm) }} km</strong>
            <small>tasit emisyon karsiligi</small>
          </div>
        </div>

        <!-- Aylik uretim vs tuketim chart -->
        <div class="chart-card" style="margin-top: 18px;">
          <div class="chart-head">
            <strong>Aylik uretim vs tuketim</strong>
          </div>
          <div class="bars">
            <div v-for="item in result.monthlySeries" :key="item.month" class="bar-group">
              <div class="bar-track">
                <div
                    :style="{ height: `${(item.production / maxMonthlyProduction) * 100}%` }"
                    class="bar production"
                />
              </div>
              <div class="bar-track muted">
                <div
                    :style="{ height: `${(item.consumption / maxMonthlyConsumption) * 100}%` }"
                    class="bar consumption"
                />
              </div>
              <small>{{ item.month }}</small>
            </div>
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
const props = defineProps({
  result: { type: Object, default: null },
  isCalculating: { type: Boolean, default: false },
  calculationError: { type: String, default: '' },
})

const maxMonthlyProduction = computed(() =>
    Math.max(...(props.result?.monthlySeries.map((entry) => entry.production) ?? [1]), 1),
)
const maxMonthlyConsumption = computed(() =>
    Math.max(...(props.result?.monthlySeries.map((entry) => entry.consumption) ?? [1]), 1),
)

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
