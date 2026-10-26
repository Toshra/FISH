import { describe, expect, it } from 'vitest'
import { isChallengeInPeriod, projectChallenge } from './challenge'

describe('class challenge projection', () => {
  it('counts qualifying reason events and reversals', () => {
    let p = projectChallenge('reason-count', 3, 0, [], ['s1'], { studentId: 's1', amount: 2, qualifies: true })
    expect(p.progress).toBe(2)
    p = projectChallenge('reason-count', 3, p.progress, p.contributorIds, ['s1'], { amount: 2, qualifies: true })
    expect(p.rewardActive).toBe(true)
    p = projectChallenge('reason-count', 3, p.progress, p.contributorIds, ['s1'], { amount: 2, qualifies: true, reverse: true })
    expect(p.rewardActive).toBe(false)
  })

  it('counts eligible contributors once', () => {
    let p = projectChallenge('distinct-contributors', 2, 0, [], ['s1', 's2'], { studentId: 's1', qualifies: true })
    p = projectChallenge('distinct-contributors', 2, p.progress, p.contributorIds, ['s1', 's2'], { studentId: 's1', qualifies: true })
    expect(p.progress).toBe(1)
    p = projectChallenge('distinct-contributors', 2, p.progress, p.contributorIds, ['s1', 's2'], { studentId: 's2', qualifies: true })
    expect(p.rewardActive).toBe(true)
  })

  it('handles distinct contributor reversal properly', () => {
    const p = projectChallenge('distinct-contributors', 2, 2, ['s1', 's2'], ['s1', 's2'], { studentId: 's2', qualifies: true, reverse: true })
    expect(p.progress).toBe(1)
    expect(p.contributorIds).toEqual(['s1'])
    expect(p.rewardActive).toBe(false)
  })

  it('handles manual mode progress and corrections', () => {
    let p = projectChallenge('manual', 10, 0, [], [], { amount: 5, qualifies: true })
    expect(p.progress).toBe(5)
    expect(p.rewardActive).toBe(false)
    p = projectChallenge('manual', 10, p.progress, [], [], { amount: 6, qualifies: true })
    expect(p.progress).toBe(11)
    expect(p.rewardActive).toBe(true)
    p = projectChallenge('manual', 10, p.progress, [], [], { amount: 2, qualifies: true, reverse: true })
    expect(p.progress).toBe(9)
    expect(p.rewardActive).toBe(false)
  })

  it('ignores ineligible and nonqualifying sources', () => {
    expect(projectChallenge('distinct-contributors', 2, 0, [], ['s1'], { studentId: 's2', qualifies: true }).progress).toBe(0)
    expect(projectChallenge('reason-count', 2, 0, [], ['s1'], { amount: 1, qualifies: false }).progress).toBe(0)
  })

  it('validates invalid targets and amounts', () => {
    expect(() => projectChallenge('manual', 0, 0, [], [], { amount: 1, qualifies: true })).toThrow('positive whole number')
    expect(() => projectChallenge('manual', -5, 0, [], [], { amount: 1, qualifies: true })).toThrow('positive whole number')
    expect(() => projectChallenge('manual', 5, 0, [], [], { amount: -1, qualifies: true })).toThrow('positive whole number')
  })

  it('uses inclusive tracking boundaries', () => {
    expect(isChallengeInPeriod(10, 10, 20)).toBe(true)
    expect(isChallengeInPeriod(20, 10, 20)).toBe(true)
    expect(isChallengeInPeriod(21, 10, 20)).toBe(false)
    expect(isChallengeInPeriod(9, 10, 20)).toBe(false)
  })
})

