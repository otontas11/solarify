<template>
  <main class="page-shell">
    <div class="breadcrumb">
      <NuxtLink to="/">← Kategori Secimi</NuxtLink>
    </div>

    <div class="content-grid">
      <OffGridForm ref="formRef"
                   :form="form"
                   :location="location"
                   @area-change="handleAreaChange"
                   @location-change="handleLocationChange"
      />

      <OffGridResults :calculation-error="calculationError"
                      :is-calculating="isCalculating"
                      :result="result"
      />
    </div>
  </main>
</template>

<script setup>
import { defaultOffGridForm } from '~/data/off-grid'
import OffGridForm from '../../components/pages/off-grid/OffGridForm.vue'
import OffGridResults from '../../components/pages/off-grid/OffGridResults.vue'

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
const result = ref(null)
const isCalculating = ref(false)
const calculationError = ref('')

const handleLocationChange = (payload) => {
  setLocation(payload)
}

const handleAreaChange = (areaM2) => {
  setArea(areaM2)
}

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

// Debounced auto-calculate
let debounceTimer = null
watch(
    [
      () => form.roofType,
      () => form.roofAngle,
      () => form.roofDirection,
      () => form.panelPower,
      () => form.panelArea,
      () => form.appliances,
      () => location.value.lat,
      () => location.value.drawnAreaM2,
    ],
    () => {
      if (!hasValidLocation.value) return
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => runCalculation(), 800)
    },
    { deep: true },
)
</script>
