<template>
  <section class="card location-card-full">
    <div class="section-head">
      <p class="section-step">1. Konum ve Alan</p>
      <h2>Il / ilce arayin, sonra cati veya arazi alanini poligon ile secin</h2>
    </div>

    <ClientOnly>
      <SolarMapSelector :address="location.address"
                        :area-m2="location.drawnAreaM2"
                        :city-label="location.cityLabel"
                        :lat="location.lat"
                        :lng="location.lng"
                        :panel-count="panelCount"
                        :panel-label="panelLabel"
                        @area-change="$emit('area-change', $event)"
                        @location-change="$emit('location-change', $event)"
      />
    </ClientOnly>

    <p v-if="!canProceed" class="validation-hint">
      Devam etmek icin adres secin ve haritada alan cizin.
    </p>

    <div class="wizard-actions">
      <button :disabled="!canProceed"
              class="primary-btn"
              type="button"
              @click="$emit('next')">
        Devam Et
      </button>
    </div>
  </section>
</template>

<script setup>
const props = defineProps({
  location: { type: Object, required: true },
  canProceed: { type: Boolean, default: false },
  panelArea: { type: Number, default: 2.58 },
  panelLabel: { type: String, default: '' },
  coverageFactor: { type: Number, default: 0.84 },
})

defineEmits(['location-change', 'area-change', 'next'])

const panelCount = computed(() => {
  const usable = props.location.drawnAreaM2 * props.coverageFactor
  return props.panelArea > 0 ? Math.floor(usable / props.panelArea) : 0
})
</script>
