<template>
  <div class="content-grid">
    <div class="flow-column">
      <!-- STEP 2: Bilgiler -->
      <section class="card">
        <div class="section-head">
          <p class="section-step">2. Bilgi Girisi</p>
          <h2>Hesaplama modunu secin ve bilgilerinizi girin</h2>
        </div>

        <!-- Mod Secimi -->
        <UiButtonGroup v-model="form.calculationMode"
                       :options="[{ value: 'simple', label: 'Basit' }, { value: 'advanced', label: 'Gelismis' }]"
                       group-class="mode-toggle"
        />

        <!-- Abone Grubu -->
        <div class="field-group">
          <p class="field-group-title">Abone Grubu</p>
          <UiButtonGroup v-model="form.subscriberGroup" :options="subscriberGroups" group-class="subscriber-grid"/>
        </div>

        <!-- Tarife Bilgisi -->
        <div class="tariff-info">
          <p class="tariff-info-title">Guncel Tarife ({{ currentTariff.label }})</p>
          <div class="tariff-inline">
            <span>Birim fiyat:</span>
            <UiFormInput v-model="form.electricityBuyPrice" :inline="true" :min="0" :step="0.01" suffix="TL/kWh"/>
            <span>Satis fiyati:</span>
            <UiFormInput v-model="form.electricitySellPrice" :inline="true" :min="0" :step="0.01" suffix="TL/kWh"/>
          </div>
        </div>

        <!-- Cati Cephesi -->
        <div class="field-group">
          <p class="field-group-title">Cati Cephesi</p>
          <UiButtonGroup v-model="form.roofDirection" :options="roofDirections" group-class="direction-grid"/>
        </div>

        <!-- Cati Tipi -->
        <div class="field-group">
          <p class="field-group-title">Cati Tipi</p>
          <UiButtonGroup v-model="form.roofType" :options="roofOptionsFormatted" group-class="roof-type-grid"/>
          <div style="margin-top: 0.5rem;">
            <UiFormInput v-model="form.coverageFactor"
                         :format="(v) => `%${number(v * 100, 0)}`"
                         :label="`Cati Kaplama Orani (${form.roofType})`"
                         :max="0.95"
                         :min="0.30"
                         :step="0.01"
                         type="range"
            />
          </div>
        </div>

        <!-- Aylik Elektrik Faturasi -->
        <div class="field-group">
          <UiFormInput v-model="form.monthlyBill" :format="currency" :max="50000" :min="500"
                       :step="100" label="Aylik Elektrik Faturasi" type="range"/>
        </div>

        <!-- Cati Acisi -->
        <div class="field-group">
          <UiFormInput v-model="form.roofAngle" :max="45" :min="0" :step="1" label="Cati Acisi" suffix="°"
                       type="range"/>
        </div>

        <!-- Kurulum Tipi -->
        <div class="field-group">
          <p class="field-group-title">Kurulum Tipi</p>
          <UiButtonGroup v-model="form.mountingPlace" :options="mountingOptions" group-class="mounting-toggle"/>
        </div>

        <!-- Checkboxlar -->
        <div class="field-group">
          <UiFormInput v-model="form.coverFullBill" label="Faturanin tamamini karsilamak istiyorum" type="checkbox"/>
          <UiFormInput v-model="form.coverFullRoof" label="Catimin tamamini kaplamak istiyorum" type="checkbox"/>
        </div>

        <!-- Gelismis Mod -->
        <template v-if="form.calculationMode === 'advanced'">
          <div class="field-group">
            <p class="field-group-title">Gunes Paneli</p>
            <UiButtonGroup v-model="form.selectedPanel" :options="panelOptionsFormatted" group-class="panel-grid"
                           @update:model-value="selectPanel"/>
          </div>

          <div class="field-group">
            <p class="field-group-title">Elektrik</p>
          </div>
          <div class="advanced-fields">
            <UiFormInput v-model="form.annualEscalationRate" :max="50" :min="0" :step="1"
                         label="Yillik Elektrik Zam Orani (%)"/>
            <UiFormInput v-model="form.yearlyConsumption" :min="0" :step="100" label="Yillik Elektrik Tuketimi (kWh)"
                         placeholder="Bos birakilirsa faturadan hesaplanir"/>
            <UiFormInput v-model="form.electricityPrice" :min="0.1" :step="0.1" label="Faturadaki Birim Fiyat (TL/kWh)"/>
          </div>

          <div class="advanced-toggle">
            <button class="text-btn" type="button" @click="showAdvanced = !showAdvanced">
              {{ showAdvanced ? 'Teknik ayarlari gizle' : 'Teknik ayarlar' }}
            </button>
          </div>

          <div v-if="showAdvanced" class="form-grid advanced-grid">
            <UiFormInput v-model="form.panelArea" :min="2" :step="0.1" label="Panel alani (m2)"/>
            <UiFormInput v-model="form.inverterEfficiency" :max="100" :min="90" :step="1" label="Inverter verimi (%)"/>
            <UiFormInput v-model="form.systemLoss" :max="30" :min="0" :step="1" label="Sistem kaybi (%)"/>
            <UiFormInput v-model="form.annualDegradation" :max="3" :min="0" :step="0.1" label="Yillik degradasyon (%)"/>
            <UiFormInput v-model="form.installationCostPerKw" :min="10000" :step="500"
                         label="Kurulum maliyeti (TL/kWp)"/>
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
        <button class="secondary-btn" type="button" @click="$emit('previous')">
          Geri
        </button>
      </div>
    </div>

    <!-- Sag sidebar: PVGIS sonuclari -->
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
                      :style="{ height: `${(item.production / maxMonthlyProduction) * 100}%` }"
                      class="bar production"
                  />
                </div>
                <div class="bar-track muted">
                  <div
                      :style="{ height: `${(item.consumption / maxMonthlyConsumption) * 100}%` }"
                      class="bar consumption"
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
</template>

<script setup>
import {
  mountingOptions,
  panelOptions,
  roofDirections,
  roofOptions,
  subscriberGroups,
} from '~/data/on-grid'
import { tariffs } from '~/data/tariffs'

const props = defineProps({
  form: { type: Object, required: true },
  result: { type: Object, default: null },
  isCalculating: { type: Boolean, default: false },
  calculationError: { type: String, default: '' },
})

defineEmits(['previous'])

const showAdvanced = ref(true)

const currentTariff = computed(() => tariffs[props.form.subscriberGroup])

const roofOptionsFormatted = computed(() =>
    roofOptions.map((o) => ({ ...o, description: `Kaplama: %${Math.round(o.coverageFactor * 100)}` })),
)
const panelOptionsFormatted = computed(() =>
    panelOptions.map((p) => ({ ...p, description: `${p.power}Wp / ${p.area} m2` })),
)

const monthlyConsumptionDerived = computed(() =>
    props.form.monthlyConsumption && props.form.monthlyConsumption > 0
        ? props.form.monthlyConsumption
        : props.form.monthlyBill / Math.max(props.form.electricityPrice, 0.01),
)

const maxMonthlyProduction = computed(() =>
    Math.max(...(props.result?.monthlySeries.map((entry) => entry.production) ?? [1]), 1),
)
const maxMonthlyConsumption = computed(() =>
    Math.max(...(props.result?.monthlySeries.map((entry) => entry.consumption) ?? [1]), 1),
)

const selectPanel = (panelValue) => {
  props.form.selectedPanel = panelValue
  const panel = panelOptions.find((p) => p.value === panelValue)
  if (panel) {
    props.form.panelPower = panel.power
    props.form.panelArea = panel.area
  }
}

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
</script>
