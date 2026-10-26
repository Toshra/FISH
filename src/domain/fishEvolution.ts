import type { AwardRecord, Enrollment } from '../types/domain'

export type EvolutionMilestone = 'starter' | 'natural' | 'rare' | 'magical' | 'mythical'

export interface FishDefinition {
  id: string
  code: string
  name: string
  collection: EvolutionMilestone
  milestonePoints: number
  imagePath: string
  isSample: boolean
  description?: string
}

export interface MilestoneMeta {
  id: EvolutionMilestone
  label: string
  points: number
  glowName: string
  glowColor: string
}

export const MILESTONES: Record<EvolutionMilestone, MilestoneMeta> = {
  starter: { id: 'starter', label: 'Starter', points: 0, glowName: 'None', glowColor: 'transparent' },
  natural: { id: 'natural', label: 'Natural', points: 10, glowName: 'Soft Aqua', glowColor: '#2dd4bf' },
  rare: { id: 'rare', label: 'Rare', points: 25, glowName: 'Sapphire Blue', glowColor: '#3b82f6' },
  magical: { id: 'magical', label: 'Magical', points: 50, glowName: 'Violet Sparkles', glowColor: '#a855f7' },
  mythical: { id: 'mythical', label: 'Mythical', points: 100, glowName: 'Golden Halo', glowColor: '#f59e0b' },
}

export const MILESTONE_ORDER: EvolutionMilestone[] = ['starter', 'natural', 'rare', 'magical', 'mythical']

