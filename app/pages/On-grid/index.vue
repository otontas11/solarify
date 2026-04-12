<template>
  <main class="page-shell">
    <div class="breadcrumb">
      <NuxtLink to="/">← Kategori Secimi</NuxtLink>
    </div>

    <section class="wizard-shell">
      <div class="stepper stepper-2">
        <button
            v-for="(step, index) in steps"
            :key="step.key"
            :class="{
            active: currentStep === step.key,
            complete: index < activeStepIndex,
          }"
            class="step-chip"
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
          <strong v-if="location.cityLabel" class="estimate-location">{{ location.cityLabel }}</strong>
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
            <strong>{{
                liveEstimate.paybackYears === Infinity ? '—' : number(liveEstimate.paybackYears, 1) + ' yil'
              }}</strong>
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
            <span v-if="locationSummary.optimalAngle !== null">&#9650; {{
                number(locationSummary.optimalAngle, 1)
              }}°</span>
          </div>
          <small>PVGIS</small>
        </div>
      </section>

      <!-- STEP 1: Konum & Alan -->
      <StepLocation v-if="currentStep === 'location'"
                    :can-proceed="canProceedFromLocation"
                    :location="location"
                    @next="nextStep"
                    @location-change="handleLocationChange"
                    @area-change="handleAreaChange"
      />

      <!-- STEP 2: Bilgiler & Sonuc -->
      <StepDetails v-if="currentStep === 'details'"
                   :calculation-error="calculationError"
                   :form="form"
                   :is-calculating="isCalculating"
                   :result="result"
                   @previous="previousStep"
      />
    </section>
  </main>
</template>

<script setup>
import { defaultOnGridForm, roofOptions } from '~/data/on-grid'
import StepLocation from './components/StepLocation.vue'
import StepDetails from './components/StepDetails.vue'

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
const locationSummary = ref(null)
const isLoadingSummary = ref(false)

const steps = [
  { key: 'location', title: 'Konum & Alan', summary: 'Adres ara, cati alanini ciz' },
  { key: 'details', title: 'Bilgiler & Sonuc', summary: 'Bilgi gir, PVGIS sonuclarini gor' },
]

const activeStepIndex = computed(() => steps.findIndex((step) => step.key === currentStep.value))
const roofMeta = computed(() => roofOptions.find((item) => item.value === form.roofType) ?? roofOptions[0])
const canProceedFromLocation = computed(() => hasValidLocation.value)

const canGoToResults = computed(
    () => canProceedFromLocation.value && form.monthlyBill > 0 && form.electricityPrice > 0,
)

// Sync shared location into form
watchEffect(() => {
  form.address = location.value.address
  form.cityLabel = location.value.cityLabel
  form.lat = location.value.lat
  form.lng = location.value.lng
  form.drawnAreaM2 = location.value.drawnAreaM2
})

// Cati tipi degisince coverage factor guncelle
watch(
    () => form.roofType,
    (type) => {
      const roof = roofOptions.find((r) => r.value === type)
      if (roof) form.coverageFactor = roof.coverageFactor
    },
)

// --- Formatters ---
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

// --- Live Estimate ---
const monthlyConsumptionDerived = computed(() =>
    form.monthlyConsumption && form.monthlyConsumption > 0
        ? form.monthlyConsumption
        : form.monthlyBill / Math.max(form.electricityPrice, 0.01),
)

const liveEstimate = computed(() => {
  const pvYield = result.value?.pvYield ?? 1400
  const usableArea = form.drawnAreaM2 * (form.coverageFactor ?? roofMeta.value.coverageFactor ?? 0.84)
  const yearlyConsumption = monthlyConsumptionDerived.value * 12
  const recommendedSizeKw = pvYield > 0 ? yearlyConsumption / pvYield : 0
  const maxPanels = form.panelArea > 0 ? Math.floor(usableArea / form.panelArea) : 0

  let panelCount
  if (form.coverFullBill) {
    const billPanels = form.panelPower > 0
        ? Math.ceil((recommendedSizeKw * 1000) / form.panelPower)
        : 0
    panelCount = Math.min(billPanels, maxPanels)
  } else {
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

// --- Step Navigation ---
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
  if (prev) currentStep.value = prev.key
}

const jumpToStep = (step) => {
  currentStep.value = step
}

// --- Location Summary ---
const fetchLocationSummary = async(lat, lng) => {
  const useLat = lat ?? form.lat
  const useLng = lng ?? form.lng
  if (!useLat || !useLng) return
  locationSummary.value = null
  isLoadingSummary.value = true
  try {
    const q = { lat: useLat, lng: useLng }
    if (form.roofDirection) q.roofDirection = form.roofDirection
    if (form.roofAngle !== undefined && form.roofAngle !== null) q.roofAngle = form.roofAngle
    locationSummary.value = await $fetch('/api/solar/location-summary', { query: q })
  } catch (e) {
    console.warn('[LOCATION SUMMARY] Veri alinamadi:', e.message)
    locationSummary.value = null
  } finally {
    isLoadingSummary.value = false
  }
}

let summaryTimer = null
const debouncedFetchSummary = () => {
  if (summaryTimer) clearTimeout(summaryTimer)
  summaryTimer = setTimeout(() => fetchLocationSummary(), 600)
}

const handleLocationChange = (payload) => {
  setLocation(payload)
  fetchLocationSummary(payload.lat, payload.lng)
}

const handleAreaChange = (areaM2) => {
  setArea(areaM2)
}

// Cephe veya aci degisince summary'yi guncelle
watch(
    [() => form.roofDirection, () => form.roofAngle],
    () => {
      if (form.lat && form.lng) debouncedFetchSummary()
    },
)

// --- Debounced auto-calculation ---
let autoCalcTimer = null

const runCalculation = async() => {
  if (!canGoToResults.value || form.lat === null || form.lng === null) return false

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
      electricityBuyPrice: form.electricityBuyPrice,
      electricitySellPrice: form.electricitySellPrice,
      annualEscalationRate: form.annualEscalationRate,
      subscriberGroup: form.subscriberGroup,
    }

    result.value = await $fetch('/api/solar/calculate', { query: queryParams })
    return true
  } catch (error) {
    calculationError.value =
        error instanceof Error ? error.message : 'Hesaplama yapilirken bir sorun olustu.'
    return false
  } finally {
    isCalculating.value = false
  }
}

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
      autoCalcTimer = setTimeout(async() => {
        await runCalculation()
      }, 1500)
    },
)
</script>
