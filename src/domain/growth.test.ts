import { describe, expect, it } from 'vitest'
import { applyAward, applyReversal, getGrowthProgress, validateThresholds } from './growth'
import { DEFAULT_THRESHOLDS } from '../types/domain'

describe('fish growth', () => {
  it.each([[0,'baby'],[9,'baby'],[10,'young'],[24,'young'],[25,'growing'],[49,'growing'],[50,'adult'],[99,'adult'],[100,'evolved']])('maps %i points to %s', (points, stage) => expect(getGrowthProgress(points, DEFAULT_THRESHOLDS).stage.id).toBe(stage))
  it('reports exact progress to the next stage', () => { const result=getGrowthProgress(20,DEFAULT_THRESHOLDS);expect(result.next?.id).toBe('growing');expect(result.percent).toBe(67) })
  it('awards and reverses positive integer points', () => { expect(applyAward(9,1)).toBe(10);expect(applyReversal(10,1)).toBe(9) })
  it('rejects negative totals and invalid awards', () => { expect(()=>applyAward(0,0)).toThrow();expect(()=>applyReversal(1,2)).toThrow() })
  it('requires ordered thresholds starting at zero', () => { expect(validateThresholds(DEFAULT_THRESHOLDS)).toBe(true);expect(validateThresholds([{id:'baby',label:'Baby',points:1}])).toBe(false) })
})
