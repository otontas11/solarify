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
  const directionMeta = roofDirections.find((d) => d.value === roofDirection)
  const roofAspect = directionMeta?.aspect ?? 0

  const systemLoss = 14

  const pvgis = await fetchPvgisProduction({
    lat,
    lng,
    peakPower: 1,
    loss: systemLoss,
    angle: roofAngle,
    aspect: roofAspect,
    mountingPlace: 'building',
  })

  const pvYield = pvgis.yearlyProduction
  const yearlyConsumption = dailyConsumptionKwh * 365

  const rawSystemSizeKw = yearlyConsumption / Math.max(pvYield, 1)
  let systemSizeKw = rawSystemSizeKw * 1.3

  const usableAreaM2 = drawnAreaM2 * roof.coverageFactor
  const areaLimitedPanelCount = Math.max(1, Math.floor(usableAreaM2 / panelArea))
  const areaLimitedPeakPower = (areaLimitedPanelCount * panelPower) / 1000

  if (systemSizeKw > areaLimitedPeakPower) {
    systemSizeKw = areaLimitedPeakPower
  }

  systemSizeKw = Math.max(systemSizeKw, 0.5)

  const panelCount = Math.max(1, Math.ceil((systemSizeKw * 1000) / panelPower))
  const yearlyProduction = systemSizeKw * pvYield
  const efficiency = yearlyConsumption > 0 ? Math.min((yearlyProduction / yearlyConsumption) * 100, 999) : 0
  const areaM2 = panelCount * panelArea

  const batterySizeKwh = nighttimeConsumptionKwh * 3

  const panelCost = systemSizeKw * 10000
  const inverterCost = systemSizeKw * 15000
  const batteryCost = batterySizeKwh * 8000
  const installationCost = (panelCost + inverterCost + batteryCost) * roof.costMultiplier

  const monthlySeries = pvgis.monthlySeries.map((item) => ({
    month: item.month,
    production: item.production * systemSizeKw,
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
    installationCost: Math.round(installationCost),
    efficiency: Math.round(efficiency * 10) / 10,
    areaM2: Math.round(areaM2 * 100) / 100,
    monthlySeries,
  }
})
