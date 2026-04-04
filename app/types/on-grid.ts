export type WizardStep = 'system' | 'mode' | 'location' | 'details' | 'results'

export type SystemKey = 'ongrid' | 'offgrid' | 'hybrid'

export interface SystemOption {
  key: SystemKey
  title: string
  description: string
  available: boolean
  badge?: string
}

export interface CalculationModeOption {
  value: 'basic' | 'advanced'
  title: string
  description: string
  available: boolean
}

export interface CityPreset {
  id: string
  city: string
  region: string
  lat: number
  lng: number
  annualYield: number
  irradiation: number
  monthlyProductionFactors: number[]
}

export interface RoofOption {
  value: string
  label: string
  coverageFactor: number
  costMultiplier: number
}

export interface OnGridForm {
  systemType: SystemKey
  calculationMode: 'basic' | 'advanced'
  cityId: string | null
  address: string
  lat: number | null
  lng: number | null
  drawnAreaM2: number
  roofType: string
  monthlyBill: number
  electricityPrice: number
  monthlyConsumption: number | null
  panelPower: number
  panelArea: number
  inverterEfficiency: number
  systemLoss: number
  annualDegradation: number
  installationCostPerKw: number
}

export interface MonthlySeriesItem {
  month: string
  production: number
  consumption: number
}

export interface OnGridResult {
  locationLabel: string
  selectedCity: CityPreset
  usableAreaM2: number
  areaLimitedPanelCount: number
  recommendedSystemSizeKw: number
  feasibleSystemSizeKw: number
  panelCount: number
  yearlyConsumption: number
  yearlyProduction: number
  monthlyAverageProduction: number
  yearlySavings: number
  installationCost: number
  paybackYears: number
  co2OffsetKg: number
  selfSufficiencyRate: number
  monthlySeries: MonthlySeriesItem[]
  cumulativeCashflow: number[]
}