// Complete 41 Fish Inventory Catalog
export const FISH_INVENTORY: FishDefinition[] = [
  // Starter (0 pts) - 1 design
  {
    id: 'starter',
    code: 'S01',
    name: 'Starter Goldfish',
    collection: 'starter',
    milestonePoints: 0,
    imagePath: '/assets/fish/starter.png',
    isSample: true,
    description: 'A tiny, energetic golden swimmer. Every student begins their participation journey here.',
  },

  // Natural (10 pts) - 10 designs
  { id: 'N01', code: 'N01', name: 'Guppy', collection: 'natural', milestonePoints: 10, imagePath: '/assets/fish/N01.png', isSample: true, description: 'Vibrant fan-tailed swimmer with delicate orange and black mosaic fin patterning.' },
  { id: 'N02', code: 'N02', name: 'Neon Tetra', collection: 'natural', milestonePoints: 10, imagePath: '/assets/fish/N02.png', isSample: false, description: 'Luminous neon blue horizontal flank with bright scarlet tail flash.' },
  { id: 'N03', code: 'N03', name: 'Zebra Danio', collection: 'natural', milestonePoints: 10, imagePath: '/assets/fish/N03.png', isSample: false, description: 'Sleek silver torpedo body accented with metallic dark blue racing stripes.' },
  { id: 'N04', code: 'N04', name: 'Harlequin Rasbora', collection: 'natural', milestonePoints: 10, imagePath: '/assets/fish/N04.png', isSample: false, description: 'Diamond-profiled copper body with a bold black triangular wedge.' },
  { id: 'N05', code: 'N05', name: 'Cherry Barb', collection: 'natural', milestonePoints: 10, imagePath: '/assets/fish/N05.png', isSample: false, description: 'Warm ruby-tinted swimmer with fine whiskers and an inquisitive nature.' },
  { id: 'N06', code: 'N06', name: 'Southern Platy', collection: 'natural', milestonePoints: 10, imagePath: '/assets/fish/N06.png', isSample: false, description: 'Sunburst orange livebearer with rounded dorsal and translucent fins.' },
  { id: 'N07', code: 'N07', name: 'Green Swordtail', collection: 'natural', milestonePoints: 10, imagePath: '/assets/fish/N07.png', isSample: false, description: 'Emerald olive body sporting an elongated pointed sword-like caudal fin.' },
  { id: 'N08', code: 'N08', name: 'Honey Gourami', collection: 'natural', milestonePoints: 10, imagePath: '/assets/fish/N08.png', isSample: false, description: 'Golden amber tranquil swimmer with slender feeler pectoral fins.' },
  { id: 'N09', code: 'N09', name: 'Bronze Corydoras', collection: 'natural', milestonePoints: 10, imagePath: '/assets/fish/N09.png', isSample: false, description: 'Iridescent metallic armored bottom dweller with peaceful whisker barbels.' },
  { id: 'N10', code: 'N10', name: 'Kuhli Loach', collection: 'natural', milestonePoints: 10, imagePath: '/assets/fish/N10.png', isSample: false, description: 'Eel-shaped orange and espresso banded agile explorer of the reef floor.' },

  // Rare (25 pts) - 10 designs
  { id: 'R01', code: 'R01', name: 'Sapphire Discus', collection: 'rare', milestonePoints: 25, imagePath: '/assets/fish/R01.png', isSample: false, description: 'Regal disc-shaped cichlid with brilliant cobalt striations.' },
  { id: 'R02', code: 'R02', name: 'Marble Angelfish', collection: 'rare', milestonePoints: 25, imagePath: '/assets/fish/R02.png', isSample: false, description: 'Graceful triangular silhouette with velvety black and silver marbling.' },
  { id: 'R03', code: 'R03', name: 'Crown Betta', collection: 'rare', milestonePoints: 25, imagePath: '/assets/fish/R03.png', isSample: false, description: 'Proud royal labyrinth fish with majestic crown-tail ray extensions.' },
  { id: 'R04', code: 'R04', name: 'Butterfly Koi', collection: 'rare', milestonePoints: 25, imagePath: '/assets/fish/R04.png', isSample: true, description: 'Graceful flowing white fins adorned with vivid orange patches.' },
  { id: 'R05', code: 'R05', name: 'Boesemani Rainbowfish', collection: 'rare', milestonePoints: 25, imagePath: '/assets/fish/R05.png', isSample: false, description: 'Dual-toned masterwork blending bluish purple into blazing yellow-orange.' },
  { id: 'R06', code: 'R06', name: 'German Blue Ram', collection: 'rare', milestonePoints: 25, imagePath: '/assets/fish/R06.png', isSample: false, description: 'Jewel-toned micro-cichlid sparkling with electric cyan spangles.' },
  { id: 'R07', code: 'R07', name: 'Celestial Pearl Danio', collection: 'rare', milestonePoints: 25, imagePath: '/assets/fish/R07.png', isSample: false, description: 'Midnight navy flanks dotted with bright galaxy pearls and coral fins.' },
  { id: 'R08', code: 'R08', name: 'Threadfin Rainbowfish', collection: 'rare', milestonePoints: 25, imagePath: '/assets/fish/R08.png', isSample: false, description: 'Whisper-delicate filamentous fins that shimmer like spun glass.' },
  { id: 'R09', code: 'R09', name: 'Pearl Gourami', collection: 'rare', milestonePoints: 25, imagePath: '/assets/fish/R09.png', isSample: false, description: 'Lace-patterned silver swimmer dusted with hundreds of tiny pearlescent spots.' },
  { id: 'R10', code: 'R10', name: 'Blue Acara', collection: 'rare', milestonePoints: 25, imagePath: '/assets/fish/R10.png', isSample: false, description: 'Electric turquoise scales edged in shimmering royal blue luster.' },

  // Magical (50 pts) - 10 designs
  { id: 'MG01', code: 'MG01', name: 'Moonbeam', collection: 'magical', milestonePoints: 50, imagePath: '/assets/fish/MG01.png', isSample: true, description: 'Ethereal pearlescent celestial fish gleaming with a radiant golden crescent moon.' },
  { id: 'MG02', code: 'MG02', name: 'Crystalfin', collection: 'magical', milestonePoints: 50, imagePath: '/assets/fish/MG02.png', isSample: false, description: 'Prismatic translucent crystal scales refracting light into miniature rainbows.' },
  { id: 'MG03', code: 'MG03', name: 'Emberfin', collection: 'magical', milestonePoints: 50, imagePath: '/assets/fish/MG03.png', isSample: false, description: 'Living flame spirit leaving floating orange embers in its gentle wake.' },
  { id: 'MG04', code: 'MG04', name: 'Frostveil', collection: 'magical', milestonePoints: 50, imagePath: '/assets/fish/MG04.png', isSample: false, description: 'Glacial frost spirit veiled in shimmering crystalline ice mist.' },
  { id: 'MG05', code: 'MG05', name: 'Blossomtail', collection: 'magical', milestonePoints: 50, imagePath: '/assets/fish/MG05.png', isSample: false, description: 'Floating cherry blossom petals woven into flowing spring-blessed fin veils.' },
  { id: 'MG06', code: 'MG06', name: 'Aurora', collection: 'magical', milestonePoints: 50, imagePath: '/assets/fish/MG06.png', isSample: false, description: 'Waves of boreal emerald and violet energy dancing across its celestial tail.' },
  { id: 'MG07', code: 'MG07', name: 'Stormspark', collection: 'magical', milestonePoints: 50, imagePath: '/assets/fish/MG07.png', isSample: false, description: 'Charged indigo electric currents sparking softly across its lightning fins.' },
  { id: 'MG08', code: 'MG08', name: 'Sunburst', collection: 'magical', milestonePoints: 50, imagePath: '/assets/fish/MG08.png', isSample: false, description: 'Golden solar flare swimmer radiating warm tropical optimism.' },
  { id: 'MG09', code: 'MG09', name: 'Mossglow', collection: 'magical', milestonePoints: 50, imagePath: '/assets/fish/MG09.png', isSample: false, description: 'Bioluminescent deep forest guardian entwined with glowing aquatic vines.' },
  { id: 'MG10', code: 'MG10', name: 'Starlight', collection: 'magical', milestonePoints: 50, imagePath: '/assets/fish/MG10.png', isSample: false, description: 'Midnight obsidian skin studded with pulsing constellations and star dust.' },

  // Mythical (100 pts) - 10 designs
  { id: 'MY01', code: 'MY01', name: 'Dragonfin', collection: 'mythical', milestonePoints: 100, imagePath: '/assets/fish/MY01.png', isSample: true, description: 'Majestic crimson-and-gold scaled dragon ruler with feathered sun fins and whiskers.' },
  { id: 'MY02', code: 'MY02', name: 'Phoenix Fish', collection: 'mythical', milestonePoints: 100, imagePath: '/assets/fish/MY02.png', isSample: false, description: 'Reborn from solar embers with soaring plumage fins and an undying heart.' },
  { id: 'MY03', code: 'MY03', name: 'Celestial Leviathan', collection: 'mythical', milestonePoints: 100, imagePath: '/assets/fish/MY03.png', isSample: false, description: 'Ancient ocean titan whose deep breathing controls the tides of the cosmos.' },
  { id: 'MY04', code: 'MY04', name: 'Pearl Guardian', collection: 'mythical', milestonePoints: 100, imagePath: '/assets/fish/MY04.png', isSample: false, description: 'Seraphic oyster monarch protecting the sacred luminous pearl of wisdom.' },
  { id: 'MY05', code: 'MY05', name: 'Abyssal Monarch', collection: 'mythical', milestonePoints: 100, imagePath: '/assets/fish/MY05.png', isSample: false, description: 'Crown-crested sovereign of the midnight trenches flanked by deep hydrothermal vents.' },
  { id: 'MY06', code: 'MY06', name: 'Cloud Serpent', collection: 'mythical', milestonePoints: 100, imagePath: '/assets/fish/MY06.png', isSample: false, description: 'Wreathed in cumulus vapor, navigating the atmospheric heights between rain showers.' },
  { id: 'MY07', code: 'MY07', name: 'Solar Sovereign', collection: 'mythical', milestonePoints: 100, imagePath: '/assets/fish/MY07.png', isSample: false, description: 'Blinding corona of gold and platinum scales emitting continuous solar warmth.' },
  { id: 'MY08', code: 'MY08', name: 'Lunar Oracle', collection: 'mythical', milestonePoints: 100, imagePath: '/assets/fish/MY08.png', isSample: false, description: 'Crescent-horned aquatic mystic whispering the secrets of the moon phases.' },
  { id: 'MY09', code: 'MY09', name: 'Tidal Titan', collection: 'mythical', milestonePoints: 100, imagePath: '/assets/fish/MY09.png', isSample: false, description: 'Colossal sapphire wave summoner crowned with spiraling sea-foam horns.' },
  { id: 'MY10', code: 'MY10', name: 'Dreamweaver', collection: 'mythical', milestonePoints: 100, imagePath: '/assets/fish/MY10.png', isSample: false, description: 'Shifting phantom of starlight and silk threads that swims through thoughts.' },
]

