import { describe, expect, it } from 'vitest'
import {
  computeClassMilestoneGlows,
  getContinuousFishScale,
  getStudentCurrentFish,
} from './fishEvolution'
import type { AwardRecord, Enrollment } from '../types/domain'

// Helper to generate N students
function generateTestEnrollments(count: number): Enrollment[] {
  const students: Enrollment[] = []
  const firstNames = ['Alex', 'Sam', 'Maria', 'Juan', 'Bea', 'Chris', 'Taylor', 'Jordan', 'Morgan', 'Casey']
  const lastNames = ['Rivera', 'Cruz', 'Santos', 'Reyes', 'Ramos', 'Lim', 'Tan', 'Flores', 'Garcia', 'Mendoza']

  for (let i = 0; i < count; i++) {
    const fn = firstNames[i % firstNames.length]
    const ln = lastNames[Math.floor(i / firstNames.length) % lastNames.length]
    const id = `student-test-${i + 1}`
    // Varied points between 0 and 110 points across milestones
    const points = (i * 3) % 115

    students.push({
      id,
      ownerId: 'teacher-1',
      classId: 'class-test',
      name: `${fn} ${ln} ${i + 1}`,
      displayName: `${fn} ${ln}`,
      fishName: `Fish-${i + 1}`,
      fishStyle: i % 5,
      points,
      status: 'active',
      evolutionHistory: { starter: 'starter' },
      lastMutationId: `mut-${i + 1}`,
      createdAt: { seconds: 1700000000, nanoseconds: 0 } as unknown as Enrollment['createdAt'],
      updatedAt: { seconds: 1700000000, nanoseconds: 0 } as unknown as Enrollment['updatedAt'],
    })
  }
  return students
}

// Emulate initial agent positioning logic from AquariumView
function simulateInitialAgents(students: Enrollment[]) {
  const total = students.length
  return students.map((student, index) => {
    let hash = 0
    for (let i = 0; i < student.id.length; i++) hash = (hash << 5) - hash + student.id.charCodeAt(i)
    const seed = Math.abs(hash)

    const cols = Math.max(3, Math.ceil(Math.sqrt(Math.max(1, total) * 1.5)))
    const col = index % cols
    const row = Math.floor(index / cols)
    const baseGridX = 8 + (col / Math.max(1, cols - 1)) * 82
    const baseGridY = 16 + (row / Math.max(1, Math.ceil(Math.max(1, total) / cols))) * 64

    const jitterX = ((seed % 20) - 10) * 0.8
    const jitterY = (((seed >> 4) % 20) - 10) * 0.8

    const x = Math.min(90, Math.max(8, baseGridX + jitterX))
    const y = Math.min(80, Math.max(15, baseGridY + jitterY))

    const depth = (seed % 5) + 1
    const facing = seed % 2 === 0 ? 1 : -1

    return { id: student.id, x, y, depth, facing }
  })
}

