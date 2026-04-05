import type { MonthlySeriesItem, OnGridResult } from '~/types/on-grid'

interface PvgisMonthlyItem {
  month: number
  E_m: number
  H_i_m?: number
}

interface PvgisResponse {
  outputs?: {
    monthly?: {
      fixed?: PvgisMonthlyItem[]
    }
    totals?: {
      fixed?: {
        E_y?: number
        H_i_y?: number
      }
    }
  }
}

interface CalculateInput {
  address: string
  cityLabel: string
  lat: number
  lng: number
  drawnAreaM2: number
  roofCoverageFactor: number
  roofCostMultiplier: number
  monthlyBill: number
  electricityPrice: number
  monthlyConsumption: number | null
  panelPower: number
  panelArea: number
  inverterEfficiency: number
  systemLoss: number
  annualDegradation: number
  installationCostPerKw: number
  roofAngle?: number
  roofAspect?: number
  electricityBuyPrice?: number
  electricitySellPrice?: number
}

const monthLabels = ['Oca', 'Sub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Agu', 'Eyl', 'Eki', 'Kas', 'Ara']

const toNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export const fetchPvgisProduction = async (params: {
  lat: number
  lng: number
  peakPower: number
  loss: number
  angle?: number
  aspect?: number
}) => {
  const queryParams: Record<string, string> = {
    lat: String(params.lat),
    lon: String(params.lng),
    peakpower: String(params.peakPower),
    loss: String(params.loss),
    outputformat: 'json',
    browser: '0',
  }

  if (params.angle !== undefined && params.angle > 0) {
    queryParams.angle = String(params.angle)
  }
  if (params.aspect !== undefined) {
    queryParams.aspect = String(params.aspect)
  }

  const query = new URLSearchParams(queryParams)

  const response = await $fetch<PvgisResponse>(`https://re.jrc.ec.europa.eu/api/v5_3/PVcalc?${query.toString()}`)
  const fixedMonthly = response.outputs?.monthly?.fixed ?? []
  const fixedTotals = response.outputs?.totals?.fixed

  return {
    yearlyProduction: toNumber(fixedTotals?.E_y),
    irradiation: toNumber(fixedTotals?.H_i_y),
    monthlySeries: fixedMonthly.map((item) => ({
      month: monthLabels[item.month - 1] ?? String(item.month),
      production: toNumber(item.E_m),
      irradiation: toNumber(item.H_i_m),
    })),
  }
}

export const calculateSolarResult = async (input: CalculateInput): Promise<OnGridResult> => {
  const monthlyConsumption =
    input.monthlyConsumption && input.monthlyConsumption > 0
      ? input.monthlyConsumption
      : input.monthlyBill / Math.max(input.electricityPrice, 0.01)

  const yearlyConsumption = monthlyConsumption * 12
  const usableAreaM2 = input.drawnAreaM2 * input.roofCoverageFactor
  const areaLimitedPanelCount = Math.max(1, Math.floor(usableAreaM2 / input.panelArea))
  const areaLimitedPeakPower = (areaLimitedPanelCount * input.panelPower) / 1000

  const initialPvgis = await fetchPvgisProduction({
    lat: input.lat,
    lng: input.lng,
    peakPower: 1,
    loss: input.systemLoss,
    angle: input.roofAngle,
    aspect: input.roofAspect,
  })

  const pvYield = initialPvgis.yearlyProduction
  const recommendedSystemSizeKw = yearlyConsumption / Math.max(pvYield, 1)
  const feasibleSystemSizeKw = Math.min(recommendedSystemSizeKw, areaLimitedPeakPower)
  const panelCount = Math.max(1, Math.ceil((feasibleSystemSizeKw * 1000) / input.panelPower))

  const finalPvgis = await fetchPvgisProduction({
    lat: input.lat,
    lng: input.lng,
    peakPower: feasibleSystemSizeKw,
    loss: input.systemLoss,
    angle: input.roofAngle,
    aspect: input.roofAspect,
  })

  const monthlySeries: MonthlySeriesItem[] = finalPvgis.monthlySeries.map((item) => ({
    month: item.month,
    production: item.production,
    consumption: monthlyConsumption,
  }))

  const yearlyProduction = finalPvgis.yearlyProduction
  const monthlyAverageProduction = yearlyProduction / 12
  const buyPrice = input.electricityBuyPrice ?? input.electricityPrice
  const sellPrice = input.electricitySellPrice ?? input.electricityPrice
  const selfConsumed = Math.min(yearlyProduction, yearlyConsumption)
  const exported = Math.max(yearlyProduction - yearlyConsumption, 0)
  const yearlySavings = selfConsumed * buyPrice + exported * sellPrice
  const installationCost = feasibleSystemSizeKw * input.installationCostPerKw * input.roofCostMultiplier
  const paybackYears = installationCost / Math.max(yearlySavings, 1)
  const selfSufficiencyRate = Math.min((yearlyProduction / Math.max(yearlyConsumption, 1)) * 100, 100)
  const co2OffsetKg = yearlyProduction * 0.42

  let cumulative = -installationCost
  const cumulativeCashflow: number[] = []
  for (let year = 1; year <= 10; year += 1) {
    const degradedProduction = yearlyProduction * Math.pow(1 - input.annualDegradation / 100, year - 1)
    cumulative += Math.min(degradedProduction, yearlyConsumption) * input.electricityPrice
    cumulativeCashflow.push(cumulative)
  }

  return {
    address: input.address,
    cityLabel: input.cityLabel,
    lat: input.lat,
    lng: input.lng,
    pvYield,
    irradiation: finalPvgis.irradiation,
    usableAreaM2,
    areaLimitedPanelCount,
    recommendedSystemSizeKw,
    feasibleSystemSizeKw,
    panelCount,
    yearlyConsumption,
    yearlyProduction,
    monthlyAverageProduction,
    yearlySavings,
    installationCost,
    paybackYears,
    co2OffsetKg,
    selfSufficiencyRate,
    monthlySeries,
    cumulativeCashflow,
  }
}
