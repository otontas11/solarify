import { getQuery } from 'h3'
import { fetchPvgisProduction } from '../utils/pvgis'

const numberParam = (value, name) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    throw createError({ statusCode: 400, statusMessage: `${name} gecersiz` })
  }

  return parsed
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const lat = numberParam(query.lat, 'lat')
  const lng = numberParam(query.lng, 'lng')
  const peakPower = numberParam(query.peakPower ?? 1, 'peakPower')
  const loss = numberParam(query.loss ?? 14, 'loss')

  return fetchPvgisProduction({
    lat,
    lng,
    peakPower,
    loss,
  })
})
