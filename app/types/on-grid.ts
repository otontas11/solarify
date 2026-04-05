export type WizardStep = 'category' | 'location' | 'details' | 'results'

export type SystemCategoryKey = 'on-grid' | 'off-grid' | 'agricultural' | 'heat-pump' | 'off-grid-flex' | 'ev-charger'

export type CalculationMode = 'simple' | 'advanced'

export type SubscriberGroup = 'mesken' | 'kamu' | 'sanayi' | 'osb'

export type RoofDirection = 'south' | 'north' | 'east' | 'west' | 'north-south' | 'east-west' | 'all'

export interface PanelOption {
  value: string
  label: string
  power: number
  area: number
}

export interface SystemCategory {
  key: SystemCategoryKey
  label: string
  description: string
  icon: string
  available: boolean
}

export interface RoofOption {
  value: string
  label: string
  coverageFactor: number
  costMultiplier: number
}

export interface OnGridForm {
  address: string
  cityLabel: string
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
  calculationMode: CalculationMode
  subscriberGroup: SubscriberGroup
  roofDirection: RoofDirection
  roofAngle: number
  coverFullBill: boolean
  coverFullRoof: boolean
  selectedPanel: string
  electricityBuyPrice: number
  electricitySellPrice: number
  distributionFee: number | null
  yearlyConsumption: number | null
}

export interface MonthlySeriesItem {
  month: string
  production: number
  consumption: number
}

export interface OnGridResult {
  address: string
  cityLabel: string
  lat: number
  lng: number
  pvYield: number
  irradiation: number
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
