<script setup lang="ts">
import {
  calculatorModes,
  defaultOnGridForm,
  locationPresets,
  orientationOptions,
  roofOptions,
  systemOptions,
  tiltOptions,
} from '~/data/on-grid'
import { calculateOnGrid } from '~/composables/useOnGridCalculator'

useHead({
  title: 'Solarify | On Grid Gunes Enerjisi Simulasyonu',
  meta: [
    {
      name: 'description',
      content:
        'On grid gunes enerjisi sistemleri icin lokasyon, cati ve tuketim bazli simulasyon araci.',
    },
  ],
})

const form = reactive(defaultOnGridForm())
const result = computed(() => calculateOnGrid(form))
const selectedLocation = computed(
  () => locationPresets.find((item) => item.id === form.locationId) ?? locationPresets[0],
)
const selectedModeMeta = computed(
  () => calculatorModes.find((item) => item.value === form.calculatorMode) ?? calculatorModes[0],
)

const currency = (value: number) =>
  new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(value)

const number = (value: number, digits = 0) =>
  new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
</script>

<template>
  <main class="page-shell">
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">Solarify / Faz 1</p>
        <h1>On Grid gunes enerjisi hesaplama akisini saglam bir temele kuruyoruz.</h1>
        <p class="hero-text">
          Bu ilk surum, CW Enerji simulatorundeki temel akisi referans alip
          <strong>sistem secimi</strong>, <strong>hesap modu</strong>,
          <strong>lokasyon</strong> ve <strong>opsiyonlar</strong> adimlarini tek yerde toplar.
          Hedefimiz yalnizca ekran degil; genisleyebilir ve dogrulanabilir bir hesap motoru.
        </p>
        <div class="hero-badges">
          <span>On Grid odakli</span>
          <span>Basit + gelismis mod</span>
          <span>Canli finansal geri donus</span>
        </div>
      </div>

      <aside class="hero-summary card">
        <p class="card-kicker">Canli Sonuc</p>
        <div class="metric-row">
          <span>Kurulu guc</span>
          <strong>{{ number(result.systemSizeKw, 2) }} kWp</strong>
        </div>
        <div class="metric-row">
          <span>Yillik uretim</span>
          <strong>{{ number(result.annualProduction) }} kWh</strong>
        </div>
        <div class="metric-row">
          <span>Yillik tasarruf</span>
          <strong>{{ currency(result.annualSavings) }}</strong>
        </div>
        <div class="metric-row">
          <span>Amortisman</span>
          <strong>{{ number(result.paybackPeriod, 1) }} yil</strong>
        </div>
      </aside>
    </section>

    <section class="content-grid">
      <div class="flow-column">
        <section class="card">
          <div class="section-head">
            <p class="section-step">1. Sistem Secimi</p>
            <h2>Ilk fazda on-grid akisini aciyoruz</h2>
          </div>

          <div class="system-grid">
            <button
              v-for="system in systemOptions"
              :key="system.key"
              class="system-card"
              :class="{
                active: form.selectedSystem === system.key,
                disabled: !system.available,
              }"
              :disabled="!system.available"
              type="button"
              @click="form.selectedSystem = system.key"
            >
              <span v-if="system.badge" class="system-badge">{{ system.badge }}</span>
              <strong>{{ system.title }}</strong>
              <span>{{ system.description }}</span>
            </button>
          </div>
        </section>

        <section class="card">
          <div class="section-head">
            <p class="section-step">2. Hesap Turu</p>
            <h2>Basit ve gelismis senaryolar ayri kurgulandi</h2>
          </div>

          <div class="mode-grid">
            <button
              v-for="mode in calculatorModes"
              :key="mode.value"
              class="mode-card"
              :class="{ active: form.calculatorMode === mode.value }"
              type="button"
              @click="form.calculatorMode = mode.value"
            >
              <strong>{{ mode.title }}</strong>
              <span>{{ mode.description }}</span>
            </button>
          </div>
        </section>

        <section class="card">
          <div class="section-head">
            <p class="section-step">3. Lokasyon</p>
            <h2>Bolgesel verim farki sonucu dogrudan etkiliyor</h2>
          </div>

          <div class="location-grid">
            <button
              v-for="location in locationPresets"
              :key="location.id"
              class="location-card"
              :class="{ active: form.locationId === location.id }"
              type="button"
              @click="form.locationId = location.id"
            >
              <strong>{{ location.city }}</strong>
              <span>{{ location.region }}</span>
              <small>{{ number(location.annualYield) }} kWh/kWp-yil</small>
            </button>
          </div>
        </section>

        <section class="card">
          <div class="section-head">
            <p class="section-step">4. Opsiyonlar</p>
            <h2>{{ selectedModeMeta.title }} icin gerekli parametreler</h2>
          </div>

          <div class="form-grid">
            <label>
              <span>Aylik elektrik faturasi (TL)</span>
              <input v-model.number="form.monthlyBill" min="0" step="100" type="number" />
            </label>

            <label>
              <span>Aylik tuketim (kWh)</span>
              <input v-model.number="form.monthlyConsumption" min="0" step="10" type="number" />
            </label>

            <label>
              <span>Kullanilabilir cati/alani (m2)</span>
              <input v-model.number="form.roofArea" min="10" step="1" type="number" />
            </label>

            <label>
              <span>Cati tipi</span>
              <select v-model="form.roofType">
                <option v-for="option in roofOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </label>

            <label>
              <span>Panel gucu (Wp)</span>
              <input v-model.number="form.panelPower" min="100" step="5" type="number" />
            </label>

            <label>
              <span>Panel alani (m2)</span>
              <input v-model.number="form.panelArea" min="1" step="0.1" type="number" />
            </label>

            <template v-if="form.calculatorMode === 'advanced'">
              <label>
                <span>Yon</span>
                <select v-model="form.orientation">
                  <option
                    v-for="option in orientationOptions"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </label>

              <label>
                <span>Egim</span>
                <select v-model="form.tilt">
                  <option v-for="option in tiltOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
              </label>

              <label>
                <span>Golgelenme kaybi (%)</span>
                <input v-model.number="form.shadingLoss" max="35" min="0" step="1" type="number" />
              </label>

              <label>
                <span>Inverter verimi (%)</span>
                <input
                  v-model.number="form.inverterEfficiency"
                  max="100"
                  min="80"
                  step="1"
                  type="number"
                />
              </label>

              <label>
                <span>Performans orani (%)</span>
                <input
                  v-model.number="form.performanceRatio"
                  max="100"
                  min="60"
                  step="1"
                  type="number"
                />
              </label>

              <label>
                <span>Oz tuketim orani (%)</span>
                <input
                  v-model.number="form.selfConsumptionRate"
                  max="100"
                  min="10"
                  step="1"
                  type="number"
                />
              </label>

              <label>
                <span>Birim elektrik fiyati (TL/kWh)</span>
                <input
                  v-model.number="form.electricityUnitPrice"
                  max="20"
                  min="0.1"
                  step="0.1"
                  type="number"
                />
              </label>

              <label>
                <span>Yillik fiyat artisi (%)</span>
                <input
                  v-model.number="form.annualPriceIncrease"
                  max="100"
                  min="0"
                  step="1"
                  type="number"
                />
              </label>

              <label>
                <span>Kurulum maliyeti (TL/kWp)</span>
                <input
                  v-model.number="form.installationCostPerKw"
                  min="1000"
                  step="500"
                  type="number"
                />
              </label>

              <label>
                <span>Yillik bakim orani (%)</span>
                <input
                  v-model.number="form.maintenanceRate"
                  max="10"
                  min="0"
                  step="0.1"
                  type="number"
                />
              </label>

              <label>
                <span>Panel adedi (opsiyonel limit)</span>
                <input
                  v-model.number="form.panelCountOverride"
                  min="0"
                  placeholder="Bos birakilirsa alan bazli hesaplanir"
                  step="1"
                  type="number"
                />
              </label>
            </template>
          </div>
        </section>
      </div>

      <aside class="results-column">
        <section class="card sticky-card">
          <div class="section-head">
            <p class="section-step">5. Sonuc</p>
            <h2>On-grid teklif ozeti</h2>
          </div>

          <div class="result-grid">
            <div class="result-tile">
              <span>Secilen sehir</span>
              <strong>{{ selectedLocation.city }}</strong>
              <small>{{ selectedLocation.climateNote }}</small>
            </div>
            <div class="result-tile">
              <span>Panel adedi</span>
              <strong>{{ number(result.panelCount) }}</strong>
              <small>{{ number(result.systemSizeKw, 2) }} kWp toplam guc</small>
            </div>
            <div class="result-tile">
              <span>Yillik uretim</span>
              <strong>{{ number(result.annualProduction) }} kWh</strong>
              <small>Aylik ort. {{ number(result.monthlyAverageProduction) }} kWh</small>
            </div>
            <div class="result-tile">
              <span>Tuketim karsilama</span>
              <strong>%{{ number(result.coverageRatio, 1) }}</strong>
              <small>{{ number(result.selfConsumedEnergy) }} kWh oz tuketim</small>
            </div>
            <div class="result-tile">
              <span>Seebekeye verilen enerji</span>
              <strong>{{ number(result.exportedEnergy) }} kWh</strong>
              <small>Mahsuplasma/fazla enerji senaryosu icin temel veri</small>
            </div>
            <div class="result-tile">
              <span>Yillik tasarruf</span>
              <strong>{{ currency(result.annualSavings) }}</strong>
              <small>Bakim once ilk yil brutu</small>
            </div>
            <div class="result-tile">
              <span>Tahmini sistem bedeli</span>
              <strong>{{ currency(result.estimatedSystemCost) }}</strong>
              <small>Bakim: {{ currency(result.yearlyMaintenanceCost) }}/yil</small>
            </div>
            <div class="result-tile">
              <span>25 yil net kazanc</span>
              <strong>{{ currency(result.twentyFiveYearNetGain) }}</strong>
              <small>Fiyat artisi senaryosu dahil</small>
            </div>
            <div class="result-tile">
              <span>Karbon ofseti</span>
              <strong>{{ number(result.co2OffsetKg) }} kg/yil</strong>
              <small>Yaklasik sera gazi azaltimi</small>
            </div>
          </div>

          <div class="note-box">
            <strong>Sistem notu</strong>
            <p>
              Bu hesap motoru ilk faz icin hizli teklif uretecek sekilde tasarlandi.
              En dogru sonuca gecmek icin bir sonraki adimda il/ilce bazli radyasyon verisi,
              gercek panel-inverter kataloglari ve mahsuplasma kurallariyla beslenmeli.
            </p>
          </div>
        </section>
      </aside>
    </section>
  </main>
</template>
