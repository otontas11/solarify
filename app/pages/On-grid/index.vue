<template>
  <main class="page-shell">
    <div class="breadcrumb">
      <NuxtLink to="/">← Kategori Secimi</NuxtLink>
    </div>

    <section class="wizard-shell">
      <div class="stepper stepper-2">
        <button v-for="(step, index) in steps"
                :key="step.key"
                :class="{active: currentStep === step.key,complete: index < activeStepIndex}"
                class="step-chip"
                type="button"
                @click="jumpToStep(step.key)">
          <strong>0{{ index + 1 }}</strong>
          <span>{{ step.title }}</span>
          <small>{{ step.summary }}</small>
        </button>
      </div>

      <!-- Konum Gunes Potansiyeli -->
      <SolarPotential :city-label="location.cityLabel"
                      :is-loading="isLoadingSummary"
                      :summary="locationSummary"
      />

      <!-- STEP 1: Konum & Alan -->
      <StepLocation v-if="currentStep === 'location'"
                    :can-proceed="canProceedFromLocation"
                    :coverage-factor="form.coverageFactor"
                    :location="location"
                    :panel-area="form.panelArea"
                    :panel-label="currentPanelLabel"
                    @next="nextStep"
                    @location-change="handleLocationChange"
                    @area-change="handleAreaChange"
      />

      <!-- STEP 2: Bilgiler & Sonuc -->
      <template v-if="currentStep === 'details'">
        <!-- Anlik Tahmin -->
        <LiveEstimate :city-label="location.cityLabel"
                      :estimate="liveEstimate"
                      :has-pvgis="!!result"
                      :is-calculating="isCalculating"
        />

        <StepDetails
                   :calculation-error="calculationError"
                   :form="form"
                   :is-calculating="isCalculating"
                   :result="result"
                   @previous="previousStep"
        />
      </template>
    </section>
  </main>
</template>

<script setup>
import { defaultOnGridForm, panelOptions, roofOptions } from '~/data/on-grid'
import StepLocation from '../../components/pages/on-grid/StepLocation.vue'
import StepDetails from '../../components/pages/on-grid/StepDetails.vue'
import LiveEstimate from '../../components/pages/on-grid/LiveEstimate.vue'
import SolarPotential from '../../components/pages/on-grid/SolarPotential.vue'

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
const currentPanelLabel = computed(() => {
  const panel = panelOptions.find((p) => p.value === form.selectedPanel)
  return panel ? `${panel.label} ${panel.power}Wp` : ''
})
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
    console.log("locationSummary.value", locationSummary.value)
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
  console.log("handleLocationChange",payload)
  setLocation(payload)
  fetchLocationSummary(payload.lat, payload.lng)
}

const handleAreaChange = (areaM2) => {
  console.log("handleAreaChange",areaM2)
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
  console.log("runCalculation")
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
