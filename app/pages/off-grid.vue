<template>
  <main class="page-shell">
    <div class="breadcrumb">
      <NuxtLink to="/">← Kategori Secimi</NuxtLink>
    </div>

    <section class="hero hero-blue">
      <div class="hero-copy">
        <p class="eyebrow">Off-Grid Fizibilite / PVGIS + Batarya</p>
        <h1>Sebeke bagimsiz gunes enerjisi sistemi hesabi</h1>
        <p class="hero-text">
          Cihaz bazli tuketim girin, panel ve batarya ihtiyacini PVGIS verisiyle hesaplayin.
        </p>
        <div class="hero-badges">
          <span>Cihaz bazli tuketim</span>
          <span>PVGIS uretim</span>
          <span>Batarya boyutlandirma</span>
        </div>
      </div>
    </section>

    <div class="content-grid">
      <!-- Sol kolon: form akisi -->
      <div class="flow-column">
        <!-- Konum -->
        <section class="card">
          <div class="section-head">
            <p class="section-step">1. Konum ve Alan</p>
            <h2>Il / ilce arayin, cati alanini poligon ile secin</h2>
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

          <div v-if="location.lat !== null" class="assumption-strip">
            <div class="mini-stat">
              <span>Konum</span>
              <strong>{{ location.cityLabel || location.address }}</strong>
            </div>
            <div class="mini-stat">
              <span>Koordinat</span>
              <strong>{{ location.lat?.toFixed(4) }}, {{ location.lng?.toFixed(4) }}</strong>
            </div>
            <div class="mini-stat">
              <span>Secilen alan</span>
              <strong>{{ number(location.drawnAreaM2, 1) }} m2</strong>
            </div>
          </div>
        </section>

        <!-- Panel Secimi -->
        <section class="card">
          <div class="section-head">
            <p class="section-step">2. Panel Secimi</p>
            <h2>Gunes paneli tipini secin</h2>
          </div>

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
        </section>

        <!-- Cati Ayarlari -->
        <section class="card">
          <div class="section-head">
            <p class="section-step">3. Cati Ayarlari</p>
            <h2>Cati acisi, cephesi ve tipini secin</h2>
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
          </div>
        </section>

        <!-- Cihaz Listesi -->
        <section class="card">
          <div class="section-head">
            <p class="section-step">4. Cihaz Tuketimi</p>
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

            <div
                v-for="appliance in form.appliances"
                :key="appliance.id"
                class="appliance-row"
            >
              <select v-model="appliance.type">
                <option
                    v-for="opt in applianceOptions"
                    :key="opt.value"
                    :value="opt.value"
                >
                  {{ opt.label }}
                </option>
              </select>

              <input
                  v-model.number="appliance.dayHours"
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  placeholder="0"
              />

              <input
                  v-model.number="appliance.nightHours"
                  type="number"
                  min="0"
                  max="24"
                  step="0.5"
                  placeholder="0"
              />

              <span class="appliance-watt">{{ getApplianceWattage(appliance.type) }}W</span>

              <button
                  type="button"
                  class="remove-btn"
                  @click="removeAppliance(appliance.id)"
              >
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
      </div>

      <!-- Sag kolon: sticky sidebar -->
      <aside class="results-column">
        <section class="card sticky-card">
          <div class="section-head">
            <p class="section-step">Tahmini Sonuclar</p>
            <h2>Off-Grid Sistem Ozeti</h2>
          </div>

          <div v-if="isCalculating" class="loading-state">
            PVGIS verisi aliniyor...
          </div>

          <div v-else-if="calculationError" class="error-state">
            {{ calculationError }}
          </div>

          <template v-else-if="result">
            <div class="result-grid one-col">
              <div class="result-tile">
                <span>Sehir</span>
                <strong>{{ result.cityLabel || '-' }}</strong>
              </div>
              <div class="result-tile">
                <span>Sistem Gucu</span>
                <strong>{{ number(result.systemSizeKw, 2) }} kWp</strong>
              </div>
              <div class="result-tile">
                <span>Yillik Uretim</span>
                <strong>{{ number(result.yearlyProduction) }} kWh</strong>
              </div>
              <div class="result-tile">
                <span>Panel Sayisi</span>
                <strong>{{ number(result.panelCount) }}</strong>
              </div>
              <div class="result-tile">
                <span>Anlik Tuketim</span>
                <strong>{{ number(result.instantaneousConsumptionKw, 2) }} kW</strong>
              </div>
              <div class="result-tile">
                <span>Gunluk Tuketim</span>
                <strong>{{ number(result.dailyConsumptionKwh, 2) }} kWh</strong>
              </div>
              <div class="result-tile">
                <span>Gunezsiz Tuketim</span>
                <strong>{{ number(result.nighttimeConsumptionKwh, 2) }} kWh</strong>
              </div>
              <div class="result-tile">
                <span>Batarya Kapasitesi</span>
                <strong>{{ number(result.batterySizeKwh, 1) }} kWh</strong>
                <small>3 gun otonom</small>
              </div>
              <div class="result-tile">
                <span>Tahmini Maliyet</span>
                <strong>{{ currency(result.installationCost) }}</strong>
                <small>Panel + Inverter + Batarya</small>
              </div>
              <div class="result-tile">
                <span>Verim</span>
                <strong>%{{ number(result.efficiency, 1) }}</strong>
              </div>
              <div class="result-tile">
                <span>Panel Alani</span>
                <strong>{{ number(result.areaM2, 1) }} m2</strong>
              </div>
            </div>
          </template>

          <div v-else class="validation-hint">
            Konum secin, cihaz ekleyin — sonuclar otomatik hesaplanacak.
          </div>
        </section>
      </aside>
    </div>
  </main>
