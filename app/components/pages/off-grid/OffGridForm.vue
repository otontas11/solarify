<template>
  <div class="content-grid">
    <div class="flow-column">
      <!-- Panel Secimi -->
      <section class="card">
        <div class="section-head">
          <p class="section-step">2. Sistem Bilgileri</p>
          <h2>Panel, cati ve cihaz bilgilerini girin</h2>
        </div>

        <div class="field-group">
          <p class="field-group-title">Gunes Paneli</p>
          <UiButtonGroup v-model="form.selectedPanel"
                         :options="panelOptionsFormatted"
                         group-class="panel-grid"
                         @update:model-value="selectPanel"
          />
        </div>

        <div class="field-group">
          <UiFormInput v-model="form.roofAngle" :max="45" :min="0" :step="1" label="Cati Acisi" suffix="°" type="range" />
        </div>

        <div class="field-group">
          <p class="field-group-title">Cati Cephesi</p>
          <UiButtonGroup v-model="form.roofDirection" :options="roofDirections" group-class="direction-grid" />
        </div>

        <div class="field-group">
          <p class="field-group-title">Cati Tipi</p>
          <UiButtonGroup v-model="form.roofType" :options="roofOptionsFormatted" group-class="roof-type-grid" />
        </div>
      </section>

      <!-- Cihaz Listesi -->
      <section class="card">
        <div class="section-head">
          <p class="section-step">3. Cihaz Tuketimi</p>
          <h2>Kullanacaginiz cihazlari ve calisma surelerini girin</h2>
        </div>

        <div class="appliance-list">
          <div class="appliance-header">
            <span>Cihaz</span>
            <span>Gunduz (saat)</span>
            <span>Gece (saat)</span>
            <span>Watt</span>
            <span></span>
          </div>

          <div v-for="appliance in form.appliances" :key="appliance.id" class="appliance-row">
            <select v-model="appliance.type">
              <option v-for="opt in applianceOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>

            <input v-model.number="appliance.dayHours" type="number" min="0" max="24" step="0.5" placeholder="0" />
            <input v-model.number="appliance.nightHours" type="number" min="0" max="24" step="0.5" placeholder="0" />

            <span class="appliance-watt">{{ getApplianceWattage(appliance.type) }}W</span>

            <button type="button" class="remove-btn" @click="removeAppliance(appliance.id)">
              Sil
            </button>
          </div>
        </div>

        <button type="button" class="add-appliance-btn" @click="addAppliance">
          + Cihaz Ekle
        </button>

        <!-- Tuketim Ozeti -->
        <div class="consumption-summary">
          <div class="mini-stat">
            <span>Gunluk Tuketim</span>
            <strong>{{ number(dailyConsumptionKwh, 2) }} kWh</strong>
          </div>
          <div class="mini-stat">
            <span>Gunduz Tuketim</span>
            <strong>{{ number(daytimeConsumptionKwh, 2) }} kWh</strong>
          </div>
          <div class="mini-stat">
            <span>Gece Tuketim</span>
            <strong>{{ number(nighttimeConsumptionKwh, 2) }} kWh</strong>
          </div>
        </div>
      </section>

      <div class="wizard-actions">
        <button class="secondary-btn" type="button" @click="$emit('previous')">
          Geri
        </button>
      </div>
    </div>

    <!-- Sag sidebar: Sonuclar -->
    <OffGridResults :calculation-error="calculationError"
                    :is-calculating="isCalculating"
                    :result="result"
    />
  </div>
</template>

<script setup>
import {
  applianceOptions,
  panelOptions,
  roofDirections,
  roofOptions,
} from '~/data/off-grid'
import OffGridResults from './OffGridResults.vue'

const props = defineProps({
  form: { type: Object, required: true },
  result: { type: Object, default: null },
  isCalculating: { type: Boolean, default: false },
  calculationError: { type: String, default: '' },
})

defineEmits(['previous'])

const roofOptionsFormatted = computed(() =>
    roofOptions.map((o) => ({ ...o, description: `Kaplama: %${Math.round(o.coverageFactor * 100)}` })),
)
const panelOptionsFormatted = computed(() =>
    panelOptions.map((p) => ({ ...p, description: `${p.power}Wp / ${p.area} m2` })),
)

const selectPanel = (panelValue) => {
  props.form.selectedPanel = panelValue
  const panel = panelOptions.find((p) => p.value === panelValue)
  if (panel) {
    props.form.panelPower = panel.power
    props.form.panelArea = panel.area
  }
}

const getApplianceWattage = (type) => {
  return applianceOptions.find((a) => a.value === type)?.avgWattage ?? 0
}

const dailyConsumptionKwh = computed(() => {
  let total = 0
  for (const a of props.form.appliances) {
    total += (getApplianceWattage(a.type) * (a.dayHours + a.nightHours)) / 1000
  }
  return total
})

const daytimeConsumptionKwh = computed(() => {
  let total = 0
  for (const a of props.form.appliances) {
    total += (getApplianceWattage(a.type) * a.dayHours) / 1000
  }
  return total
})

const nighttimeConsumptionKwh = computed(() => {
  let total = 0
  for (const a of props.form.appliances) {
    total += (getApplianceWattage(a.type) * a.nightHours) / 1000
  }
  return total
})

const instantaneousConsumptionKw = computed(() => {
  let totalWatts = 0
  for (const a of props.form.appliances) {
    const watt = getApplianceWattage(a.type)
    if (a.dayHours > 0 || a.nightHours > 0) totalWatts += watt
  }
  return totalWatts / 1000
})

const addAppliance = () => {
  props.form.appliances.push({
    id: crypto.randomUUID(),
    type: 'led-bulb',
    dayHours: 0,
    nightHours: 0,
  })
}

const removeAppliance = (id) => {
  const index = props.form.appliances.findIndex((a) => a.id === id)
  if (index !== -1) props.form.appliances.splice(index, 1)
}

const number = (value, digits = 0) =>
    new Intl.NumberFormat('tr-TR', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value)

defineExpose({ dailyConsumptionKwh, nighttimeConsumptionKwh, instantaneousConsumptionKw })
</script>
