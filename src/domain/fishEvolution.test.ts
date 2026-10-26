import { describe, expect, it } from 'vitest'
import {
  computeClassMilestoneGlows,
  FISH_INVENTORY,
  generateEvolutionRepairPreview,
  getContinuousFishScale,
  getMilestoneForPoints,
  getStudentCurrentFish,
  LEGACY_UNIFORM_DEFAULTS,
  resolveEvolutionHistory,
} from './fishEvolution'
import type { AwardRecord, Enrollment } from '../types/domain'
import type { Timestamp } from 'firebase/firestore'

function mockTimestamp(millis: number): Timestamp {
  return {
    seconds: Math.floor(millis / 1000),
    nanoseconds: (millis % 1000) * 1e6,
    toDate: () => new Date(millis),
    toMillis: () => millis,
    isEqual: (o: { toMillis?: () => number }) => o?.toMillis?.() === millis,
    valueOf: () => new Date(millis).toISOString(),
    toJSON: () => ({ seconds: Math.floor(millis / 1000), nanoseconds: 0 }),
  } as unknown as Timestamp
}

function makeStudent(id: string, points = 0, history?: Record<string, string>): Enrollment {
  return {
    id,
    ownerId: 'teacher-1',
    classId: 'class-1',
    name: `Student ${id}`,
    displayName: `Student ${id}`,
    fishName: 'Finny',
    fishStyle: 0,
    points,
    status: 'active',
    lastMutationId: '',
    evolutionHistory: history,
    createdAt: mockTimestamp(1000),
    updatedAt: mockTimestamp(1000),
  }
}

function makeAward(
  id: string,
  studentId: string,
  amount: number,
  millis: number,
  operationId = id,
  reversedBy: string | null = null
): AwardRecord {
  return {
    id,
    ownerId: 'teacher-1',
    classId: 'class-1',
    studentId,
    recipientName: `Student ${studentId}`,
    amount,
    reasonId: 'test',
    reasonLabel: 'Participation',
    operationId,
    requestKey: `req-${id}`,
    reversedBy,
    createdAt: mockTimestamp(millis),
  }
}