</template>

<script setup>
import {
  applianceOptions,
  defaultOffGridForm,
  panelOptions,
  roofDirections,
  roofOptions,
} from '~/data/off-grid'

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
const result = ref(null)
const isCalculating = ref(false)
const calculationError = ref('')

const selectPanel = (panelValue) => {
  form.selectedPanel = panelValue
  const panel = panelOptions.find((p) => p.value === panelValue)
  if (panel) {
    form.panelPower = panel.power
    form.panelArea = panel.area
  }
}

const roofMeta = computed(() => roofOptions.find((item) => item.value === form.roofType) ?? roofOptions[0])

const getApplianceWattage = (type) => {
  return applianceOptions.find((a) => a.value === type)?.avgWattage ?? 0
}

const instantaneousConsumptionKw = computed(() => {
  let totalWatts = 0
  for (const a of form.appliances) {
    const watt = getApplianceWattage(a.type)
    if (a.dayHours > 0 || a.nightHours > 0) totalWatts += watt
  }
  return totalWatts / 1000
})

const dailyConsumptionKwh = computed(() => {
  let total = 0
  for (const a of form.appliances) {
    const watt = getApplianceWattage(a.type)
    total += (watt * (a.dayHours + a.nightHours)) / 1000
  }
  return total
})

const nighttimeConsumptionKwh = computed(() => {
  let total = 0
  for (const a of form.appliances) {
    const watt = getApplianceWattage(a.type)
    total += (watt * a.nightHours) / 1000
  }
  return total
})

const daytimeConsumptionKwh = computed(() => {
  let total = 0
  for (const a of form.appliances) {
    const watt = getApplianceWattage(a.type)
    total += (watt * a.dayHours) / 1000
  }
  return total
})

const addAppliance = () => {
  form.appliances.push({
    id: crypto.randomUUID(),
    type: 'led-bulb',
    dayHours: 0,
    nightHours: 0,
  })
}

const removeAppliance = (id) => {
  const index = form.appliances.findIndex((a) => a.id === id)
  if (index !== -1) form.appliances.splice(index, 1)
}

const number = (value, digits = 0) =>
  new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)

const currency = (value) =>
  new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    maximumFractionDigits: 0,
  }).format(value)

const runCalculation = async () => {
  if (!hasValidLocation.value || dailyConsumptionKwh.value <= 0) return

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
        dailyConsumptionKwh: dailyConsumptionKwh.value,
        nighttimeConsumptionKwh: nighttimeConsumptionKwh.value,
        instantaneousConsumptionKw: instantaneousConsumptionKw.value,
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
    dailyConsumptionKwh,
    nighttimeConsumptionKwh,
    () => location.value.lat,
    () => location.value.drawnAreaM2,
  ],
  () => {
    if (!hasValidLocation.value || dailyConsumptionKwh.value <= 0) return
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => runCalculation(), 800)
  },
)

const handleLocationChange = (payload) => {
  setLocation(payload)
}

const handleAreaChange = (areaM2) => {
  setArea(areaM2)
}
</script>
