import type { MonthlySeriesItem, OnGridResult } from '~/types/on-grid'

interface PvgisMonthlyItem {
  month: number
  E_m: number
  H_i_m?: number
}

interface PvgisResponse {
  inputs?: {
    mounting_system?: {
      fixed?: {
        slope?: { value?: number; optimal?: boolean }
        azimuth?: { value?: number; optimal?: boolean }
      }
    }
  }
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
  mountingPlace?: 'free' | 'building'
  electricityBuyPrice?: number
  electricitySellPrice?: number
  annualEscalationRate?: number
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
  optimalAngles?: boolean
  useHorizon?: boolean
  mountingPlace?: 'free' | 'building'
}) => {
  const queryParams: Record<string, string> = {
    lat: String(params.lat),
    lon: String(params.lng),
    peakpower: String(params.peakPower),
    loss: String(params.loss),
    outputformat: 'json',
    browser: '0',
    usehorizon: '1',
    mountingplace: params.mountingPlace ?? 'building',
  }

  if (params.optimalAngles) {
    queryParams.optimalangles = '1'
  } else {
    if (params.angle !== undefined && params.angle > 0) {
      queryParams.angle = String(params.angle)
    }
    if (params.aspect !== undefined) {
      queryParams.aspect = String(params.aspect)
    }
  }

  const query = new URLSearchParams(queryParams)

  const response = await $fetch<PvgisResponse>(`https://re.jrc.ec.europa.eu/api/v5_3/PVcalc?${query.toString()}`)
  console.log("pvgis sonucu ",response)
  const fixedMonthly = response.outputs?.monthly?.fixed ?? []
  const fixedTotals = response.outputs?.totals?.fixed
  const fixedMounting = response.inputs?.mounting_system?.fixed

  return {
    yearlyProduction: toNumber(fixedTotals?.E_y),
    irradiation: toNumber(fixedTotals?.H_i_y),
    optimalAngle: fixedMounting?.slope?.optimal ? (fixedMounting.slope.value ?? null) : null,
    optimalAspect: fixedMounting?.azimuth?.optimal ? (fixedMounting.azimuth.value ?? null) : null,
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

  const useOptimalAngles = !input.roofAngle && input.roofAspect === undefined

  const initialPvgis = await fetchPvgisProduction({
    lat: input.lat,
    lng: input.lng,
    peakPower: 1,
    loss: input.systemLoss,
    angle: input.roofAngle,
    aspect: input.roofAspect,
    optimalAngles: useOptimalAngles,
    mountingPlace: input.mountingPlace,
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
    optimalAngles: useOptimalAngles,
    mountingPlace: input.mountingPlace,
  })

  const monthlySeries: MonthlySeriesItem[] = finalPvgis.monthlySeries.map((item) => ({
    month: item.month,
    production: item.production,
    consumption: monthlyConsumption,
  }))

  const yearlyProduction = finalPvgis.yearlyProduction
  const monthlyAverageProduction = yearlyProduction / 12
  const escalationRate = (input.annualEscalationRate ?? 15) / 100

  // Birim fiyat (enerji + dagitim + vergi dahil toplam)
  const buyPrice = input.electricityBuyPrice ?? input.electricityPrice
  const sellPrice = input.electricitySellPrice ?? input.electricityPrice
  const selfConsumed = Math.min(yearlyProduction, yearlyConsumption)
  const exported = Math.max(yearlyProduction - yearlyConsumption, 0)

  // Tasarruf (ilk yil)
  const selfConsumptionSaving = selfConsumed * buyPrice
  const exportIncome = exported * sellPrice
  const yearlySavings = selfConsumptionSaving + exportIncome

  const installationCost = feasibleSystemSizeKw * input.installationCostPerKw * input.roofCostMultiplier
  const selfSufficiencyRate = Math.min((yearlyProduction / Math.max(yearlyConsumption, 1)) * 100, 100)
  const co2OffsetKg = yearlyProduction * 0.42

  // 25 yillik kumulative nakit akisi (yillik zam ve degradasyon ile)
  let cumulative = -installationCost
  let paybackYears = installationCost / Math.max(yearlySavings, 1) // fallback
  let paybackFound = false
  const cumulativeCashflow: number[] = []

  for (let year = 1; year <= 25; year += 1) {
    const degradedProduction = yearlyProduction * Math.pow(1 - input.annualDegradation / 100, year - 1)
    const escalatedBuyPrice = buyPrice * Math.pow(1 + escalationRate, year - 1)
    const escalatedSellPrice = sellPrice * Math.pow(1 + escalationRate, year - 1)
    const yearSelfConsumed = Math.min(degradedProduction, yearlyConsumption)
    const yearExported = Math.max(degradedProduction - yearlyConsumption, 0)
    const yearSavings = yearSelfConsumed * escalatedBuyPrice + yearExported * escalatedSellPrice
    const prevCumulative = cumulative
    cumulative += yearSavings
    cumulativeCashflow.push(cumulative)

    if (!paybackFound && cumulative >= 0) {
      // Lineer interpolasyon
      paybackYears = year - 1 + Math.abs(prevCumulative) / yearSavings
      paybackFound = true
    }
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
    optimalAngle: finalPvgis.optimalAngle,
    optimalAspect: finalPvgis.optimalAspect,
    selfSufficiencyRate,
    monthlySeries,
    cumulativeCashflow,
    savingsBreakdown: {
      selfConsumptionSaving,
      distributionSaving: 0,
      exportIncome,
    },
  }
}
