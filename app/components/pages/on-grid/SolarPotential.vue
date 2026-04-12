<template>
  <div v-if="isLoading" class="solar-potansiyel-bar solar-potansiyel-loading">
    <strong class="solar-potansiyel-title">{{ cityLabel }}</strong>
    <span>Gunes verileri aliniyor...</span>
  </div>
  <div v-else-if="summary" class="solar-potansiyel-bar">
    <strong class="solar-potansiyel-title">{{ cityLabel }}</strong>
    <div class="solar-potansiyel-items">
      <span>&#9728; {{ summary.dailySunHours }} saat/gun</span>
      <span>&#9889; {{ number(summary.pvYield) }} kWh/kWp</span>
      <span>&#9788; {{ number(summary.irradiation) }} kWh/m2</span>
      <span v-if="summary.optimalAngle !== null">&#9650; {{ number(summary.optimalAngle, 1) }}°</span>
    </div>
    <small>PVGIS</small>
  </div>
</template>

<script setup>
defineProps({
  cityLabel: { type: String, default: '' },
  summary: { type: Object, default: null },
  isLoading: { type: Boolean, default: false },
})

const number = (value, digits = 0) =>
    new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value)
</script>
