import type {
  OnGridForm,
  RoofOption,
  WizardStep,
} from '~/types/on-grid'

export const wizardSteps: { key: WizardStep; title: string; summary: string }[] = [
  { key: 'location', title: 'Konum & Alan', summary: 'Adres ara, cati alanini ciz' },
  { key: 'details', title: 'Bilgiler', summary: 'Fatura ve sistem bilgilerini gir' },
  { key: 'results', title: 'Sonuc', summary: 'PVGIS tabanli fizibiliteyi gor' },
]

export const roofOptions: RoofOption[] = [
  { value: 'tile', label: 'Kiremit Cati', coverageFactor: 0.72, costMultiplier: 1.08 },
  { value: 'metal', label: 'Trapez Sac', coverageFactor: 0.84, costMultiplier: 1 },
  { value: 'flat', label: 'Duz Cati', coverageFactor: 0.78, costMultiplier: 1.04 },
  { value: 'ground', label: 'Arazi Kurulumu', coverageFactor: 0.9, costMultiplier: 0.97 },
]

export const defaultOnGridForm = (): OnGridForm => ({
  address: '',
  cityLabel: '',
  lat: null,
  lng: null,
  drawnAreaM2: 0,
  roofType: 'metal',
  monthlyBill: 4500,
  electricityPrice: 3.2,
  monthlyConsumption: null,
  panelPower: 585,
  panelArea: 2.8,
  inverterEfficiency: 96,
  systemLoss: 14,
  annualDegradation: 0.5,
  installationCostPerKw: 44500,
})
