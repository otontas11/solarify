import { getQuery } from 'h3'
import { roofDirections } from '~/data/on-grid'
import { fetchPvgisProduction } from '../../utils/pvgis'

const numberParam = (value, name) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    throw createError({ statusCode: 400, statusMessage: `${name} gecersiz` })
  }
  return parsed
}

const optionalNumberParam = (value) => {
  if (value === undefined || value === null || value === '') return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  console.log("query",query)
  const lat = numberParam(query.lat, 'lat')
  const lng = numberParam(query.lng, 'lng')
  const roofAngle = optionalNumberParam(query.roofAngle)
  const roofDirection = String(query.roofDirection ?? '')
  const directionMeta = roofDirections.find((d) => d.value === roofDirection)
  const aspects = directionMeta?.aspects

  // Cephe ve aci belirtilmisse onlari kullan, yoksa optimal hesapla
  const useOptimal = !aspects && roofAngle === undefined

  let pvYield, irradiation, dailyIrradiation, optimalAngle, optimalAspect

  if (useOptimal) {
    const pvgis = await fetchPvgisProduction({
      lat,
      lng,
      peakPower: 1,
      loss: 14,
      optimalAngles: true,
      mountingPlace: 'building',
    })
    pvYield = pvgis.yearlyProduction
    irradiation = pvgis.irradiation
    dailyIrradiation = pvgis.dailyIrradiation
    optimalAngle = pvgis.optimalAngle
    optimalAspect = pvgis.optimalAspect
  } else {
    const aspectList = aspects ?? [0]
    const results = await Promise.all(
      aspectList.map((aspect) =>
        fetchPvgisProduction({
          lat,
          lng,
          peakPower: 1,
          loss: 14,
          angle: roofAngle,
          aspect,
          optimalAngles: false,
          mountingPlace: 'building',
        }),
      ),
    )
    pvYield = results.reduce((s, r) => s + r.yearlyProduction, 0) / results.length
    irradiation = results.reduce((s, r) => s + r.irradiation, 0) / results.length
    dailyIrradiation = results.reduce((s, r) => s + r.dailyIrradiation, 0) / results.length
    optimalAngle = results[0].optimalAngle
    optimalAspect = results[0].optimalAspect
  }

  return {
    pvYield,
    irradiation,
    dailySunHours: Math.round(dailyIrradiation * 10) / 10,
    yearlySunHours: Math.round(irradiation),
    optimalAngle,
    optimalAspect,
  }
})
