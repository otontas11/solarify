export interface Appliance {
  id: string
  type: string
  dayHours: number
  nightHours: number
}

export interface ApplianceOption {
  value: string
  label: string
  avgWattage: number
}

export interface OffGridForm {
  selectedPanel: string
  panelPower: number
  panelArea: number
  roofAngle: number
  roofDirection: string
  roofType: string
  appliances: Appliance[]
}

export interface OffGridMonthlyItem {
  month: string
  production: number
}

export interface OffGridResult {
  cityLabel: string
  systemSizeKw: number
  yearlyProduction: number
  panelCount: number
  instantaneousConsumptionKw: number
  dailyConsumptionKwh: number
  nighttimeConsumptionKwh: number
  batterySizeKwh: number
  installationCost: number
  efficiency: number
  areaM2: number
  monthlySeries: OffGridMonthlyItem[]
}
