<script setup lang="ts">
import {
  defaultOnGridForm,
  panelOptions,
  roofDirections,
  roofOptions,
  subscriberGroups,
  systemCategories,
  wizardSteps,
} from '~/data/on-grid'
import type { CalculationMode, OnGridResult, RoofDirection, SubscriberGroup, SystemCategoryKey, WizardStep } from '~/types/on-grid'

useHead({
  title: 'Solarify | Google Places + PVGIS On-Grid Simulasyonu',
  meta: [
    {
      name: 'description',
      content:
        'Google Places ile konum secimi, harita uzerinde polygon cizimi ve PVGIS tabanli on-grid fizibilite hesabi.',
    },
  ],
})

const form = reactive(defaultOnGridForm())
const selectedCategory = ref<SystemCategoryKey | null>(null)
const currentStep = ref<WizardStep>('category')
const result = ref<OnGridResult | null>(null)
const isCalculating = ref(false)
const calculationError = ref('')
const showAdvanced = ref(false)

const selectPanel = (panelValue: string) => {
  form.selectedPanel = panelValue
  const panel = panelOptions.find((p) => p.value === panelValue)
  if (panel) {
    form.panelPower = panel.power
    form.panelArea = panel.area
  }
}

const activeStepIndex = computed(() => wizardSteps.findIndex((step) => step.key === currentStep.value))
const roofMeta = computed(() => roofOptions.find((item) => item.value === form.roofType) ?? roofOptions[0]!)
const monthlyConsumptionDerived = computed(() =>
  form.monthlyConsumption && form.monthlyConsumption > 0
    ? form.monthlyConsumption
    : form.monthlyBill / Math.max(form.electricityPrice, 0.01),
)

const canProceedFromLocation = computed(
  () => !!form.address && form.lat !== null && form.lng !== null && form.drawnAreaM2 > 0,
)

const canGoToResults = computed(
  () => canProceedFromLocation.value && form.monthlyBill > 0 && form.electricityPrice > 0,
)

