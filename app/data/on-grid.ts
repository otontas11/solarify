import type {
  OnGridForm,
  RoofOption,
  SystemCategory,
  WizardStep,
} from '~/types/on-grid'

export const systemCategories: SystemCategory[] = [
  {
    key: 'on-grid',
    label: 'ON GRID',
    description: 'Sebekeye bagli sistemler icindir.',
    icon: '🏠',
    available: true,
  },
  {
    key: 'off-grid',
    label: 'OFF GRID',
    description: 'Bataryali sebeke bagimsiz sistemler icindir.',
    icon: '🔋',
    available: false,
  },
  {
    key: 'agricultural',
    label: 'Tarimsal Sulama',
    description: 'Tarimsal sulama sebekeli/sebekesiz sistemler icindir.',
    icon: '🌾',
    available: false,
  },
  {
    key: 'heat-pump',
    label: 'Isi Pompasi',
    description: 'Isi pompasi sistemleri icin uygun cozumler.',
    icon: '♨️',
    available: false,
  },
  {
    key: 'off-grid-flex',
    label: 'OFF GRID (Esnek Panel)',
    description: 'Tekne-Yat ve Karavanlara uygun sebekeden bagimsiz sistemler icindir.',
    icon: '⛵',
    available: false,
  },
  {
    key: 'ev-charger',
    label: 'Arac Sarj Istasyonu',
    description: 'Arac sarj istasyonu sebeke bagli sistemler icindir.',
    icon: '🚗',
    available: false,
  },
]

export const wizardSteps: { key: WizardStep; title: string; summary: string }[] = [
  { key: 'category', title: 'Kategori', summary: 'Sistem tipini sec' },
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
