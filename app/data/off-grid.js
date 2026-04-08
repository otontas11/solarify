export { roofDirections, roofOptions, panelOptions } from '~/data/on-grid'

export const applianceOptions = [
  { value: 'led-bulb', label: 'LED Ampul (9W)', avgWattage: 9 },
  { value: 'cfl-bulb', label: 'Tasarruflu Ampul (15W)', avgWattage: 15 },
  { value: 'tv-led', label: 'LED TV (55")', avgWattage: 80 },
  { value: 'laptop', label: 'Laptop', avgWattage: 65 },
  { value: 'desktop', label: 'Masaustu Bilgisayar', avgWattage: 300 },
  { value: 'router', label: 'Modem / Router', avgWattage: 12 },
  { value: 'phone-charger', label: 'Telefon Sarj Cihazi', avgWattage: 10 },
  { value: 'fridge', label: 'Buzdolabi', avgWattage: 150 },
  { value: 'freezer', label: 'Derin Dondurucu', avgWattage: 200 },
  { value: 'washing-machine', label: 'Camasir Makinesi', avgWattage: 500 },
  { value: 'dishwasher', label: 'Bulasik Makinesi', avgWattage: 1800 },
  { value: 'microwave', label: 'Mikrodalga Firin', avgWattage: 1000 },
  { value: 'oven', label: 'Elektrikli Firin', avgWattage: 2000 },
  { value: 'toaster', label: 'Tost Makinesi', avgWattage: 800 },
  { value: 'kettle', label: 'Su Isitici (Kettle)', avgWattage: 1500 },
  { value: 'iron', label: 'Utu', avgWattage: 1200 },
  { value: 'hair-dryer', label: 'Sac Kurutma Makinesi', avgWattage: 1500 },
  { value: 'vacuum', label: 'Elektrik Supurgesi', avgWattage: 900 },
  { value: 'ac-split', label: 'Klima (Split, 12000 BTU)', avgWattage: 1200 },
  { value: 'fan', label: 'Vantiator', avgWattage: 60 },
  { value: 'water-heater', label: 'Elektrikli Su Isitici (Termosifon)', avgWattage: 2000 },
  { value: 'water-pump', label: 'Su Pompasi', avgWattage: 750 },
  { value: 'security-camera', label: 'Guvenlik Kamerasi', avgWattage: 15 },
]

export const defaultOffGridForm = () => ({
  selectedPanel: 'half-cut-108',
  panelPower: 545,
  panelArea: 2.58,
  roofAngle: 30,
  roofDirection: 'south',
  roofType: 'sandwich',
  appliances: [
    { id: crypto.randomUUID(), type: 'led-bulb', dayHours: 4, nightHours: 4 },
    { id: crypto.randomUUID(), type: 'fridge', dayHours: 12, nightHours: 12 },
  ],
})
