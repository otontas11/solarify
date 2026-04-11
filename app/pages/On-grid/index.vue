<template>
  <main class="page-shell">
    <div class="breadcrumb">
      <NuxtLink to="/">← Kategori Secimi</NuxtLink>
    </div>

    <section class="hero hero-blue">
      <div class="hero-copy">
        <p class="eyebrow">On-Grid Fizibilite / PVGIS</p>
        <h1>Sebekeye bagli gunes enerjisi sistemi fizibilitesi</h1>
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
        <p class="card-kicker">Canli Ozet</p>
        <div class="metric-row">
          <span>Secilen konum</span>
          <strong>{{ location.cityLabel || 'Konum secilmedi' }}</strong>
        </div>
        <div class="metric-row">
          <span>Cizilen alan</span>
          <strong>{{ number(location.drawnAreaM2) }} m2</strong>
        </div>
        <div class="metric-row">
          <span>Turetilen tuketim</span>
          <strong>{{ number(monthlyConsumptionDerived) }} kWh/ay</strong>
        </div>
        <div class="metric-row">
          <span>Gunluk guneslenme</span>
          <strong>{{ isLoadingSummary ? '...' : locationSummary ? locationSummary.dailySunHours + ' saat/gun' : '—' }}</strong>
        </div>
        <div class="metric-row">
          <span>Son hesap</span>
          <strong>{{ result ? number(result.paybackYears, 1) + ' yil' : 'Hesap bekleniyor' }}</strong>
        </div>
      </aside>
    </section>

    <section class="wizard-shell">
      <div class="stepper stepper-2">
        <button
            v-for="(step, index) in steps"
            :key="step.key"
            class="step-chip"
            :class="{
            active: currentStep === step.key,
            complete: index < activeStepIndex,
          }"
            type="button"
            @click="jumpToStep(step.key)"
        >
          <strong>0{{ index + 1 }}</strong>
          <span>{{ step.title }}</span>
          <small>{{ step.summary }}</small>
        </button>
      </div>

      <!-- Anlik Tahmin - tabların altında yatay -->
      <section class="live-estimate-strip card">
        <div class="live-estimate-header">
          <p class="section-step">Anlik Tahmin</p>
          <small class="estimate-note-inline">
            {{ result ? 'PVGIS verimi kullaniliyor' : 'Turkiye ortalamasi (1400 kWh/kWp) ile tahmini hesap' }}
          </small>
          <div v-if="isCalculating" class="calc-indicator">Hesaplaniyor...</div>
        </div>
        <div class="live-estimate-grid">
          <div class="live-estimate-item">
            <span>Panel sayisi</span>
            <strong>{{ number(liveEstimate.panelCount) }} adet</strong>
          </div>
          <div class="live-estimate-item">
            <span>Sistem gucu</span>
            <strong>{{ number(liveEstimate.systemSizeKw, 2) }} kWp</strong>
          </div>
          <div class="live-estimate-item">
            <span>Yillik uretim</span>
            <strong>{{ number(liveEstimate.yearlyProduction) }} kWh</strong>
          </div>
          <div class="live-estimate-item">
            <span>Yillik tasarruf</span>
            <strong>{{ currency(liveEstimate.yearlySavings) }}</strong>
          </div>
          <div class="live-estimate-item">
            <span>Kurulum maliyeti</span>
            <strong>{{ currency(liveEstimate.installationCost) }}</strong>
          </div>
          <div class="live-estimate-item">
            <span>Geri donus</span>
            <strong>{{ liveEstimate.paybackYears === Infinity ? '—' : number(liveEstimate.paybackYears, 1) + ' yil' }}</strong>
          </div>
        </div>

        <!-- Konum Gunes Potansiyeli - kompakt -->
        <div v-if="isLoadingSummary" class="solar-potansiyel-bar solar-potansiyel-loading">
          <strong class="solar-potansiyel-title">{{ location.cityLabel }}</strong>
          <span>Gunes verileri aliniyor...</span>
        </div>
        <div v-else-if="locationSummary" class="solar-potansiyel-bar">
          <strong class="solar-potansiyel-title">{{ location.cityLabel }}</strong>
          <div class="solar-potansiyel-items">
            <span>&#9728; {{ locationSummary.dailySunHours }} saat/gun</span>
            <span>&#9889; {{ number(locationSummary.pvYield) }} kWh/kWp</span>
            <span>&#9788; {{ number(locationSummary.irradiation) }} kWh/m2</span>
            <span v-if="locationSummary.optimalAngle !== null">&#9650; {{ number(locationSummary.optimalAngle, 1) }}°</span>
          </div>
          <small>PVGIS</small>
        </div>
      </section>

      <!-- STEP 1: Konum & Alan (full width) -->
      <section v-if="currentStep === 'location'" class="card location-card-full">
        <div class="section-head">
          <p class="section-step">1. Konum ve Alan</p>
          <h2>Il / ilce arayin, sonra cati veya arazi alanini poligon ile secin</h2>
        </div>

        <ClientOnly>
          <SolarMapSelector
              :address="location.address"
              :area-m2="location.drawnAreaM2"
              :city-label="location.cityLabel"
              :lat="location.lat"
              :lng="location.lng"
              @area-change="handleAreaChange"
              @location-change="handleLocationChange"
          />
        </ClientOnly>

        <!-- Konum Gunes Verileri -->
        <div v-if="isLoadingSummary" class="location-solar-card loading-state">
          Gunes verileri aliniyor...
        </div>
        <div v-else-if="locationSummary" class="location-solar-card">
          <div class="location-solar-header">
            <strong>{{ location.cityLabel }} - Gunes Enerjisi Potansiyeli</strong>
            <small>PVGIS (Avrupa Komisyonu) veritabanindan alinmistir</small>
          </div>
          <div class="location-solar-grid">
            <div class="solar-stat">
              <span class="solar-stat-icon">&#9728;</span>
              <strong>{{ locationSummary.dailySunHours }} saat/gun</strong>
              <span>Ortalama guneslenme suresi</span>
            </div>
            <div class="solar-stat">
              <span class="solar-stat-icon">&#9889;</span>
              <strong>{{ number(locationSummary.pvYield) }} kWh/kWp</strong>
              <span>1 kWp panel yillik uretim</span>
            </div>
            <div class="solar-stat">
              <span class="solar-stat-icon">&#9788;</span>
              <strong>{{ number(locationSummary.irradiation) }} kWh/m2</strong>
              <span>Yillik gunes isinimi</span>
            </div>
            <div v-if="locationSummary.optimalAngle !== null" class="solar-stat">
              <span class="solar-stat-icon">&#9650;</span>
              <strong>{{ number(locationSummary.optimalAngle, 1) }}°</strong>
              <span>Bu konum icin ideal panel acisi</span>
            </div>
          </div>
        </div>

        <p v-if="!canProceedFromLocation" class="validation-hint">
          Devam etmek icin adres secin ve haritada alan cizin.
        </p>

        <div class="wizard-actions">
          <button
              class="primary-btn"
              :disabled="!canProceedFromLocation"
              type="button"
              @click="nextStep"
          >
            Devam Et
          </button>
        </div>
      </section>

      <div v-if="currentStep === 'details'" class="content-grid">
        <div class="flow-column">
          <!-- STEP 2: Bilgiler -->
          <section class="card">
            <div class="section-head">
              <p class="section-step">2. Bilgi Girisi</p>
              <h2>Hesaplama modunu secin ve bilgilerinizi girin</h2>
            </div>

            <!-- Mod Secimi -->
            <div class="mode-toggle">
              <button
                  type="button"
                  :class="{ active: form.calculationMode === 'simple' }"
                  @click="form.calculationMode = 'simple'"
              >
                Basit
              </button>
              <button
                  type="button"
                  :class="{ active: form.calculationMode === 'advanced' }"
                  @click="form.calculationMode = 'advanced'"
              >
                Gelismis
              </button>
            </div>

            <!-- Abone Grubu -->
            <div class="field-group">
              <p class="field-group-title">Abone Grubu</p>
              <div class="subscriber-grid">
                <button
                    v-for="group in subscriberGroups"
                    :key="group.value"
                    type="button"
                    :class="{ active: form.subscriberGroup === group.value }"
                    @click="form.subscriberGroup = group.value"
                >
                  <span class="subscriber-icon">{{ group.icon }}</span>
                  <strong>{{ group.label }}</strong>
                </button>
              </div>
            </div>

            <!-- Tarife Bilgisi -->
            <div class="tariff-info">
              <p class="tariff-info-title">Guncel Tarife ({{ currentTariff.label }})</p>
              <div class="tariff-info-grid">
                <span>Birim fiyat:</span>
                <div class="tariff-input-wrap">
                  <input
                      v-model.number="form.electricityBuyPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      class="tariff-input"
                  />
                  <span class="tariff-unit">TL/kWh</span>
                </div>
                <span>Satis fiyati:</span>
                <div class="tariff-input-wrap">
                  <input
                      v-model.number="form.electricitySellPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      class="tariff-input"
                  />
                  <span class="tariff-unit">TL/kWh</span>
                </div>
              </div>
            </div>

            <!-- Cati Cephesi -->
            <div class="field-group">
              <p class="field-group-title">Cati Cephesi</p>
              <div class="direction-grid">
                <button
                    v-for="dir in roofDirections"
                    :key="dir.value"
                    type="button"
                    :class="{ active: form.roofDirection === dir.value }"
                    @click="form.roofDirection = dir.value"
                >
                  {{ dir.label }}
                </button>
              </div>
            </div>

            <!-- Cati Tipi -->
            <div class="field-group">
              <p class="field-group-title">Cati Tipi</p>
              <div class="roof-type-grid">
                <button
                    v-for="option in roofOptions"
                    :key="option.value"
                    type="button"
                    :class="{ active: form.roofType === option.value }"
                    @click="form.roofType = option.value"
                >
                  <strong>{{ option.label }}</strong>
                  <span>Kaplama: %{{ number(option.coverageFactor * 100, 0) }}</span>
                </button>
              </div>
              <div class="range-field" style="margin-top: 0.5rem;">
                <div class="range-header">
                  <span>Çatı Kaplama Orani ( {{form.roofType}} ) </span>
                  <strong>%{{ number(form.coverageFactor * 100, 0) }}</strong>
                </div>
                <input
                    v-model.number="form.coverageFactor"
                    type="range"
                    min="0.30"
                    max="0.95"
                    step="0.01"
                />
              </div>
            </div>

            <!-- Aylik Elektrik Faturasi -->
            <div class="field-group">
              <div class="range-field">
                <div class="range-header">
                  <span>Aylik Elektrik Faturasi</span>
                  <strong>{{ currency(form.monthlyBill) }}</strong>
                </div>
                <input
                    v-model.number="form.monthlyBill"
                    type="range"
                    min="500"
                    max="50000"
                    step="100"
                />
              </div>
            </div>

            <!-- Cati Acisi -->
            <div class="field-group">
              <div class="range-field">
                <div class="range-header">
                  <span>Cati Acisi</span>
                  <strong>{{ form.roofAngle }}°</strong>
                </div>
                <input
                    v-model.number="form.roofAngle"
                    type="range"
                    min="0"
                    max="45"
                    step="1"
                />
              </div>
            </div>

            <!-- Kurulum Tipi -->
            <div class="field-group">
              <p class="field-group-title">Kurulum Tipi</p>
              <div class="mounting-toggle">
                <button
                    v-for="opt in mountingOptions"
                    :key="opt.value"
                    type="button"
                    :class="{ active: form.mountingPlace === opt.value }"
                    @click="form.mountingPlace = opt.value"
                >
                  {{ opt.label }}
                </button>
              </div>
            </div>

            <!-- Checkboxlar -->
            <div class="field-group">
              <label class="checkbox-field">
                <input v-model="form.coverFullBill" type="checkbox" />
                <span>Faturanin tamamini karsilamak istiyorum</span>
              </label>
              <label class="checkbox-field">
                <input v-model="form.coverFullRoof" type="checkbox" />
                <span>Catimin tamamini kaplamak istiyorum</span>
              </label>
            </div>

            <!-- Gelismis Mod -->
            <template v-if="form.calculationMode === 'advanced'">
              <div class="field-group">
                <p class="field-group-title">Gunes Paneli</p>
                <div class="panel-grid">
                  <button
                      v-for="panel in panelOptions"
                      :key="panel.value"
                      type="button"
                      :class="{ active: form.selectedPanel === panel.value }"
                      @click="selectPanel(panel.value)"
                  >
                    <strong>{{ panel.label }}</strong>
                    <span>{{ panel.power }}Wp / {{ panel.area }} m2</span>
                  </button>
                </div>
              </div>

              <div class="advanced-fields">
                <label>
                  <span>Elektrik Alis Fiyati (TL/kWh)</span>
                  <input v-model.number="form.electricityBuyPrice" min="0" step="0.01" type="number" />
                </label>
                <label>
                  <span>Elektrik Satis Fiyati (TL/kWh)</span>
                  <input v-model.number="form.electricitySellPrice" min="0" step="0.01" type="number" />
                </label>
                <label>
                  <span>Yillik Elektrik Zam Orani (%)</span>
                  <input v-model.number="form.annualEscalationRate" min="0" max="50" step="1" type="number" />
                </label>
                <label>
                  <span>Yillik Elektrik Tuketimi (kWh)</span>
                  <input v-model.number="form.yearlyConsumption" min="0" placeholder="Bos birakilirsa faturadan hesaplanir" step="100" type="number" />
                </label>
                <label>
                  <span>Aylik Fatura Tutari (TL)</span>
                  <input v-model.number="form.monthlyBill" min="1" step="100" type="number" />
                </label>
                <label>
                  <span>Elektrik Birim Fiyati (TL/kWh)</span>
                  <input v-model.number="form.electricityPrice" min="0.1" step="0.1" type="number" />
                </label>
              </div>

              <div class="advanced-toggle">
                <button class="text-btn" type="button" @click="showAdvanced = !showAdvanced">
                  {{ showAdvanced ? 'Teknik ayarlari gizle' : 'Teknik ayarlar' }}
                </button>
              </div>

              <div v-if="showAdvanced" class="form-grid advanced-grid">
                <label>
                  <span>Panel alani (m2)</span>
                  <input v-model.number="form.panelArea" min="2" step="0.1" type="number" />
                </label>
                <label>
                  <span>Inverter verimi (%)</span>
                  <input v-model.number="form.inverterEfficiency" max="100" min="90" step="1" type="number" />
                </label>
                <label>
                  <span>Sistem kaybi (%)</span>
                  <input v-model.number="form.systemLoss" max="30" min="0" step="1" type="number" />
                </label>
                <label>
                  <span>Yillik degradasyon (%)</span>
                  <input v-model.number="form.annualDegradation" max="3" min="0" step="0.1" type="number" />
                </label>
                <label>
                  <span>Kurulum maliyeti (TL/kWp)</span>
                  <input v-model.number="form.installationCostPerKw" min="10000" step="500" type="number" />
                </label>
              </div>
            </template>

            <div class="assumption-strip">
              <div class="mini-stat">
                <span>Secilen alan</span>
                <strong>{{ number(form.drawnAreaM2, 1) }} m2</strong>
              </div>
              <div class="mini-stat">
                <span>Kullanilabilir alan katsayisi</span>
                <strong>x{{ number(form.coverageFactor, 2) }}</strong>
              </div>
              <div class="mini-stat">
                <span>Turetilen tuketim</span>
                <strong>{{ number(monthlyConsumptionDerived) }} kWh/ay</strong>
              </div>
            </div>
          </section>


          <div class="wizard-actions">
            <button
                class="secondary-btn"
                type="button"
                @click="previousStep"
            >
              Geri
            </button>
          </div>
        </div>

        <!-- Sag sidebar: PVGIS sonuclari (step 2 ve 3'te gorunur) -->
        <aside class="results-column">
          <section class="card sticky-card">
            <div class="section-head">
              <p class="section-step">PVGIS Fizibilite Sonuclari</p>
              <h2>Detayli hesaplama</h2>
            </div>

            <div v-if="isCalculating" class="loading-state">
              PVGIS verisi aliniyor...
            </div>

            <div v-else-if="calculationError" class="error-state">
              {{ calculationError }}
            </div>

            <div v-else-if="!result" class="empty-state">
              Veriler girildikce PVGIS hesabi otomatik yapilacak.
            </div>

            <template v-else>
              <div class="result-grid one-col">
                <div class="result-tile">
                  <span>PVGIS yillik verim</span>
                  <strong>{{ number(result.pvYield) }} kWh/kWp-yil</strong>
                  <small>{{ result.cityLabel }}</small>
                </div>
                <div class="result-tile">
                  <span>Kurulabilir sistem gucu</span>
                  <strong>{{ number(result.feasibleSystemSizeKw, 2) }} kWp</strong>
                  <small>Onerilen: {{ number(result.recommendedSystemSizeKw, 2) }} kWp</small>
                </div>
                <div class="result-tile">
                  <span>Panel sayisi</span>
                  <strong>{{ number(result.panelCount) }}</strong>
                  <small>Alan kapasitesi: {{ number(result.areaLimitedPanelCount) }} panel</small>
                </div>
                <div class="result-tile">
                  <span>Yillik uretim</span>
                  <strong>{{ number(result.yearlyProduction) }} kWh</strong>
                  <small>Aylik ort. {{ number(result.monthlyAverageProduction) }} kWh</small>
                </div>
                <div class="result-tile">
                  <span>Yillik tasarruf</span>
                  <strong>{{ currency(result.yearlySavings) }}</strong>
                  <small class="savings-breakdown">
                    Oztuketim: {{ currency(result.savingsBreakdown.selfConsumptionSaving) }}
                    + Satis: {{ currency(result.savingsBreakdown.exportIncome) }}
                  </small>
                </div>
                <div class="result-tile">
                  <span>Kurulum maliyeti</span>
                  <strong>{{ currency(result.installationCost) }}</strong>
                </div>
                <div class="result-tile">
                  <span>Geri donus suresi</span>
                  <strong>{{ number(result.paybackYears, 1) }} yil</strong>
                  <small>%{{ form.annualEscalationRate }} yillik zam ile</small>
                </div>
                <div class="result-tile">
                  <span>Tuketim karsilama</span>
                  <strong>%{{ number(result.selfSufficiencyRate, 1) }}</strong>
                </div>
                <div v-if="result.optimalAngle !== null" class="result-tile">
                  <span>PVGIS Optimal Aci</span>
                  <strong>{{ number(result.optimalAngle, 1) }}°</strong>
                  <small v-if="result.optimalAspect !== null">Azimuth: {{ number(result.optimalAspect, 1) }}°</small>
                </div>
              </div>

              <!-- Aylik uretim chart -->
              <div class="chart-card" style="margin-top: 18px;">
                <div class="chart-head">
                  <strong>Aylik uretim vs tuketim</strong>
                </div>
                <div class="bars">
                  <div v-for="item in result.monthlySeries" :key="item.month" class="bar-group">
                    <div class="bar-track">
                      <div
                          class="bar production"
                          :style="{ height: `${(item.production / maxMonthlyProduction) * 100}%` }"
                      />
                    </div>
                    <div class="bar-track muted">
                      <div
                          class="bar consumption"
                          :style="{ height: `${(item.consumption / maxMonthlyConsumption) * 100}%` }"
                      />
                    </div>
                    <small>{{ item.month }}</small>
                  </div>
                </div>
              </div>
            </template>

            <div class="note-box" style="margin-top: 14px;">
              <p>Bu hesaplama on fizibilite amaclidir.</p>
            </div>
          </section>
        </aside>
      </div>
    </section>
  </main>
</template>

<script setup>
import {
  defaultOnGridForm,
  mountingOptions,
  panelOptions,
  roofDirections,
  roofOptions,
  subscriberGroups,
} from '~/data/on-grid'
import { tariffs } from '~/data/tariffs'

useHead({
  title: 'Solarify | On-Grid Fizibilite',
  meta: [
    {
      name: 'description',
      content: 'Google Places ile konum secimi, harita uzerinde polygon cizimi ve PVGIS tabanli on-grid fizibilite hesabi.',
    },
  ],
})

const { location, setLocation, setArea, hasValidLocation } = useLocationState()

const form = reactive(defaultOnGridForm())
const currentStep = ref('location')
const result = ref(null)
const isCalculating = ref(false)
const calculationError = ref('')
const showAdvanced = ref(true)
const locationSummary = ref(null)
const isLoadingSummary = ref(false)

const steps = [
  { key: 'location', title: 'Konum & Alan', summary: 'Adres ara, cati alanini ciz' },
  { key: 'details', title: 'Bilgiler & Sonuc', summary: 'Bilgi gir, PVGIS sonuclarini gor' },
]

// Sync shared location into form
watchEffect(() => {
  form.address = location.value.address
  form.cityLabel = location.value.cityLabel
  form.lat = location.value.lat
  form.lng = location.value.lng
  form.drawnAreaM2 = location.value.drawnAreaM2
  console.log('[LOCATION → FORM] Konum form\'a senkronize edildi:', {
    address: form.address,
    cityLabel: form.cityLabel,
    lat: form.lat,
    lng: form.lng,
    drawnAreaM2: form.drawnAreaM2,
  })
})

// Abone grubu degisince tarife fiyatlarini guncelle
const currentTariff = computed(() => tariffs[form.subscriberGroup])

watch(
  () => form.subscriberGroup,
  (group) => {
    const t = tariffs[group]
    if (!t) return
    console.log('[TARIFE] Abone grubu değişti →', {
      group,
      label: t.label,
      unitPrice: t.unitPrice,
      sellPrice: t.sellPrice,
    })
    form.electricityBuyPrice = t.unitPrice
    form.electricitySellPrice = t.sellPrice
    form.electricityPrice = t.unitPrice
    console.log('[TARIFE → FORM] Form güncellendi:', {
      electricityBuyPrice: form.electricityBuyPrice,
      electricitySellPrice: form.electricitySellPrice,
      electricityPrice: form.electricityPrice,
    })
  },
)

watch(
  () => form.roofType,
  (type) => {
    const roof = roofOptions.find((r) => r.value === type)
    if (roof) form.coverageFactor = roof.coverageFactor
  },
)

const selectPanel = (panelValue) => {
  form.selectedPanel = panelValue
  const panel = panelOptions.find((p) => p.value === panelValue)
  if (panel) {
    form.panelPower = panel.power
    form.panelArea = panel.area
  }
}

const activeStepIndex = computed(() => steps.findIndex((step) => step.key === currentStep.value))
const roofMeta = computed(() => roofOptions.find((item) => item.value === form.roofType) ?? roofOptions[0])
const monthlyConsumptionDerived = computed(() =>
  form.monthlyConsumption && form.monthlyConsumption > 0
    ? form.monthlyConsumption
    : form.monthlyBill / Math.max(form.electricityPrice, 0.01),
)

const canProceedFromLocation = computed(() => hasValidLocation.value)

const canGoToResults = computed(
  () => canProceedFromLocation.value && form.monthlyBill > 0 && form.electricityPrice > 0,
)

const liveEstimate = computed(() => {
  const pvYield = result.value?.pvYield ?? 1400
  const usableArea = form.drawnAreaM2 * (form.coverageFactor ?? roofMeta.value.coverageFactor ?? 0.84)
  const areaLimitedPeakPower = form.panelArea > 0
    ? (Math.floor(usableArea / form.panelArea) * form.panelPower) / 1000
    : 0
  const yearlyConsumption = monthlyConsumptionDerived.value * 12
  const recommendedSizeKw = pvYield > 0 ? yearlyConsumption / pvYield : 0

  const maxPanels = form.panelArea > 0 ? Math.floor(usableArea / form.panelArea) : 0

  let panelCount
  if (form.coverFullBill) {
    // Fatura bazlı: tüketimi karşılayacak kadar, alan sınırını aşmadan
    const billPanels = form.panelPower > 0
      ? Math.ceil((recommendedSizeKw * 1000) / form.panelPower)
      : 0
    panelCount = Math.min(billPanels, maxPanels)
  } else {
    // Varsayılan: alana sığan panel sayısı (on-grid'de fazla üretim şebekeye satılır)
    panelCount = maxPanels
  }
  panelCount = Math.max(panelCount, usableArea > 0 ? 1 : 0)
  const systemSizeKw = (panelCount * form.panelPower) / 1000
  const yearlyProduction = systemSizeKw * pvYield
  const selfConsumption = Math.min(yearlyProduction, yearlyConsumption)
  const exported = yearlyProduction - selfConsumption
  const yearlySavings = selfConsumption * form.electricityBuyPrice + exported * form.electricitySellPrice
  const costMultiplier = roofMeta.value.costMultiplier ?? 1
  const installationCost = systemSizeKw * form.installationCostPerKw * costMultiplier
  const paybackYears = yearlySavings > 0 ? installationCost / yearlySavings : Infinity

  return { panelCount, systemSizeKw, yearlyProduction, yearlySavings, installationCost, paybackYears }
})

const maxMonthlyProduction = computed(() =>
  Math.max(...(result.value?.monthlySeries.map((entry) => entry.production) ?? [1]), 1),
)
const maxMonthlyConsumption = computed(() =>
  Math.max(...(result.value?.monthlySeries.map((entry) => entry.consumption) ?? [1]), 1),
)
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

const runCalculation = async () => {
  if (!canGoToResults.value || form.lat === null || form.lng === null) {
    return false
  }

  isCalculating.value = true
  calculationError.value = ''

  try {
    const queryParams = {
      address: form.address,
      cityLabel: form.cityLabel,
      lat: form.lat,
      lng: form.lng,
      drawnAreaM2: form.drawnAreaM2,
      roofType: form.roofType,
      monthlyBill: form.monthlyBill,
      electricityPrice: form.electricityPrice,
      monthlyConsumption: form.monthlyConsumption ?? '',
      panelPower: form.panelPower,
      panelArea: form.panelArea,
      inverterEfficiency: form.inverterEfficiency,
      systemLoss: form.systemLoss,
      annualDegradation: form.annualDegradation,
      installationCostPerKw: form.installationCostPerKw,
      roofAngle: form.roofAngle,
      roofDirection: form.roofDirection,
      mountingPlace: form.mountingPlace,
      coverFullBill: form.coverFullBill ? '1' : '',
      coverFullRoof: form.coverFullRoof ? '1' : '',
      coverageFactor: form.coverageFactor,
    }

    queryParams.electricityBuyPrice = form.electricityBuyPrice
    queryParams.electricitySellPrice = form.electricitySellPrice
    queryParams.annualEscalationRate = form.annualEscalationRate
    queryParams.subscriberGroup = form.subscriberGroup

    result.value = await $fetch('/api/solar/calculate', {
      query: queryParams,
    })

    return true
  } catch (error) {
    calculationError.value =
      error instanceof Error ? error.message : 'Hesaplama yapilirken bir sorun olustu.'
    return false
  } finally {
    isCalculating.value = false
  }
}

const nextStep = () => {
  const index = activeStepIndex.value
  const next = steps[index + 1]
  if (!next) return
  if (currentStep.value === 'location' && !canProceedFromLocation.value) return
  currentStep.value = next.key
}

const previousStep = () => {
  const index = activeStepIndex.value
  const prev = steps[index - 1]
  if (prev) {
    currentStep.value = prev.key
  }
}

const jumpToStep = (step) => {
  currentStep.value = step
}

const handleLocationChange = async (payload) => {
  console.log('[LOCATION] İl seçildi → payload:', JSON.parse(JSON.stringify(payload)))
  setLocation(payload)

  // Konum secildiginde temel gunes verilerini cek
  if (payload.lat && payload.lng) {
    locationSummary.value = null
    isLoadingSummary.value = true
    try {
      locationSummary.value = await $fetch('/api/solar/location-summary', {
        query: { lat: payload.lat, lng: payload.lng },
      })
    } catch (e) {
      console.warn('[LOCATION SUMMARY] Veri alinamadi:', e.message)
      locationSummary.value = null
    } finally {
      isLoadingSummary.value = false
    }
  }
}

const handleAreaChange = (areaM2) => {
  setArea(areaM2)
}

// --- Debounced auto-calculation ---
let autoCalcTimer = null

watch(
  [
    () => form.monthlyBill,
    () => form.electricityPrice,
    () => form.electricityBuyPrice,
    () => form.electricitySellPrice,
    () => form.roofType,
    () => form.roofAngle,
    () => form.roofDirection,
    () => form.mountingPlace,
    () => form.subscriberGroup,
    () => form.panelPower,
    () => form.panelArea,
    () => form.coverFullBill,
    () => form.coverFullRoof,
    () => form.drawnAreaM2,
    () => form.lat,
    () => form.lng,
    () => form.annualEscalationRate,
    () => form.systemLoss,
    () => form.annualDegradation,
    () => form.installationCostPerKw,
    () => form.inverterEfficiency,
    () => form.coverageFactor,
  ],
  () => {
    if (!canGoToResults.value) return

    if (autoCalcTimer) clearTimeout(autoCalcTimer)
    autoCalcTimer = setTimeout(async () => {
      await runCalculation()
    }, 1500)
  },
)
</script>