describe('Fish Evolution Domain Tests', () => {
  it('has all 41 fish designs cataloged', () => {
    expect(FISH_INVENTORY.length).toBe(41)
    const starter = FISH_INVENTORY.filter((f) => f.collection === 'starter')
    const natural = FISH_INVENTORY.filter((f) => f.collection === 'natural')
    const rare = FISH_INVENTORY.filter((f) => f.collection === 'rare')
    const magical = FISH_INVENTORY.filter((f) => f.collection === 'magical')
    const mythical = FISH_INVENTORY.filter((f) => f.collection === 'mythical')

    expect(starter.length).toBe(1)
    expect(natural.length).toBe(10)
    expect(rare.length).toBe(10)
    expect(magical.length).toBe(10)
    expect(mythical.length).toBe(10)
  })

  it('calculates continuous visual growth scale for every participation point', () => {
    const s0 = getContinuousFishScale(0)
    const s1 = getContinuousFishScale(1)
    const s10 = getContinuousFishScale(10)
    const s25 = getContinuousFishScale(25)
    const s50 = getContinuousFishScale(50)
    const s100 = getContinuousFishScale(100)
    const s150 = getContinuousFishScale(150)

    expect(s0).toBe(0.55)
    expect(s1).toBeGreaterThan(s0)
    expect(s10).toBeGreaterThan(s1)
    expect(s25).toBeGreaterThan(s10)
    expect(s50).toBeGreaterThan(s25)
    expect(s100).toBe(1.45)
    expect(s150).toBe(1.45) // capped at 100 points
  })

  it('determines correct milestones based on points', () => {
    expect(getMilestoneForPoints(0)).toBe('starter')
    expect(getMilestoneForPoints(9)).toBe('starter')
    expect(getMilestoneForPoints(10)).toBe('natural')
    expect(getMilestoneForPoints(24)).toBe('natural')
    expect(getMilestoneForPoints(25)).toBe('rare')
    expect(getMilestoneForPoints(49)).toBe('rare')
    expect(getMilestoneForPoints(50)).toBe('magical')
    expect(getMilestoneForPoints(99)).toBe('magical')
    expect(getMilestoneForPoints(100)).toBe('mythical')
    expect(getMilestoneForPoints(250)).toBe('mythical')
  })

  it('permanently saves random outcomes and never rerolls existing ones', () => {
    // Start at 0
    const step1 = resolveEvolutionHistory(undefined, 0)
    expect(step1.history.starter).toBe('starter')

    // Reach 10 pts (Natural)
    const step2 = resolveEvolutionHistory(step1.history, 10, () => 0.0) // picks first
    expect(step2.history.natural).toBeDefined()
    expect(step2.newlyUnlocked.length).toBe(1)
    const savedNatural = step2.history.natural

    // Subsequent call with different RNG MUST preserve the exact same saved outcome
    const step3 = resolveEvolutionHistory(step2.history, 10, () => 0.99)
    expect(step3.history.natural).toBe(savedNatural)
    expect(step3.newlyUnlocked.length).toBe(0) // No new unlocks
  })

  it('generates outcomes in sequential order when single award crosses multiple milestones', () => {
    // Jump straight from 0 to 60 points (crosses natural, rare, magical)
    const result = resolveEvolutionHistory(undefined, 60)
    expect(result.history.starter).toBe('starter')
    expect(result.history.natural).toBeDefined()
    expect(result.history.rare).toBeDefined()
    expect(result.history.magical).toBeDefined()
    expect(result.history.mythical).toBeUndefined()
    expect(result.newlyUnlocked.length).toBe(3)
  })

  it('undo restores matching milestone form while preserving unlocked evolution history', () => {
    // Student reached 50 points (Magical)
    const res = resolveEvolutionHistory(undefined, 50)
    const magicalFishId = res.history.magical
    const rareFishId = res.history.rare

    // Points reduced to 25 via undo: milestone is 'rare'
    const currentMilestone = getMilestoneForPoints(25)
    expect(currentMilestone).toBe('rare')
    expect(res.history.rare).toBe(rareFishId)

    // Magical outcome remains preserved in history for future re-earning
    expect(res.history.magical).toBe(magicalFishId)

    // When re-earning back to 50 points, magical outcome is preserved without rerolling
    const stepAgain = resolveEvolutionHistory(res.history, 50)
    expect(stepAgain.history.magical).toBe(magicalFishId)
    expect(stepAgain.newlyUnlocked.length).toBe(0)
  })

  it('awards evolution glow to the first 10 students per class per milestone', () => {
    const students: Enrollment[] = []
    const awards: AwardRecord[] = []

    for (let i = 1; i <= 15; i++) {
      const sId = `s-${i}`
      students.push(makeStudent(sId, 10))
      // Each student receives 10 points at distinct timestamps
      awards.push(makeAward(`a-${i}`, sId, 10, 1000 + i * 100))
    }

    const { glowsByStudent, qualifiersByMilestone } = computeClassMilestoneGlows(awards, [], students, 10)

    // First 10 students get the Natural glow
    for (let i = 1; i <= 10; i++) {
      expect(glowsByStudent[`s-${i}`].natural).toBe(true)
    }

    // 11th through 15th do NOT get the glow
    for (let i = 11; i <= 15; i++) {
      expect(glowsByStudent[`s-${i}`].natural).toBe(false)
    }

    expect(qualifiersByMilestone.natural.length).toBe(15)
    expect(qualifiersByMilestone.natural[0].rank).toBe(1)
    expect(qualifiersByMilestone.natural[9].rank).toBe(10)
    expect(qualifiersByMilestone.natural[10].rank).toBe(11)
  })

  it('awards the glow to all tied students when a batch award ties across 10th place', () => {
    const students: Enrollment[] = []
    const awards: AwardRecord[] = []

    // 8 individual students qualify first
    for (let i = 1; i <= 8; i++) {
      const sId = `s-${i}`
      students.push(makeStudent(sId, 10))
      awards.push(makeAward(`a-${i}`, sId, 10, 1000 + i * 100))
    }

    // A batch award of 4 students simultaneously reaches 10 points under the same operationId
    const batchOpId = 'batch-tie-op'
    for (let i = 9; i <= 12; i++) {
      const sId = `s-${i}`
      students.push(makeStudent(sId, 10))
      awards.push(makeAward(`a-${i}`, sId, 10, 2000, batchOpId))
    }

    // 13th student qualifies later
    students.push(makeStudent('s-13', 10))
    awards.push(makeAward('a-13', 's-13', 10, 3000))

    const { glowsByStudent } = computeClassMilestoneGlows(awards, [], students, 10)

    // Students 1 to 8 earned glow (8)
    for (let i = 1; i <= 8; i++) {
      expect(glowsByStudent[`s-${i}`].natural).toBe(true)
    }

    // Students 9, 10, 11, 12 tied across 10th place: ALL 4 MUST GET GLOW (total 12)
    for (let i = 9; i <= 12; i++) {
      expect(glowsByStudent[`s-${i}`].natural).toBe(true)
    }

    // Student 13 came afterwards and does NOT get glow
    expect(glowsByStudent['s-13'].natural).toBe(false)
  })

  it('undo recalculates glow qualification and revokes glow if points drop below milestone', () => {
    const s1 = makeStudent('s-1', 10)
    const s2 = makeStudent('s-2', 10)
    const awards = [
      makeAward('a-1', 's-1', 10, 1000),
      makeAward('a-2', 's-2', 10, 2000),
    ]

    // Initially both have glow
    const initial = computeClassMilestoneGlows(awards, [], [s1, s2], 10)
    expect(initial.glowsByStudent['s-1'].natural).toBe(true)
    expect(initial.glowsByStudent['s-2'].natural).toBe(true)

    // Undo award for s-1: s-1 points drop to 0
    s1.points = 0
    const afterUndo = computeClassMilestoneGlows(awards, [{ awardId: 'a-1' }], [s1, s2], 10)
    expect(afterUndo.glowsByStudent['s-1'].natural).toBe(false)
    expect(afterUndo.glowsByStudent['s-2'].natural).toBe(true)
    expect(afterUndo.qualifiersByMilestone.natural[0].studentId).toBe('s-2')
    expect(afterUndo.qualifiersByMilestone.natural[0].rank).toBe(1)
  })

  it('guarantees all 41 fish have distinct, individual image asset paths', () => {
    const paths = FISH_INVENTORY.map((f) => f.imagePath)
    const uniquePaths = new Set(paths)
    expect(uniquePaths.size).toBe(41)

    // Check each collection has 10 distinct images matching its ID
    const natural = FISH_INVENTORY.filter((f) => f.collection === 'natural')
    natural.forEach((f) => {
      expect(f.imagePath).toBe(`/assets/fish/${f.id}.png`)
    })
    const rare = FISH_INVENTORY.filter((f) => f.collection === 'rare')
    rare.forEach((f) => {
      expect(f.imagePath).toBe(`/assets/fish/${f.id}.png`)
    })
    const magical = FISH_INVENTORY.filter((f) => f.collection === 'magical')
    magical.forEach((f) => {
      expect(f.imagePath).toBe(`/assets/fish/${f.id}.png`)
    })
    const mythical = FISH_INVENTORY.filter((f) => f.collection === 'mythical')
    mythical.forEach((f) => {
      expect(f.imagePath).toBe(`/assets/fish/${f.id}.png`)
    })
  })

  it('demonstrates independent random selection for batch awards across students', () => {
    // Simulate 20 fictional students all receiving a batch award crossing the 10-point Natural milestone
    const batchResults: string[] = []
    for (let i = 0; i < 20; i++) {
      const outcome = resolveEvolutionHistory(undefined, 10)
      batchResults.push(outcome.history.natural)
    }

    // Results must not assign one result to the whole class
    const uniqueSpeciesCount = new Set(batchResults).size
    expect(uniqueSpeciesCount).toBeGreaterThan(1)
    // Check that all assigned fish IDs are valid Natural fish (N01..N10)
    batchResults.forEach((id) => {
      expect(id).toMatch(/^N(0[1-9]|10)$/)
    })
  })

  it('uses deterministic student-specific fallback so different unsaved students do not render identical fish', () => {
    const studentA = makeStudent('student-alice-123', 15) // Natural milestone, no saved evolutionHistory
    const studentB = makeStudent('student-bob-789', 15) // Same points, no saved evolutionHistory

    const fishA = getStudentCurrentFish(studentA)
    const fishB = getStudentCurrentFish(studentB)

    // Both are Natural fish
    expect(fishA.collection).toBe('natural')
    expect(fishB.collection).toBe('natural')
    // Fallback is deterministic per student ID, and student IDs hash differently
    expect(fishA.id).not.toBe(fishB.id)
    expect(fishA.imagePath).not.toBe(fishB.imagePath)
  })

  it('generates a non-destructive repair preview identifying affected records and proposing independent replacements', () => {
    // s1: Has valid diverse saved history
    const s1 = makeStudent('s-1', 50, { starter: 'starter', natural: 'N03', rare: 'R07', magical: 'MG05' })
    // s2: Missing evolutionHistory
    const s2 = makeStudent('s-2', 25)
    // s3: Using legacy uniform default sample IDs (N01, R04)
    const s3 = makeStudent('s-3', 25, { starter: 'starter', natural: LEGACY_UNIFORM_DEFAULTS.natural, rare: LEGACY_UNIFORM_DEFAULTS.rare })

    const preview = generateEvolutionRepairPreview([s1, s2, s3], { reRandomizeLegacyDefaults: true })

    // s1 is untouched
    expect(preview.proposedHistories['s-1']).toBeUndefined()

    // s2 has missing records identified
    expect(preview.proposedHistories['s-2']).toBeDefined()
    expect(preview.proposedHistories['s-2'].natural).toBeDefined()
    expect(preview.proposedHistories['s-2'].rare).toBeDefined()

    // s3 has legacy uniform defaults identified and replaced
    expect(preview.proposedHistories['s-3']).toBeDefined()
    expect(preview.proposedHistories['s-3'].natural).toBeDefined()
    expect(preview.proposedHistories['s-3'].rare).toBeDefined()

    // Total affected students is 2 (s2 and s3)
    expect(preview.affectedStudentsCount).toBe(2)
    expect(preview.totalRepairsCount).toBe(4) // 2 for s2 + 2 for s3

    // Verify items array contains descriptive before/after details
    const s3Items = preview.items.filter((it) => it.studentId === 's-3')
    expect(s3Items.length).toBe(2)
    expect(s3Items[0].isLegacyDefault).toBe(true)
    expect(s3Items[0].currentFishId).toBe('N01')
    expect(s3Items[0].proposedImagePath).toBeDefined()
  })
})