const maxMonthlyProduction = computed(() =>
  Math.max(...(result.value?.monthlySeries.map((entry) => entry.production) ?? [1]), 1),
)
const maxMonthlyConsumption = computed(() =>
  Math.max(...(result.value?.monthlySeries.map((entry) => entry.consumption) ?? [1]), 1),
)
const maxCashflowMagnitude = computed(() =>
  Math.max(...(result.value?.cumulativeCashflow.map((entry) => Math.abs(entry)) ?? [1]), 1),
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

const runCalculation = async () => {
  if (!canGoToResults.value || form.lat === null || form.lng === null) {
    return false
  }

  isCalculating.value = true
  calculationError.value = ''

  try {
    const queryParams: Record<string, string | number> = {
      address: form.address,
      cityLabel: form.cityLabel,
      lat: form.lat!,
      lng: form.lng!,
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
    }

    if (form.calculationMode === 'advanced') {
      queryParams.electricityBuyPrice = form.electricityBuyPrice
      queryParams.electricitySellPrice = form.electricitySellPrice
    }

    result.value = await $fetch<OnGridResult>('/api/solar/calculate', {
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

const nextStep = async () => {
  const index = activeStepIndex.value
  const next = wizardSteps[index + 1]
  if (!next) return

  if (currentStep.value === 'category' && !selectedCategory.value) return
  if (currentStep.value === 'location' && !canProceedFromLocation.value) return

  if (next.key === 'results') {
    const ok = await runCalculation()
    if (!ok) return
  }

  currentStep.value = next.key
}

const previousStep = () => {
  const index = activeStepIndex.value
  const prev = wizardSteps[index - 1]
  if (prev) {
    currentStep.value = prev.key
  }
}

const jumpToStep = async (step: WizardStep) => {
  if (step !== 'category' && !selectedCategory.value) return
  if (step === 'results') {
    const ok = await runCalculation()
    if (!ok) return
  }

  currentStep.value = step
}

const updateLocation = (payload: { lat: number; lng: number; address: string; cityLabel: string }) => {
  form.lat = payload.lat
  form.lng = payload.lng
  form.address = payload.address
  form.cityLabel = payload.cityLabel
}

const updateArea = (areaM2: number) => {
  form.drawnAreaM2 = areaM2
}

const selectCategory = (key: SystemCategoryKey) => {
  const cat = systemCategories.find((c) => c.key === key)
  if (!cat?.available) return
  selectedCategory.value = key
}

const selectedCategoryMeta = computed(() =>
  systemCategories.find((c) => c.key === selectedCategory.value),
)
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
        <p class="card-kicker">Canli Ozet</p>
        <div class="metric-row">
          <span>Sistem tipi</span>
          <strong>{{ selectedCategoryMeta?.label || 'Secilmedi' }}</strong>
        </div>
        <div class="metric-row">
          <span>Secilen konum</span>
          <strong>{{ form.cityLabel || 'Konum secilmedi' }}</strong>
        </div>
        <div class="metric-row">
          <span>Cizilen alan</span>
          <strong>{{ number(form.drawnAreaM2) }} m2</strong>
        </div>
        <div class="metric-row">
          <span>Turetilen tuketim</span>
          <strong>{{ number(monthlyConsumptionDerived) }} kWh/ay</strong>
        </div>
        <div class="metric-row">
          <span>Son hesap</span>
          <strong>{{ result ? number(result.paybackYears, 1) + ' yil' : 'Hesap bekleniyor' }}</strong>
        </div>
      </aside>
    </section>

    <section class="wizard-shell">
      <div class="stepper">
        <button
          v-for="(step, index) in wizardSteps"
          :key="step.key"
          class="step-chip"
          :class="{
            active: currentStep === step.key,
            complete: index < activeStepIndex,
            disabled:
              (step.key === 'results' && !canGoToResults) ||
              (step.key !== 'category' && !selectedCategory),
          }"
          type="button"
          @click="jumpToStep(step.key)"
        >
          <strong>0{{ index + 1 }}</strong>
          <span>{{ step.title }}</span>
          <small>{{ step.summary }}</small>
        </button>
      </div>

      <div class="content-grid">
        <div class="flow-column">
          <!-- STEP 0: Kategori Secimi -->
          <section v-if="currentStep === 'category'" class="card">
            <div class="section-head">
              <p class="section-step">1. Kategori</p>
              <h2>Gunes enerjisi sistem tipini secin</h2>
            </div>

            <div class="category-grid">
              <button
                v-for="cat in systemCategories"
                :key="cat.key"
                class="system-card"
                :class="{
                  active: selectedCategory === cat.key,
                  disabled: !cat.available,
                }"
                type="button"
                @click="selectCategory(cat.key)"
              >
                <span class="category-icon">{{ cat.icon }}</span>
                <strong>{{ cat.label }}</strong>
                <span>{{ cat.description }}</span>
                <span v-if="!cat.available" class="system-badge">Yakinda</span>
              </button>
            </div>

            <p v-if="!selectedCategory" class="validation-hint">
              Devam etmek icin bir sistem tipi secin.
            </p>
          </section>

          <!-- STEP 2: Konum & Alan -->
          <section v-if="currentStep === 'location'" class="card">
            <div class="section-head">
              <p class="section-step">2. Konum ve Alan</p>
              <h2>Il / ilce arayin, sonra cati veya arazi alanini poligon ile secin</h2>
            </div>

            <ClientOnly>
              <SolarMapSelector
                :address="form.address"
                :area-m2="form.drawnAreaM2"
                :city-label="form.cityLabel"
                :lat="form.lat"
                :lng="form.lng"
                @area-change="updateArea"
                @location-change="updateLocation"
              />
            </ClientOnly>

            <div v-if="form.lat !== null" class="assumption-strip">
              <div class="mini-stat">
                <span>Konum</span>
                <strong>{{ form.cityLabel || form.address }}</strong>
              </div>
              <div class="mini-stat">
                <span>Koordinat</span>
                <strong>{{ form.lat?.toFixed(4) }}, {{ form.lng?.toFixed(4) }}</strong>
              </div>
              <div class="mini-stat">
                <span>Secilen alan</span>
                <strong>{{ number(form.drawnAreaM2, 1) }} m2</strong>
              </div>
            </div>

            <p v-if="!canProceedFromLocation" class="validation-hint">
              Devam etmek icin adres secin ve haritada alan cizin.
            </p>
          </section>

          <!-- STEP 2: Bilgiler -->
          <section v-if="currentStep === 'details'" class="card">
            <div class="section-head">
              <p class="section-step">3. Bilgi Girisi</p>
              <h2>Hesaplama modunu secin ve bilgilerinizi girin</h2>
            </div>

            <!-- A) Mod Secimi -->
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

            <!-- B) Abone Grubu -->
            <div class="field-group">
              <p class="field-group-title">Abone Grubu</p>
              <div class="subscriber-grid">
                <button
                  v-for="group in subscriberGroups"
                  :key="group.value"
                  type="button"
                  :class="{ active: form.subscriberGroup === group.value }"
                  @click="form.subscriberGroup = group.value as SubscriberGroup"
                >
                  <span class="subscriber-icon">{{ group.icon }}</span>
                  <strong>{{ group.label }}</strong>
                </button>
              </div>
            </div>

            <!-- C) Cati Cephesi -->
            <div class="field-group">
              <p class="field-group-title">Cati Cephesi</p>
              <div class="direction-grid">
                <button
                  v-for="dir in roofDirections"
                  :key="dir.value"
                  type="button"
                  :class="{ active: form.roofDirection === dir.value }"
                  @click="form.roofDirection = dir.value as RoofDirection"
                >
                  {{ dir.label }}
                </button>
              </div>
            </div>

            <!-- D) Cati Tipi -->
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
            </div>

            <!-- E) Aylik Elektrik Faturasi — Range Slider -->
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

            <!-- F) Cati Acisi — Range Slider -->
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

            <!-- G) Checkboxlar -->
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

            <!-- H) Gelismis Mod Ek Alanlar -->
            <template v-if="form.calculationMode === 'advanced'">
              <!-- Panel Secimi -->
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

              <!-- Fiyat ve Tuketim Inputlari -->
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
                  <span>Dagitim Bedeli (Opsiyonel)</span>
                  <input
                    v-model.number="form.distributionFee"
                    min="0"
                    placeholder="0.76"
                    step="0.01"
                    type="number"
                  />
                </label>

                <label>
                  <span>Yillik Elektrik Tuketimi (kWh)</span>
                  <input
                    v-model.number="form.yearlyConsumption"
                    min="0"
                    placeholder="Bos birakilirsa faturadan hesaplanir"
                    step="100"
                    type="number"
                  />
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

              <!-- Teknik Ayarlar -->
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
                <strong>x{{ number(roofMeta.coverageFactor, 2) }}</strong>
              </div>
              <div class="mini-stat">
                <span>Turetilen tuketim</span>
                <strong>{{ number(monthlyConsumptionDerived) }} kWh/ay</strong>
              </div>
            </div>
          </section>

          <!-- STEP 3: Sonuc -->
          <section v-if="currentStep === 'results'" class="card">
            <div class="section-head">
              <p class="section-step">4. Sonuc Dashboard</p>
              <h2>Google Places + PVGIS tabanli on-grid fizibilite</h2>
            </div>

            <div v-if="isCalculating" class="loading-state">
              PVGIS verisi aliniyor ve hesaplama yapiliyor...
            </div>

            <div v-else-if="calculationError" class="error-state">
              {{ calculationError }}
            </div>

            <template v-else-if="result">
              <div class="result-grid">
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
                  <small>Aylik ortalama {{ number(result.monthlyAverageProduction) }} kWh</small>
                </div>
                <div class="result-tile">
                  <span>Yillik tasarruf</span>
                  <strong>{{ currency(result.yearlySavings) }}</strong>
                  <small>Basit model: min(uretim, tuketim) x birim fiyat</small>
                </div>
                <div class="result-tile">
                  <span>Kurulum maliyeti</span>
                  <strong>{{ currency(result.installationCost) }}</strong>
                  <small>Kurulum maliyeti ve cati tipi katsayisi ile</small>
                </div>
                <div class="result-tile">
                  <span>Geri donus suresi</span>
                  <strong>{{ number(result.paybackYears, 1) }} yil</strong>
                  <small>10 yillik nakit akis simulasyonu da asagida</small>
                </div>
                <div class="result-tile">
                  <span>Tuketim karsilama</span>
                  <strong>%{{ number(result.selfSufficiencyRate, 1) }}</strong>
                  <small>Adres: {{ result.address }}</small>
                </div>
              </div>

              <div class="chart-stack">
                <div class="chart-card">
                  <div class="chart-head">
                    <strong>Aylik uretim vs tuketim</strong>
                    <span>PVGIS aylik dagilim</span>
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

                <div class="chart-card">
                  <div class="chart-head">
                    <strong>10 yillik geri donus egirisi</strong>
                    <span>Degradasyon: %{{ number(form.annualDegradation, 1) }}</span>
                  </div>

                  <div class="cashflow-list">
                    <div
                      v-for="(value, index) in result.cumulativeCashflow"
                      :key="index"
                      class="cashflow-row"
                    >
                      <span>Yil {{ index + 1 }}</span>
                      <div class="cashflow-bar">
                        <div
                          class="cashflow-fill"
                          :class="{ positive: value >= 0 }"
                          :style="{ width: `${Math.min((Math.abs(value) / maxCashflowMagnitude) * 100, 100)}%` }"
                        />
                      </div>
                      <strong>{{ currency(value) }}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div class="note-box">
                <strong>Hukuki not</strong>
                <p>
                  Bu hesaplama on fizibilite amaclidir. Nihai degerler saha kesfi, urun secimi ve
                  teknik analiz sonrasinda netlesir.
                </p>
              </div>
            </template>
          </section>

          <div class="wizard-actions">
            <button
              class="secondary-btn"
              :disabled="activeStepIndex === 0 || isCalculating"
              type="button"
              @click="previousStep"
            >
              Geri
            </button>

            <button
              v-if="currentStep !== 'results'"
              class="primary-btn"
              :disabled="
                (currentStep === 'location' && !canProceedFromLocation) ||
                (currentStep === 'details' && !canGoToResults) ||
                isCalculating
              "
              type="button"
              @click="nextStep"
            >
              {{ currentStep === 'details' ? 'PVGIS ile Hesapla' : 'Devam Et' }}
            </button>
          </div>
        </div>

        <aside class="results-column">
          <section class="card sticky-card">
            <div class="section-head">
              <p class="section-step">Mimari</p>
              <h2>Canli entegrasyon omurgasi</h2>
            </div>

            <div class="result-grid one-col">
              <div class="result-tile">
                <span>Konum secimi</span>
                <strong>Google Places</strong>
                <small>Il / ilce / adres arama icin resmi Places widget kullaniliyor</small>
              </div>
              <div class="result-tile">
                <span>Harita alan secimi</span>
                <strong>Google Maps Polygon</strong>
                <small>Secilen alan m2 olarak hesaba giriyor</small>
              </div>
              <div class="result-tile">
                <span>Uretim kaynagi</span>
                <strong>PVGIS Proxy</strong>
                <small>Nuxt server endpoint ile PVGIS verisi cekiliyor</small>
              </div>
              <div class="result-tile">
                <span>Sonraki adim</span>
                <strong>Google Solar API / katalog</strong>
                <small>Cati analizi ve ekipman secimi icin uygun altyapi hazir</small>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </section>
  </main>
</template>
