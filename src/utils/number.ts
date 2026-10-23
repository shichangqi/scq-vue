export const NUMBER_DEFAULTS = {
  step: 1,
  precision: 12,
  maximumPrecision: 15,
  stepTolerance: 1e-10,
} as const

export const roundNumber = (value: number, precision: number = NUMBER_DEFAULTS.precision) =>
  Number(value.toFixed(precision))
