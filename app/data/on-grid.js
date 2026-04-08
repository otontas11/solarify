export const systemCategories = [
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
    available: true,
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

export const wizardSteps = [
  { key: 'category', title: 'Kategori', summary: 'Sistem tipini sec' },
  { key: 'location', title: 'Konum & Alan', summary: 'Adres ara, cati alanini ciz' },
  { key: 'details', title: 'Bilgiler', summary: 'Fatura ve sistem bilgilerini gir' },
  { key: 'results', title: 'Sonuc', summary: 'PVGIS tabanli fizibiliteyi gor' },
]

export const subscriberGroups = [
  { value: 'mesken', label: 'Mesken', icon: '🏠' },
  { value: 'kamu', label: 'Kamu', icon: '🏛️' },
  { value: 'sanayi', label: 'Sanayi', icon: '🏭' },
  { value: 'osb', label: 'OSB', icon: '⚙️' },
]

export const roofDirections = [
  { value: 'south', label: 'Guney', aspect: 0 },
  { value: 'north', label: 'Kuzey', aspect: 180 },
  { value: 'east', label: 'Dogu', aspect: -90 },
  { value: 'west', label: 'Bati', aspect: 90 },
  { value: 'north-south', label: 'Kuzey & Guney', aspect: 0 },
  { value: 'east-west', label: 'Dogu & Bati', aspect: 0 },
  { value: 'all', label: 'Hepsi', aspect: 0 },
]

export const roofOptions = [
  { value: 'sandwich', label: 'Sandvic Panel Cati', coverageFactor: 0.84, costMultiplier: 1.0 },
  { value: 'trapez', label: 'Trapez Cati', coverageFactor: 0.84, costMultiplier: 1.0 },
  { value: 'aluminium-sandwich', label: 'Aluminyum Sandvic Panel Cati', coverageFactor: 0.82, costMultiplier: 1.05 },
  { value: 'kenet', label: 'Kenet Cati', coverageFactor: 0.80, costMultiplier: 1.08 },
  { value: 'membrane', label: 'Membran Cati', coverageFactor: 0.78, costMultiplier: 1.04 },
  { value: 'flat', label: 'Duz Beton Teras Tipi Cati', coverageFactor: 0.78, costMultiplier: 1.04 },
]

export const mountingOptions = [
  { value: 'building', label: 'Cati Ustu' },
  { value: 'free', label: 'Arazi / Serbest' },
]

export const panelOptions = [
  { value: 'half-cut-108', label: 'Half-Cut 108PM12', power: 545, area: 2.58 },
  { value: 'half-cut-144', label: 'Half-Cut 144PMHC', power: 455, area: 2.17 },
  { value: 'half-cut-132', label: 'Half-Cut 132PM12', power: 670, area: 3.1 },
]

export const defaultOnGridForm = () => ({
  address: '',
  cityLabel: '',
  lat: null,
  lng: null,
  drawnAreaM2: 0,
  roofType: 'sandwich',
  monthlyBill: 4500,
  electricityPrice: 3.45,
  monthlyConsumption: null,
  panelPower: 545,
  panelArea: 2.58,
  inverterEfficiency: 96,
  systemLoss: 14,
  annualDegradation: 0.5,
  installationCostPerKw: 44500,
  calculationMode: 'simple',
  subscriberGroup: 'mesken',
  roofDirection: 'south',
  roofAngle: 0,
  coverFullBill: false,
  coverFullRoof: false,
  mountingPlace: 'building',
  selectedPanel: 'half-cut-108',
  electricityBuyPrice: 3.45,
  electricitySellPrice: 1.39,
  distributionFee: 0,
  yearlyConsumption: null,
  annualEscalationRate: 15,
})