export const FISH_MAP = new Map<string, FishDefinition>(FISH_INVENTORY.map((f) => [f.id, f]))

export function getFishDefinition(id: string): FishDefinition {
  return FISH_MAP.get(id) || FISH_INVENTORY[0]
}

export function getFishByCollection(collection: EvolutionMilestone): FishDefinition[] {
  return FISH_INVENTORY.filter((f) => f.collection === collection)
}

/**
 * Calculates continuous visual scale for a fish based on individual participation points.
 * Every individual participation point slightly increases size up to capPoints.
 */
export function getContinuousFishScale(
  points: number,
  minScale = 0.55,
  maxScale = 1.45,
  capPoints = 100
): number {
  if (points <= 0) return minScale
  const progress = Math.min(Math.max(0, points), capPoints) / capPoints
  return Number((minScale + progress * (maxScale - minScale)).toFixed(3))
}

/**
 * Determines current milestone level based on total points.
 */
export function getMilestoneForPoints(points: number): EvolutionMilestone {
  if (points >= 100) return 'mythical'
  if (points >= 50) return 'magical'
  if (points >= 25) return 'rare'
  if (points >= 10) return 'natural'
  return 'starter'
}

/**
 * Resolves or updates permanent evolution outcomes for a student based on cumulative points.
 * - Outcomess are rolled permanently when first reached.
 * - Single awards crossing multiple milestones roll and store each in ascending sequence.
 * - Existing outcomes are NEVER rerolled.
 * - In working sample mode: maps each milestone to the verified sample asset while cataloging the collection.
 */
