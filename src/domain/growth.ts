import type { GrowthThreshold } from '../types/domain'

export interface GrowthProgress {
  stage: GrowthThreshold
  next: GrowthThreshold | null
  pointsIntoStage: number
  pointsForStage: number
  percent: number
}

export function validateThresholds(thresholds: GrowthThreshold[]): boolean {
  return thresholds.length > 0 && thresholds[0].points === 0 && thresholds.every((item, index) =>
    Number.isInteger(item.points) && item.points >= 0 && (index === 0 || item.points > thresholds[index - 1].points),
  )
}

export function getGrowthProgress(points: number, thresholds: GrowthThreshold[]): GrowthProgress {
  if (!Number.isInteger(points) || points < 0) throw new Error('Points must be a nonnegative integer.')
  if (!validateThresholds(thresholds)) throw new Error('Growth thresholds must start at zero and increase.')
  let stageIndex = 0
  thresholds.forEach((item, index) => { if (points >= item.points) stageIndex = index })
  const stage = thresholds[stageIndex]
  const next = thresholds[stageIndex + 1] ?? null
  const pointsIntoStage = points - stage.points
  const pointsForStage = next ? next.points - stage.points : 0
  return { stage, next, pointsIntoStage, pointsForStage, percent: next ? Math.min(100, Math.round(pointsIntoStage / pointsForStage * 100)) : 100 }
}

export function applyAward(points: number, amount: number): number {
  if (!Number.isInteger(points) || points < 0 || !Number.isInteger(amount) || amount <= 0) throw new Error('Awards must use positive integer points.')
  return points + amount
}

export function applyReversal(points: number, amount: number): number {
  if (!Number.isInteger(points) || points < 0 || !Number.isInteger(amount) || amount <= 0 || amount > points) throw new Error('Invalid reversal.')
  return points - amount
}
