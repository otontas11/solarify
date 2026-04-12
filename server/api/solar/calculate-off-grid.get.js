import { getQuery } from 'h3'
import { roofDirections, roofOptions } from '~/data/on-grid'
import { fetchPvgisProduction } from '../../utils/pvgis'

const numberParam = (value, fallback) => {
  const parsed = Number(value)
  if (Number.isFinite(parsed)) return parsed
  if (fallback !== undefined) return fallback
  throw createError({ statusCode: 400, statusMessage: 'Sayisal parametre gecersiz' })
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const lat = numberParam(query.lat)
  const lng = numberParam(query.lng)
  const cityLabel = String(query.cityLabel ?? '')
  const drawnAreaM2 = numberParam(query.drawnAreaM2)
  const roofType = String(query.roofType ?? 'sandwich')
  const roofAngle = numberParam(query.roofAngle, 30)
  const roofDirection = String(query.roofDirection ?? 'south')
  const panelPower = numberParam(query.panelPower, 545)
  const panelArea = numberParam(query.panelArea, 2.58)
  const dailyConsumptionKwh = numberParam(query.dailyConsumptionKwh, 0)
  const nighttimeConsumptionKwh = numberParam(query.nighttimeConsumptionKwh, 0)
  const instantaneousConsumptionKw = numberParam(query.instantaneousConsumptionKw, 0)

  const roof = roofOptions.find((r) => r.value === roofType) ?? roofOptions[0]
  const coverageFactor = numberParam(query.coverageFactor, roof.coverageFactor)
  const directionMeta = roofDirections.find((d) => d.value === roofDirection)
  const roofAspects = directionMeta?.aspects ?? [0]

  const systemLoss = 14

  const pvgisResults = await Promise.all(
    roofAspects.map((aspect) =>
      fetchPvgisProduction({
        lat,
        lng,
        peakPower: 1,
        loss: systemLoss,
        angle: roofAngle,
        aspect,
        mountingPlace: 'building',
      }),
    ),
  )

  const pvYield = pvgisResults.reduce((sum, r) => sum + r.yearlyProduction, 0) / pvgisResults.length
  const yearlyConsumption = dailyConsumptionKwh * 365

  const rawSystemSizeKw = yearlyConsumption / Math.max(pvYield, 1)
  let systemSizeKw = rawSystemSizeKw * 1.3

  const usableAreaM2 = drawnAreaM2 * coverageFactor
  const areaLimitedPanelCount = Math.max(1, Math.floor(usableAreaM2 / panelArea))
  const areaLimitedPeakPower = (areaLimitedPanelCount * panelPower) / 1000

  if (systemSizeKw > areaLimitedPeakPower) {
    systemSizeKw = areaLimitedPeakPower
  }

  systemSizeKw = Math.max(systemSizeKw, 0.5)

  const panelCount = Math.max(1, Math.ceil((systemSizeKw * 1000) / panelPower))
  systemSizeKw = (panelCount * panelPower) / 1000
  const yearlyProduction = systemSizeKw * pvYield
  const efficiency = yearlyConsumption > 0 ? Math.min((yearlyProduction / yearlyConsumption) * 100, 999) : 0
  const areaM2 = panelCount * panelArea

  // Batarya: DoD %80, 2 gun otonom
  const autonomyDays = 2
  const depthOfDischarge = 0.8
  const batterySizeKwh = (nighttimeConsumptionKwh * autonomyDays) / depthOfDischarge

  // Maliyet min/max
  const panelCostMin = systemSizeKw * 8000
  const panelCostMax = systemSizeKw * 12000
  const inverterCostMin = systemSizeKw * 12000
  const inverterCostMax = systemSizeKw * 18000
  const batteryCostMin = batterySizeKwh * 6000
  const batteryCostMax = batterySizeKwh * 10000
  const costMin = Math.round((panelCostMin + inverterCostMin + batteryCostMin) * roof.costMultiplier)
  const costMax = Math.round((panelCostMax + inverterCostMax + batteryCostMax) * roof.costMultiplier)

  // CO2 / agac / yol esdegeri
  const co2OffsetKg = yearlyProduction * 0.42
  const treeEquivalent = co2OffsetKg / 22
  const roadEquivalentKm = co2OffsetKg / 0.21

  // Aylik tuketim serisi
  const monthlyConsumption = dailyConsumptionKwh * 30.44 // ortalama gun/ay

  const monthlySeries = pvgisResults[0].monthlySeries.map((item, i) => ({
    month: item.month,
    production: pvgisResults.reduce((sum, r) => sum + r.monthlySeries[i].production, 0) / pvgisResults.length * systemSizeKw,
    consumption: monthlyConsumption,
  }))

  return {
    cityLabel,
    systemSizeKw: Math.round(systemSizeKw * 100) / 100,
    yearlyProduction: Math.round(yearlyProduction),
    panelCount,
    instantaneousConsumptionKw: Math.round(instantaneousConsumptionKw * 100) / 100,
    dailyConsumptionKwh: Math.round(dailyConsumptionKwh * 100) / 100,
    nighttimeConsumptionKwh: Math.round(nighttimeConsumptionKwh * 100) / 100,
    batterySizeKwh: Math.round(batterySizeKwh * 100) / 100,
    costMin,
    costMax,
    co2OffsetKg: Math.round(co2OffsetKg),
    treeEquivalent: Math.round(treeEquivalent),
    roadEquivalentKm: Math.round(roadEquivalentKm),
    efficiency: Math.round(efficiency * 10) / 10,
    areaM2: Math.round(areaM2 * 100) / 100,
    monthlySeries,
  }
})