export function resolveEvolutionHistory(
  existingHistory: Record<string, string> | undefined,
  points: number,
  rng: () => number = Math.random
): { history: Record<EvolutionMilestone, string>; newlyUnlocked: FishDefinition[] } {
  const history: Record<EvolutionMilestone, string> = {
    ...(existingHistory as Record<EvolutionMilestone, string> || {}),
    starter: existingHistory?.starter || 'starter',
  }
  const newlyUnlocked: FishDefinition[] = []

  for (const milestone of MILESTONE_ORDER) {
    const meta = MILESTONES[milestone]
    if (points >= meta.points) {
      if (!history[milestone]) {
        // Pick from collection
        const pool = getFishByCollection(milestone)
        // For sample deliverable, we route to the sample fish or one of the 10 designs
        const sampleFish = pool.find((f) => f.isSample) || pool[0]
        const rollIndex = Math.floor(rng() * pool.length)
        const chosen = pool[rollIndex] || sampleFish

        // Store outcome permanently
        history[milestone] = chosen.id
        newlyUnlocked.push(chosen)
      }
    }
  }

  return { history, newlyUnlocked }
}

/**
 * Gets the student's currently active fish definition matching their points balance.
 * Uses permanent evolution history if already generated, otherwise resolves deterministic fallback.
 */
export function getStudentCurrentFish(student: Enrollment): FishDefinition {
  const currentMilestone = getMilestoneForPoints(student.points)
  if (currentMilestone === 'starter') {
    return FISH_INVENTORY[0]
  }

  const savedFishId = student.evolutionHistory?.[currentMilestone]
  if (savedFishId && FISH_MAP.has(savedFishId)) {
    return FISH_MAP.get(savedFishId)!
  }

  // Fallback if not yet saved in student document:
  // Deterministic student-specific hash so different students do not render the exact same fallback!
  const pool = getFishByCollection(currentMilestone)
  let hash = 0
  const seed = `${student.id}:${currentMilestone}`
  for (let i = 0; i < seed.length; i++) hash = (hash << 5) - hash + seed.charCodeAt(i)
  const idx = Math.abs(hash) % pool.length
  return pool[idx]
}

export interface EvolutionRepairItem {
  studentId: string
  studentName: string
  milestone: EvolutionMilestone
  currentFishId: string | null
  currentFishName: string
  currentImagePath: string
  proposedFishId: string
  proposedFishName: string
  proposedImagePath: string
  isMissing: boolean
  isLegacyDefault: boolean
}

export interface EvolutionRepairPreview {
  affectedStudentsCount: number
  totalRepairsCount: number
  items: EvolutionRepairItem[]
  proposedHistories: Record<string, Record<string, string>>
}

