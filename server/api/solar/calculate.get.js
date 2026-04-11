import { getQuery } from 'h3'
import { roofDirections, roofOptions } from '~/data/on-grid'
import { calculateSolarResult } from '../../utils/pvgis'

const numberParam = (value, fallback) => {
  const parsed = Number(value)
  if (Number.isFinite(parsed)) {
    return parsed
  }

  if (fallback !== undefined) {
    return fallback
  }

  throw createError({ statusCode: 400, statusMessage: 'Sayisal parametre gecersiz' })
}

const optionalNumberParam = (value) => {
  if (value === undefined || value === null || value === '') return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const lat = numberParam(query.lat)
  const lng = numberParam(query.lng)
  const monthlyBill = numberParam(query.monthlyBill)
  const electricityPrice = numberParam(query.electricityPrice)
  const drawnAreaM2 = numberParam(query.drawnAreaM2)
  const roofType = String(query.roofType ?? 'sandwich')
  const monthlyConsumptionRaw = query.monthlyConsumption
  const roof = roofOptions.find((item) => item.value === roofType) ?? roofOptions[0]

  const roofAngle = optionalNumberParam(query.roofAngle)
  const roofDirection = String(query.roofDirection ?? 'south')
  const directionMeta = roofDirections.find((d) => d.value === roofDirection)
  const roofAspect = directionMeta?.aspect

  const electricityBuyPrice = optionalNumberParam(query.electricityBuyPrice)
  const electricitySellPrice = optionalNumberParam(query.electricitySellPrice)
  const annualEscalationRate = optionalNumberParam(query.annualEscalationRate)
  const mountingPlace = query.mountingPlace === 'free' ? 'free' : 'building'
  const coverFullBill = query.coverFullBill === '1'
  const coverFullRoof = query.coverFullRoof === '1'

  return calculateSolarResult({
    address: String(query.address ?? ''),
    cityLabel: String(query.cityLabel ?? query.address ?? ''),
    lat,
    lng,
    drawnAreaM2,
    roofCoverageFactor: optionalNumberParam(query.coverageFactor) ?? roof.coverageFactor,
    roofCostMultiplier: roof.costMultiplier,
    monthlyBill,
    electricityPrice,
    monthlyConsumption:
      monthlyConsumptionRaw === undefined || monthlyConsumptionRaw === null || monthlyConsumptionRaw === ''
        ? null
        : numberParam(monthlyConsumptionRaw),
    panelPower: numberParam(query.panelPower, 545),
    panelArea: numberParam(query.panelArea, 2.58),
    inverterEfficiency: numberParam(query.inverterEfficiency, 96),
    systemLoss: numberParam(query.systemLoss, 14),
    annualDegradation: numberParam(query.annualDegradation, 0.5),
    installationCostPerKw: numberParam(query.installationCostPerKw, 44500),
    roofAngle,
    roofAspect,
    mountingPlace,
    electricityBuyPrice,
    electricitySellPrice,
    annualEscalationRate,
    coverFullBill,
    coverFullRoof,
  })
})
