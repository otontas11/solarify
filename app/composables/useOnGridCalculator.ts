import {
  locationPresets,
  orientationOptions,
  roofOptions,
  tiltOptions,
} from '~/data/on-grid'
import type { OnGridForm, OnGridResult } from '~/types/on-grid'

const findByValue = <T extends { value: string }>(items: T[], value: string, fallback: T) =>
  items.find((item) => item.value === value) ?? fallback

export const calculateOnGrid = (form: OnGridForm): OnGridResult => {
  const location = locationPresets.find((item) => item.id === form.locationId) ?? locationPresets[0]
  const roof = findByValue(roofOptions, form.roofType, roofOptions[0])
  const orientation = findByValue(orientationOptions, form.orientation, orientationOptions[0])
  const tilt = findByValue(tiltOptions, form.tilt, tiltOptions[2])

  const usableArea = form.roofArea * roof.coverageFactor
  const maxPanelCountByArea = Math.max(1, Math.floor(usableArea / form.panelArea))
  const panelCount = form.panelCountOverride && form.panelCountOverride > 0
    ? Math.min(form.panelCountOverride, maxPanelCountByArea)
    : maxPanelCountByArea

  const systemSizeKw = (panelCount * form.panelPower) / 1000
  const netYieldFactor =
    orientation.productionFactor *
    tilt.productionFactor *
    (1 - form.shadingLoss / 100) *
    (form.inverterEfficiency / 100) *
    (form.performanceRatio / 100)

  const annualProduction = systemSizeKw * location.annualYield * netYieldFactor
  const annualConsumption = form.monthlyConsumption * 12
  const selfConsumedEnergy = annualProduction * (form.selfConsumptionRate / 100)
  const exportedEnergy = Math.max(0, annualProduction - selfConsumedEnergy)
  const effectiveConsumptionOffset = Math.min(selfConsumedEnergy, annualConsumption)
  const coverageRatio = annualConsumption > 0 ? (effectiveConsumptionOffset / annualConsumption) * 100 : 0
  const derivedUnitPrice =
    form.monthlyConsumption > 0 && form.monthlyBill > 0
      ? form.monthlyBill / form.monthlyConsumption
      : form.electricityUnitPrice
  const effectiveUnitPrice =
    form.calculatorMode === 'basic' ? derivedUnitPrice : form.electricityUnitPrice

  const annualSavings =
    effectiveConsumptionOffset * effectiveUnitPrice +
    exportedEnergy * (effectiveUnitPrice * 0.35)

  const estimatedSystemCost = systemSizeKw * form.installationCostPerKw
  const yearlyMaintenanceCost = estimatedSystemCost * (form.maintenanceRate / 100)
  const firstYearNetBenefit = Math.max(annualSavings - yearlyMaintenanceCost, 1)
  const paybackPeriod = estimatedSystemCost / firstYearNetBenefit

  let cumulativeGain = -estimatedSystemCost
  for (let year = 1; year <= 25; year += 1) {
    const priceMultiplier = Math.pow(1 + form.annualPriceIncrease / 100, year - 1)
    const annualNet = annualSavings * priceMultiplier - yearlyMaintenanceCost
    cumulativeGain += annualNet
  }

  return {
    systemSizeKw,
    panelCount,
    annualProduction,
    monthlyAverageProduction: annualProduction / 12,
    annualConsumption,
    coverageRatio,
    selfConsumedEnergy,
    exportedEnergy,
    annualSavings,
    estimatedSystemCost,
    yearlyMaintenanceCost,
    paybackPeriod,
    twentyFiveYearNetGain: cumulativeGain,
    co2OffsetKg: annualProduction * 0.42,
  }
}