// Legacy default sample IDs that were uniform across early mock records
export const LEGACY_UNIFORM_DEFAULTS: Record<EvolutionMilestone, string> = {
  starter: 'starter',
  natural: 'N01',
  rare: 'R04',
  magical: 'MG01',
  mythical: 'MY01',
}

/**
 * Identifies students whose saved evolution is missing or matching legacy uniform defaults,
 * producing an actionable preview of proposed independent selections without silently overwriting.
 */
export function generateEvolutionRepairPreview(
  students: Enrollment[],
  options: { reRandomizeLegacyDefaults?: boolean } = {},
  rng: () => number = Math.random
): EvolutionRepairPreview {
  const items: EvolutionRepairItem[] = []
  const proposedHistories: Record<string, Record<string, string>> = {}

  students.forEach((student) => {
    let studentAffected = false
    const currentHist = student.evolutionHistory || { starter: 'starter' }
    const updatedHist = { ...currentHist }

    for (const m of MILESTONE_ORDER) {
      if (m === 'starter') continue
      const meta = MILESTONES[m]
      if (student.points >= meta.points) {
        const savedId = currentHist[m]
        const isMissing = !savedId || !FISH_MAP.has(savedId)
        const isLegacyDefault = Boolean(options.reRandomizeLegacyDefaults && savedId === LEGACY_UNIFORM_DEFAULTS[m])

        if (isMissing || isLegacyDefault) {
          studentAffected = true
          const pool = getFishByCollection(m)
          const rollIndex = Math.floor(rng() * pool.length)
          const proposed = pool[rollIndex]
          updatedHist[m] = proposed.id

          const currentDef = savedId && FISH_MAP.has(savedId) ? FISH_MAP.get(savedId)! : null

          items.push({
            studentId: student.id,
            studentName: student.displayName || student.name,
            milestone: m,
            currentFishId: savedId || null,
            currentFishName: currentDef ? currentDef.name : 'Unassigned (Fallback)',
            currentImagePath: currentDef ? currentDef.imagePath : '/assets/fish/starter.png',
            proposedFishId: proposed.id,
            proposedFishName: proposed.name,
            proposedImagePath: proposed.imagePath,
            isMissing,
            isLegacyDefault,
          })
        }
      }
    }

    if (studentAffected) {
      proposedHistories[student.id] = updatedHist
    }
  })

  const affectedStudentIds = new Set(items.map((it) => it.studentId))

  return {
    affectedStudentsCount: affectedStudentIds.size,
    totalRepairsCount: items.length,
    items,
    proposedHistories,
  }
}

export interface ClassMilestoneGlowResults {
  glowsByStudent: Record<string, Record<EvolutionMilestone, boolean>>
  qualifiersByMilestone: Record<
    EvolutionMilestone,
    Array<{
      studentId: string
      studentName: string
      rank: number
      qualifiedAtMillis: number
      operationId: string
    }>
  >
}

/**
 * Authoritatively calculates milestone glow recipients per class from saved award ledger events.
 * Rules:
 * - Independent per class and milestone.
 * - First 10 students to reach EACH milestone earn the glow.
 * - Batch tie-breaking across 10th place: awards the glow to EVERYONE tied in that batch.
 * - Undo recalculates eligibility strictly from remaining valid awards.
 */