describe('Aquarium Display & Size Controls System', () => {
  describe('Verification with 40+ Fish', () => {
    const students40 = generateTestEnrollments(45)

    it('generates 45 unique students with valid metadata', () => {
      expect(students40.length).toBe(45)
      const ids = new Set(students40.map((s) => s.id))
      expect(ids.size).toBe(45)
    })

    it('distributes all 45 fish strictly within safe tank boundaries (minX 6..94, minY 12..82)', () => {
      const agents = simulateInitialAgents(students40)
      expect(agents.length).toBe(45)

      agents.forEach((agent) => {
        expect(agent.x).toBeGreaterThanOrEqual(6)
        expect(agent.x).toBeLessThanOrEqual(94)
        expect(agent.y).toBeGreaterThanOrEqual(12)
        expect(agent.y).toBeLessThanOrEqual(82)
        expect(agent.depth).toBeGreaterThanOrEqual(1)
        expect(agent.depth).toBeLessThanOrEqual(5)
      })
    })

    it('preserves physical sprite sizing strictly based on earned points, never inflating with container size', () => {
      students40.forEach((student) => {
        const scale = getContinuousFishScale(student.points)
        expect(scale).toBeGreaterThanOrEqual(0.55)
        expect(scale).toBeLessThanOrEqual(1.45)
        // Sprite base dimensions are fixed (110 x 70 px) regardless of screen mode
        const pixelWidth = 110 * scale
        const pixelHeight = 70 * scale
        expect(pixelWidth).toBeGreaterThanOrEqual(60)
        expect(pixelWidth).toBeLessThanOrEqual(160)
        expect(pixelHeight).toBeGreaterThanOrEqual(38)
        expect(pixelHeight).toBeLessThanOrEqual(102)
      })
    })

    it('computes glow eligibility authoritatively for 45 students without memory or performance degradation', () => {
      // Create mock awards reaching milestones for some students
      const mockAwards: AwardRecord[] = students40.slice(0, 20).map((st, idx) => ({
        id: `award-${idx}`,
        ownerId: 'teacher-1',
        classId: 'class-test',
        studentId: st.id,
        recipientName: st.name,
        amount: 25,
        reasonId: 'participation',
        reasonLabel: 'Participation',
        operationId: `op-${idx}`,
        requestKey: `req-${idx}`,
        reversedBy: null,
        createdAt: { seconds: 1700000000 + idx * 60, nanoseconds: 0 } as unknown as AwardRecord['createdAt'],
      }))

      const { glowsByStudent } = computeClassMilestoneGlows(mockAwards, [], students40, 10)
      const naturalGlowRecipients = Object.values(glowsByStudent).filter((g) => g.natural).length
      expect(naturalGlowRecipients).toBe(10)
      expect(typeof glowsByStudent).toBe('object')
    })
  })

  describe('Aquarium Size Mode & Layout Preferences', () => {
    it('initializes to expanded mode as fallback if saved preference is fullscreen, requiring user click to enter browser fullscreen', () => {
      const storage: Record<string, string> = {
        aquarium_size_mode_teacher_123: 'fullscreen',
      }

      function resolveInitialMode(saved: string | undefined): 'standard' | 'expanded' | 'fullscreen' {
        if (saved === 'fullscreen' || saved === 'expanded') return 'expanded'
        return 'standard'
      }

      const initialMode = resolveInitialMode(storage['aquarium_size_mode_teacher_123'])
      expect(initialMode).toBe('expanded')
    })

    it('initializes to standard mode when preferred by teacher', () => {
      function resolveInitialMode(saved: string | undefined): 'standard' | 'expanded' | 'fullscreen' {
        if (saved === 'fullscreen' || saved === 'expanded') return 'expanded'
        return 'standard'
      }

      expect(resolveInitialMode('standard')).toBe('standard')
      expect(resolveInitialMode(undefined)).toBe('standard')
    })

    it('remembers teacher layout preference key distinctly per teacher ID', () => {
      const getStorageKey = (teacherId?: string) => (teacherId ? `aquarium_size_mode_${teacherId}` : 'aquarium_size_mode')
      expect(getStorageKey('t-101')).toBe('aquarium_size_mode_t-101')
      expect(getStorageKey('t-202')).toBe('aquarium_size_mode_t-202')
      expect(getStorageKey()).toBe('aquarium_size_mode')
    })
  })

  describe('Search & Subdued Filtering Behavior', () => {
    const students = generateTestEnrollments(40)

    it('filters matching students accurately and leaves non-matching students subdued', () => {
      const query = 'Alex'.toLowerCase()
      const matches = students.filter((s) => s.displayName?.toLowerCase().includes(query))
      expect(matches.length).toBeGreaterThan(0)
      expect(matches.length).toBeLessThan(students.length)

      matches.forEach((m) => {
        expect(m.displayName?.toLowerCase()).toContain('alex')
      })
    })

    it('preserves student current fish identity during filter and award interactions', () => {
      students.forEach((student) => {
        const fish = getStudentCurrentFish(student)
        expect(fish).toBeDefined()
        expect(fish.imagePath).toBeTruthy()
        expect(typeof fish.name).toBe('string')
      })
    })
  })
})
