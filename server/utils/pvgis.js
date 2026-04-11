const monthLabels = ['Oca', 'Sub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Agu', 'Eyl', 'Eki', 'Kas', 'Ara']

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

export const fetchPvgisProduction = async (params) => {
  const queryParams = {
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
    if (params.angle !== undefined && params.angle !== null) {
      queryParams.angle = String(params.angle)
    }
    if (params.aspect !== undefined && params.aspect !== null) {
      queryParams.aspect = String(params.aspect)
    }
  }

  const query = new URLSearchParams(queryParams)

  const response = await $fetch(`https://re.jrc.ec.europa.eu/api/v5_3/PVcalc?${query.toString()}`)
  console.log('pvgis sonucu ', response)
  const fixedMonthly = response.outputs?.monthly?.fixed ?? []
  const fixedTotals = response.outputs?.totals?.fixed
  const fixedMounting = response.inputs?.mounting_system?.fixed

  return {
    yearlyProduction: toNumber(fixedTotals?.E_y),
    irradiation: toNumber(fixedTotals?.['H(i)_y']),
    dailyIrradiation: toNumber(fixedTotals?.['H(i)_d']),
    optimalAngle: fixedMounting?.slope?.optimal ? (fixedMounting.slope.value ?? null) : null,
    optimalAspect: fixedMounting?.azimuth?.optimal ? (fixedMounting.azimuth.value ?? null) : null,
    monthlySeries: fixedMonthly.map((item) => ({
      month: monthLabels[item.month - 1] ?? String(item.month),
      production: toNumber(item.E_m),
      irradiation: toNumber(item['H(i)_m']),
    })),
  }
}

export const calculateSolarResult = async (input) => {
  const monthlyConsumption =
    input.monthlyConsumption && input.monthlyConsumption > 0
      ? input.monthlyConsumption
      : input.monthlyBill / Math.max(input.electricityPrice, 0.01)

  const yearlyConsumption = monthlyConsumption * 12
  const usableAreaM2 = input.drawnAreaM2 * input.roofCoverageFactor
  const areaLimitedPanelCount = Math.max(1, Math.floor(usableAreaM2 / input.panelArea))
  const areaLimitedPeakPower = (areaLimitedPanelCount * input.panelPower) / 1000

  const hasAngle = input.roofAngle !== undefined && input.roofAngle !== null
  const aspects = input.roofAspects ?? [0]
  const useOptimalAngles = !hasAngle && aspects.length === 1 && aspects[0] === undefined

  // Birden fazla cephe varsa her biri icin PVGIS cagir ve ortalamasini al
  const initialResults = await Promise.all(
    aspects.map((aspect) =>
      fetchPvgisProduction({
        lat: input.lat,
        lng: input.lng,
        peakPower: 1,
        loss: input.systemLoss,
        angle: input.roofAngle,
        aspect,
        optimalAngles: false,
        mountingPlace: input.mountingPlace,
      }),
    ),
  )

  const pvYield = initialResults.reduce((sum, r) => sum + r.yearlyProduction, 0) / initialResults.length
  const recommendedSystemSizeKw = yearlyConsumption / Math.max(pvYield, 1)

  let panelCount
  if (input.coverFullBill) {
    // Fatura bazlı: tüketimi karşılayacak kadar, alan sınırını aşmadan
    const billPanels = Math.ceil((recommendedSystemSizeKw * 1000) / input.panelPower)
    panelCount = Math.min(billPanels, areaLimitedPanelCount)
  } else {
    // Varsayılan (coverFullRoof dahil): alana sığan tüm paneller
    panelCount = areaLimitedPanelCount
  }
  panelCount = Math.max(panelCount, 1)

  // Sistem gücünü gerçek panel sayısından hesapla
  let feasibleSystemSizeKw = (panelCount * input.panelPower) / 1000

  const finalResults = await Promise.all(
    aspects.map((aspect) =>
      fetchPvgisProduction({
        lat: input.lat,
        lng: input.lng,
        peakPower: feasibleSystemSizeKw,
        loss: input.systemLoss,
        angle: input.roofAngle,
        aspect,
        optimalAngles: false,
        mountingPlace: input.mountingPlace,
      }),
    ),
  )

  // Aylik uretimi cephe sayisina gore ortalama al
  const avgMonthlySeries = finalResults[0].monthlySeries.map((item, i) => ({
    month: item.month,
    production: finalResults.reduce((sum, r) => sum + r.monthlySeries[i].production, 0) / finalResults.length,
    consumption: monthlyConsumption,
  }))

  const yearlyProduction = finalResults.reduce((sum, r) => sum + r.yearlyProduction, 0) / finalResults.length
  const finalIrradiation = finalResults.reduce((sum, r) => sum + r.irradiation, 0) / finalResults.length
  const finalOptimalAngle = finalResults[0].optimalAngle
  const finalOptimalAspect = finalResults[0].optimalAspect
  const monthlyAverageProduction = yearlyProduction / 12
  const escalationRate = (input.annualEscalationRate ?? 15) / 100

  const buyPrice = input.electricityBuyPrice ?? input.electricityPrice
  const sellPrice = input.electricitySellPrice ?? input.electricityPrice
  const selfConsumed = Math.min(yearlyProduction, yearlyConsumption)
  const exported = Math.max(yearlyProduction - yearlyConsumption, 0)

  const selfConsumptionSaving = selfConsumed * buyPrice
  const exportIncome = exported * sellPrice
  const yearlySavings = selfConsumptionSaving + exportIncome

  const installationCost = feasibleSystemSizeKw * input.installationCostPerKw * input.roofCostMultiplier
  const selfSufficiencyRate = Math.min((yearlyProduction / Math.max(yearlyConsumption, 1)) * 100, 100)
  const co2OffsetKg = yearlyProduction * 0.42

  let cumulative = -installationCost
  let paybackYears = installationCost / Math.max(yearlySavings, 1)
  let paybackFound = false
  const cumulativeCashflow = []

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
    irradiation: finalIrradiation,
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
    optimalAngle: finalOptimalAngle,
    optimalAspect: finalOptimalAspect,
    selfSufficiencyRate,
    monthlySeries: avgMonthlySeries,
    cumulativeCashflow,
    savingsBreakdown: {
      selfConsumptionSaving,
      distributionSaving: 0,
      exportIncome,
    },
  }
}