export function computeClassMilestoneGlows(
  awards: AwardRecord[],
  reversals: Array<{ awardId: string }>,
  students: Enrollment[],
  maxPlaces = 10
): ClassMilestoneGlowResults {
  const reversedAwardIds = new Set(reversals.map((r) => r.awardId))
  const validAwards = awards.filter((a) => !reversedAwardIds.has(a.id) && !a.reversedBy)

  // Sort chronologically ascending
  validAwards.sort((a, b) => {
    const tA = typeof a.createdAt?.toMillis === 'function' ? a.createdAt.toMillis() : 0
    const tB = typeof b.createdAt?.toMillis === 'function' ? b.createdAt.toMillis() : 0
    return tA - tB
  })

  // Track student running balances over time
  const runningPoints = new Map<string, number>()
  const studentMap = new Map<string, Enrollment>(students.map((s) => [s.id, s]))

  // Map: milestone -> studentId -> { qualifiedAtMillis, operationId }
  const milestoneEvents: Record<
    EvolutionMilestone,
    Map<string, { qualifiedAtMillis: number; operationId: string; awardId: string }>
  > = {
    starter: new Map(),
    natural: new Map(),
    rare: new Map(),
    magical: new Map(),
    mythical: new Map(),
  }

  for (const award of validAwards) {
    const sId = award.studentId
    const prev = runningPoints.get(sId) || 0
    const next = prev + award.amount
    runningPoints.set(sId, next)

    const tMillis = typeof award.createdAt?.toMillis === 'function' ? award.createdAt.toMillis() : 0
    const opId = award.operationId || award.id

    // Check each milestone crossing
    for (const m of MILESTONE_ORDER) {
      if (m === 'starter') continue
      const targetPts = MILESTONES[m].points
      if (prev < targetPts && next >= targetPts) {
        if (!milestoneEvents[m].has(sId)) {
          milestoneEvents[m].set(sId, { qualifiedAtMillis: tMillis, operationId: opId, awardId: award.id })
        }
      }
    }
  }

  const glowsByStudent: Record<string, Record<EvolutionMilestone, boolean>> = {}
  students.forEach((s) => {
    glowsByStudent[s.id] = {
      starter: false,
      natural: false,
      rare: false,
      magical: false,
      mythical: false,
    }
  })

  const qualifiersByMilestone: Record<
    EvolutionMilestone,
    Array<{
      studentId: string
      studentName: string
      rank: number
      qualifiedAtMillis: number
      operationId: string
    }>
  > = {
    starter: [],
    natural: [],
    rare: [],
    magical: [],
    mythical: [],
  }

  // Process eligibility for each evolution milestone
  for (const m of MILESTONE_ORDER) {
    if (m === 'starter') continue
    const targetPts = MILESTONES[m].points
    const candidates: Array<{ studentId: string; qualifiedAtMillis: number; operationId: string }> = []

    for (const [sId, ev] of milestoneEvents[m].entries()) {
      const student = studentMap.get(sId)
      // Must currently have enough points to hold the milestone
      if (student && student.points >= targetPts) {
        candidates.push({ studentId: sId, ...ev })
      }
    }

    // Sort candidates by qualification timestamp ascending
    candidates.sort((a, b) => a.qualifiedAtMillis - b.qualifiedAtMillis)

    // Group into batches by operationId / timestamp to handle batch award ties at 10th spot
    const batches: Array<Array<{ studentId: string; qualifiedAtMillis: number; operationId: string }>> = []
    let currentBatch: Array<{ studentId: string; qualifiedAtMillis: number; operationId: string }> = []
    let currentOpId: string | null = null

    for (const cand of candidates) {
      if (currentOpId === null || cand.operationId === currentOpId) {
        currentBatch.push(cand)
        currentOpId = cand.operationId
      } else {
        batches.push(currentBatch)
        currentBatch = [cand]
        currentOpId = cand.operationId
      }
    }
    if (currentBatch.length > 0) batches.push(currentBatch)

    let awardedCount = 0
    let rankCounter = 1

    for (const batch of batches) {
      if (awardedCount < maxPlaces) {
        // All students in this batch receive the glow, even if tied across 10th place
        for (const c of batch) {
          if (glowsByStudent[c.studentId]) {
            glowsByStudent[c.studentId][m] = true
          }
          const sObj = studentMap.get(c.studentId)
          qualifiersByMilestone[m].push({
            studentId: c.studentId,
            studentName: sObj?.displayName || sObj?.name || 'Student',
            rank: rankCounter,
            qualifiedAtMillis: c.qualifiedAtMillis,
            operationId: c.operationId,
          })
        }
        awardedCount += batch.length
        rankCounter += batch.length
      } else {
        // Exceeded capacity; record remaining qualifiers without glow
        for (const c of batch) {
          const sObj = studentMap.get(c.studentId)
          qualifiersByMilestone[m].push({
            studentId: c.studentId,
            studentName: sObj?.displayName || sObj?.name || 'Student',
            rank: rankCounter++,
            qualifiedAtMillis: c.qualifiedAtMillis,
            operationId: c.operationId,
          })
        }
      }
    }
  }

  return { glowsByStudent, qualifiersByMilestone }
}
