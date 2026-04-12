<template>
  <main class="page-shell">
    <div class="breadcrumb">
      <NuxtLink to="/">← Kategori Secimi</NuxtLink>
    </div>

    <section class="wizard-shell">
      <div class="stepper stepper-2">
        <button v-for="(step, index) in steps"
                :key="step.key"
                :class="{active: currentStep === step.key, complete: index < activeStepIndex}"
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
      <OffGridForm v-if="currentStep === 'details'"
                   ref="formRef"
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
import { defaultOffGridForm, panelOptions, roofOptions } from '~/data/off-grid'
import StepLocation from '../../components/pages/on-grid/StepLocation.vue'
import SolarPotential from '../../components/pages/on-grid/SolarPotential.vue'
import OffGridForm from '../../components/pages/off-grid/OffGridForm.vue'

useHead({
  title: 'Solarify | Off-Grid Fizibilite',
  meta: [
    {
      name: 'description',
      content: 'Bataryali sebeke bagimsiz gunes enerjisi sistemi hesabi — cihaz bazli tuketim ve PVGIS tabanli uretim.',
    },
  ],
})

const { location, setLocation, setArea, hasValidLocation } = useLocationState()

const form = reactive(defaultOffGridForm())
const formRef = ref(null)
const currentStep = ref('location')
const result = ref(null)
const isCalculating = ref(false)
const calculationError = ref('')
const locationSummary = ref(null)
const isLoadingSummary = ref(false)

const steps = [
  { key: 'location', title: 'Konum & Alan', summary: 'Adres ara, cati alanini ciz' },
  { key: 'details', title: 'Bilgiler & Sonuc', summary: 'Cihaz ve cati bilgisi gir' },
]

const activeStepIndex = computed(() => steps.findIndex((step) => step.key === currentStep.value))
const canProceedFromLocation = computed(() => hasValidLocation.value)

const currentPanelLabel = computed(() => {
  const panel = panelOptions.find((p) => p.value === form.selectedPanel)
  return panel ? `${panel.label} ${panel.power}Wp` : ''
})

// Cati tipi degisince coverage factor guncelle
watch(
    () => form.roofType,
    (type) => {
      const roof = roofOptions.find((r) => r.value === type)
      if (roof) form.coverageFactor = roof.coverageFactor
    },
)

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
const fetchLocationSummary = async (lat, lng) => {
  const useLat = lat ?? location.value.lat
  const useLng = lng ?? location.value.lng
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

watch(
    [() => form.roofDirection, () => form.roofAngle],
    () => {
      if (location.value.lat && location.value.lng) debouncedFetchSummary()
    },
)

// --- Debounced auto-calculation ---
let autoCalcTimer = null

const runCalculation = async () => {
  const exposed = formRef.value
  if (!exposed || !hasValidLocation.value || exposed.dailyConsumptionKwh <= 0) return

  isCalculating.value = true
  calculationError.value = ''

  try {
    result.value = await $fetch('/api/solar/calculate-off-grid', {
      query: {
        lat: location.value.lat,
        lng: location.value.lng,
        cityLabel: location.value.cityLabel,
        drawnAreaM2: location.value.drawnAreaM2,
        roofType: form.roofType,
        roofAngle: form.roofAngle,
        roofDirection: form.roofDirection,
        panelPower: form.panelPower,
        panelArea: form.panelArea,
        coverageFactor: form.coverageFactor,
        dailyConsumptionKwh: exposed.dailyConsumptionKwh,
        nighttimeConsumptionKwh: exposed.nighttimeConsumptionKwh,
        instantaneousConsumptionKw: exposed.instantaneousConsumptionKw,
      },
    })
  } catch (error) {
    calculationError.value =
        error instanceof Error ? error.message : 'Hesaplama yapilirken bir sorun olustu.'
  } finally {
    isCalculating.value = false
  }
}

watch(
    [
      () => form.roofType,
      () => form.roofAngle,
      () => form.roofDirection,
      () => form.panelPower,
      () => form.panelArea,
      () => form.coverageFactor,
      () => form.appliances,
      () => location.value.lat,
      () => location.value.drawnAreaM2,
    ],
    () => {
      if (!hasValidLocation.value) return
      if (autoCalcTimer) clearTimeout(autoCalcTimer)
      autoCalcTimer = setTimeout(() => runCalculation(), 800)
    },
    { deep: true },
)
</script>
