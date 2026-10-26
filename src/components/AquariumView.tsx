import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FishIllustration } from './FishIllustration'
import { getStudentCurrentFish, type EvolutionMilestone } from '../domain/fishEvolution'
import {
  DEFAULT_REASONS,
  type AwardReason,
  type ClassChallenge,
  type Enrollment,
  type GrowthThreshold,
} from '../types/domain'

export type AquariumSizeMode = 'standard' | 'expanded' | 'fullscreen'

interface FishAgent {
  id: string
  student: Enrollment
  x: number // percentage 6 to 94
  y: number // percentage 12 to 82
  vx: number // velocity x (% per frame)
  vy: number // velocity y (% per frame)
  facing: 1 | -1
  depth: number // 1 (far) to 5 (near)
  speedMult: number
  turnCooldown: number
}

export interface AquariumViewProps {
  students: Enrollment[]
  thresholds?: GrowthThreshold[]
  selectedIds?: Set<string>
  onSelectStudent?: (studentId: string) => void
  rewards?: Array<ClassChallenge | { reward: string; id: string }>
  glowsByStudent?: Record<string, Record<EvolutionMilestone, boolean>>
  showNames?: boolean
  showPoints?: boolean
  isProjector?: boolean
  height?: number | string
  sizeMode?: AquariumSizeMode
  onSizeModeChange?: (mode: AquariumSizeMode) => void
  reasons?: AwardReason[]
  onAwardReason?: (reason: AwardReason) => void | Promise<void>
  saving?: boolean
  searchQuery?: string
  onSearchChange?: (query: string) => void
  onSelectAll?: () => void
  onDeselectAll?: () => void
  teacherId?: string
}

function getDeterministicDepth(studentId: string): number {
  let hash = 0
  for (let i = 0; i < studentId.length; i++) hash = (hash << 5) - hash + studentId.charCodeAt(i)
  return (Math.abs(hash) % 5) + 1
}

function createInitialAgent(student: Enrollment, index: number, total: number): FishAgent {
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

  const facing: 1 | -1 = seed % 2 === 0 ? 1 : -1
  const speedMult = 0.65 + ((seed % 100) / 100) * 0.7
  const vx = facing * (0.04 + ((seed % 40) / 1000)) * speedMult
  const vy = (((seed % 30) - 15) / 1000) * 0.5
  const depth = (seed % 5) + 1

  return {
    id: student.id,
    student,
    x,
    y,
    vx,
    vy,
    facing,
    depth,
    speedMult,
    turnCooldown: 0,
  }
}

export function AquariumView({
  students,
  selectedIds = new Set(),
  onSelectStudent,
  rewards = [],
  glowsByStudent = {},
  showNames: initialShowNames = true,
  showPoints: initialShowPoints = true,
  isProjector = false,
  height = 560,
  sizeMode: controlledSizeMode,
  onSizeModeChange,
  reasons = DEFAULT_REASONS,
  onAwardReason,
  saving = false,
  searchQuery: controlledSearch,
  onSearchChange,
  onSelectAll,
  onDeselectAll,
  teacherId,
}: AquariumViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const storageKey = teacherId ? `aquarium_size_mode_${teacherId}` : 'aquarium_size_mode'

  // Initialize size mode: remember preference, but fall back from fullscreen to expanded on initial load
  const [internalSizeMode, setInternalSizeMode] = useState<AquariumSizeMode>(() => {
    if (typeof window === 'undefined') return 'standard'
    const saved = localStorage.getItem(storageKey)
    if (saved === 'fullscreen' || saved === 'expanded') return 'expanded'
    return 'standard'
  })

  const currentSizeMode = controlledSizeMode !== undefined ? controlledSizeMode : internalSizeMode

  const [paused, setPaused] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return true
    }
    return false
  })
  const [labelMode, setLabelMode] = useState<'all' | 'selected' | 'none'>(initialShowNames ? 'all' : 'selected')
  const [showPoints, setShowPoints] = useState(initialShowPoints)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [activeBubbleCount] = useState(() => Math.min(18, Math.max(8, Math.floor(students.length / 2) + 6)))

  // Compact floating controls state
  const [internalSearch, setInternalSearch] = useState('')
  const search = controlledSearch !== undefined ? controlledSearch : internalSearch
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)
  const [showAwardPopover, setShowAwardPopover] = useState(false)
  const [awardFeedback, setAwardFeedback] = useState<string | null>(null)

  const agentsRef = useRef<Map<string, FishAgent>>(new Map())
  const fishNodesRef = useRef<Map<string, HTMLDivElement>>(new Map())

  // Mode switcher handler with Fullscreen API support and Expanded fallback
  const handleSetSizeMode = useCallback((newMode: AquariumSizeMode) => {
    if (newMode === 'fullscreen') {
      const container = containerRef.current
      if (container && (container.requestFullscreen || (container as unknown as { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen)) {
        const req = container.requestFullscreen
          ? container.requestFullscreen()
          : (container as unknown as { webkitRequestFullscreen: () => Promise<void> }).webkitRequestFullscreen()

        Promise.resolve(req)
          .then(() => {
            setInternalSizeMode('fullscreen')
            try {
              localStorage.setItem(storageKey, 'fullscreen')
            } catch (e) {
              void e
            }
            onSizeModeChange?.('fullscreen')
          })
          .catch(() => {
            // Graceful fallback to Expanded mode if Fullscreen API is rejected or not supported
            setInternalSizeMode('expanded')
            try {
              localStorage.setItem(storageKey, 'expanded')
            } catch (e) {
              void e
            }
            onSizeModeChange?.('expanded')
          })
      } else {
        setInternalSizeMode('expanded')
        try {
          localStorage.setItem(storageKey, 'expanded')
        } catch (e) {
          void e
        }
        onSizeModeChange?.('expanded')
      }
    } else {
      // Exiting from native browser fullscreen if currently active
      if (typeof document !== 'undefined') {
        const fsElement = document.fullscreenElement || (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement
        if (fsElement) {
          const exit = document.exitFullscreen
            ? document.exitFullscreen()
            : (document as unknown as { webkitExitFullscreen?: () => Promise<void> }).webkitExitFullscreen?.()
          Promise.resolve(exit).catch((e) => { void e })
        }
      }
      setInternalSizeMode(newMode)
      try {
        localStorage.setItem(storageKey, newMode)
      } catch (e) {
        void e
      }
      onSizeModeChange?.(newMode)
    }
  }, [onSizeModeChange, storageKey])

  // Sync state if user exits browser native fullscreen using browser UI / Escape
  useEffect(() => {
    const handleFsChange = () => {
      const fsElement = document.fullscreenElement || (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement
      if (!fsElement) {
        if (currentSizeMode === 'fullscreen') {
          setInternalSizeMode('standard')
          try {
            localStorage.setItem(storageKey, 'standard')
          } catch (e) {
            void e
          }
          onSizeModeChange?.('standard')
        }
      } else if (fsElement === containerRef.current) {
        if (currentSizeMode !== 'fullscreen') {
          setInternalSizeMode('fullscreen')
          onSizeModeChange?.('fullscreen')
        }
      }
    }

    document.addEventListener('fullscreenchange', handleFsChange)
    document.addEventListener('webkitfullscreenchange', handleFsChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange)
      document.removeEventListener('webkitfullscreenchange', handleFsChange)
    }
  }, [currentSizeMode, onSizeModeChange, storageKey])

  // Support global Escape key to exit Expanded / Fullscreen mode smoothly
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (currentSizeMode === 'expanded' || currentSizeMode === 'fullscreen') {
          e.preventDefault()
          handleSetSizeMode('standard')
          setShowAwardPopover(false)
          setShowSearchDropdown(false)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentSizeMode, handleSetSizeMode])

  // Reconcile fish agents with roster changes outside of render
  useEffect(() => {
    const currentMap = agentsRef.current
    const total = students.length

    students.forEach((student, index) => {
      const existing = currentMap.get(student.id)
      if (existing) {
        existing.student = student
      } else {
        currentMap.set(student.id, createInitialAgent(student, index, total))
      }
    })

    const studentIds = new Set(students.map((s) => s.id))
    for (const id of currentMap.keys()) {
      if (!studentIds.has(id)) currentMap.delete(id)
    }
  }, [students])

  // Physics animation loop using direct DOM node styling for 60fps performance
  useEffect(() => {
    let animId: number
    let lastTime = performance.now()

    const loop = (now: number) => {
      const dt = Math.min(32, now - lastTime) / 16.666
      lastTime = now

      if (!paused) {
        agentsRef.current.forEach((agent) => {
          if (agent.turnCooldown > 0) agent.turnCooldown -= dt

          // Natural wander: slight random acceleration
          agent.vy += (Math.random() - 0.5) * 0.003 * dt
          agent.vx += (Math.random() - 0.48) * 0.002 * dt * agent.facing

          const minSpeed = 0.02 * agent.speedMult
          const maxSpeed = 0.09 * agent.speedMult
          const currentSpeedX = Math.abs(agent.vx)

          if (currentSpeedX < minSpeed) {
            agent.vx = agent.facing * minSpeed
          } else if (currentSpeedX > maxSpeed) {
            agent.vx = agent.facing * maxSpeed
          }

          agent.vy = Math.max(-0.04, Math.min(0.04, agent.vy))

          agent.x += agent.vx * dt
          agent.y += agent.vy * dt

          const minX = 6
          const maxX = 94
          const minY = 12
          const maxY = 82

          if (agent.x > maxX && agent.facing === 1) {
            agent.facing = -1
            agent.vx = -Math.abs(agent.vx)
            agent.turnCooldown = 30
          } else if (agent.x < minX && agent.facing === -1) {
            agent.facing = 1
            agent.vx = Math.abs(agent.vx)
            agent.turnCooldown = 30
          }

          if (agent.y > maxY) {
            agent.vy = -Math.abs(agent.vy) * 0.8 - 0.01
          } else if (agent.y < minY) {
            agent.vy = Math.abs(agent.vy) * 0.8 + 0.01
          }

          // Strict boundary clamping so window resizing or sudden layout changes never push fish out of bounds
          agent.x = Math.max(minX, Math.min(maxX, agent.x))
          agent.y = Math.max(minY, Math.min(maxY, agent.y))

          if (agent.turnCooldown <= 0 && Math.random() < 0.001 * dt) {
            agent.facing = agent.facing === 1 ? -1 : 1
            agent.vx = agent.facing * Math.abs(agent.vx)
            agent.turnCooldown = 120
          }

          // Direct DOM node update avoids virtual DOM overhead on every frame
          const node = fishNodesRef.current.get(agent.id)
          if (node) {
            node.style.left = `${agent.x}%`
            node.style.top = `${agent.y}%`
            const sprite = node.querySelector<HTMLElement>('.fish-sprite-wrapper')
            if (sprite) {
              sprite.style.transform = `scaleX(${agent.facing})`
            }
          }
        })
      }

      animId = requestAnimationFrame(loop)
    }

    animId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animId)
  }, [paused])

  // Active rewards map
  const activeRewards = useMemo(() => {
    return rewards.map((r) => ('reward' in r ? r.reward : 'coral'))
  }, [rewards])

  const hasBackgroundReward = activeRewards.includes('background')
  const hasCoralReward = activeRewards.includes('coral')
  const hasPlantsReward = activeRewards.includes('plants')
  const hasTreasureReward = activeRewards.includes('treasure')

  // Search filtering
  const trimmedSearch = search.trim().toLowerCase()
  const isSearching = trimmedSearch.length > 0
  const searchMatches = useMemo(() => {
    if (!isSearching) return []
    return students.filter(
      (s) =>
        (s.displayName || s.name).toLowerCase().includes(trimmedSearch) ||
        Boolean(s.fishName?.toLowerCase().includes(trimmedSearch))
    )
  }, [students, trimmedSearch, isSearching])

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setInternalSearch(val)
    onSearchChange?.(val)
    setShowSearchDropdown(Boolean(val.trim()))
  }

  const handleClearSearch = () => {
    setInternalSearch('')
    onSearchChange?.('')
    setShowSearchDropdown(false)
  }

  const isExpandedOrFs = currentSizeMode === 'expanded' || currentSizeMode === 'fullscreen'

  return (
    <div
      ref={containerRef}
      className={`aquarium-container ${isProjector ? 'is-projector' : ''} ${hasBackgroundReward ? 'celestial-lagoon' : ''} ${paused ? 'motion-paused' : ''} ${currentSizeMode === 'expanded' ? 'is-expanded' : ''} ${currentSizeMode === 'fullscreen' ? 'is-fullscreen' : ''}`}
      style={{
        minHeight: isExpandedOrFs ? '100vh' : typeof height === 'number' ? `${height}px` : height,
      }}
      aria-label="Interactive free-swimming class aquarium"
    >
      {/* 1. Deep Ocean & Lighting Environment */}
      <div className="tank-water" aria-hidden="true">
        {/* Soft Volumetric Light Rays */}
        <div className="sun-caustics" />
        <div className="sun-ray ray-1" />
        <div className="sun-ray ray-2" />
        <div className="sun-ray ray-3" />

        {/* Ambient Distant Depth Blur Layer */}
        <div className="deep-fog" />
      </div>

      {/* 2. Floating Ambient Bubbles */}
      <div className="bubbles-container" aria-hidden="true">
        {Array.from({ length: activeBubbleCount }).map((_, i) => (
          <span
            key={i}
            className={`bubble bubble-rand-${(i % 5) + 1}`}
            style={{
              left: `${(i * 100) / activeBubbleCount + ((i * 7) % 8)}%`,
              animationDelay: `-${(i * 1.7) % 8}s`,
              animationDuration: `${5 + ((i * 1.3) % 4)}s`,
              width: `${6 + ((i * 3) % 10)}px`,
              height: `${6 + ((i * 3) % 10)}px`,
            }}
          />
        ))}
      </div>

      {/* 3. Deep Background Aquatic Plants */}
      <div className="plants-layer deep-plants" aria-hidden="true">
        <div className="deep-kelp kelp-left" />
        <div className="deep-kelp kelp-mid" />
        <div className="deep-kelp kelp-right" />
      </div>

      {/* 4. Active Living Fish Agents */}
      <div className="fish-swim-chamber">
        {students.map((student, index) => {
          const isSelected = selectedIds.has(student.id)
          const isHovered = hoveredId === student.id
          const depth = getDeterministicDepth(student.id)
          const fish = getStudentCurrentFish(student)
          const hasGlow =
            glowsByStudent?.[student.id]?.[fish.collection] ?? Boolean(student.earnedGlows?.[fish.collection])

          // Search matches calculation
          const isMatch =
            !isSearching ||
            (student.displayName || student.name).toLowerCase().includes(trimmedSearch) ||
            Boolean(student.fishName?.toLowerCase().includes(trimmedSearch))

          // Determine label visibility based on mode
          const shouldShowLabel =
            labelMode === 'all' ||
            (labelMode === 'selected' && (isSelected || isHovered || (isSearching && isMatch))) ||
            (labelMode === 'none' && (isSelected || isHovered))

          // Depth styling
          const depthZ = isSelected ? 40 : isHovered ? 35 : isMatch && isSearching ? 30 : 10 + depth * 2
          const depthScale = 0.85 + (depth / 5) * 0.15
          const depthOpacity = 0.85 + (depth / 5) * 0.15

          return (
            <div
              key={student.id}
              ref={(el) => {
                if (el) {
                  fishNodesRef.current.set(student.id, el)
                  let agent = agentsRef.current.get(student.id)
                  if (!agent) {
                    agent = createInitialAgent(student, index, students.length)
                    agentsRef.current.set(student.id, agent)
                  }
                  el.style.left = `${agent.x}%`
                  el.style.top = `${agent.y}%`
                  const sprite = el.querySelector<HTMLElement>('.fish-sprite-wrapper')
                  if (sprite) {
                    sprite.style.transform = `scaleX(${agent.facing})`
                  }
                } else {
                  fishNodesRef.current.delete(student.id)
                }
              }}
              className={`swimming-fish-actor ${isSelected ? 'is-selected' : ''} ${isHovered ? 'is-hovered' : ''} ${isSearching && isMatch ? 'is-search-match' : ''} ${isSearching && !isMatch ? 'is-search-subdued' : ''}`}
              style={{
                zIndex: depthZ,
                opacity: depthOpacity,
                transform: `translate3d(-50%, -50%, 0) scale(${depthScale})`,
              }}
              onClick={() => onSelectStudent?.(student.id)}
              onMouseEnter={() => setHoveredId(student.id)}
              onMouseLeave={() => setHoveredId(null)}
              role="button"
              tabIndex={0}
              aria-label={`${student.displayName || student.name}, ${student.points} points, ${fish.name} (${fish.collection})`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelectStudent?.(student.id)
                }
              }}
            >
              {/* Fish Sprite with horizontal orientation flipped independent of text */}
              <div
                className="fish-sprite-wrapper"
                style={{
                  transition: 'transform 0.4s ease-out',
                }}
              >
                <FishIllustration
                  fish={fish}
                  points={student.points}
                  hasGlow={hasGlow}
                  isSwimming={!paused}
                  isReducedMotion={paused}
                  className={isSelected ? 'selected-glow' : ''}
                />
              </div>

              {/* Selection Aura Glow */}
              {isSelected && <div className="fish-selection-halo" aria-hidden="true" />}

              {/* Student Name & Points Label (NEVER mirrored) */}
              {shouldShowLabel && (
                <div
                  className={`fish-nameplate ${isSelected ? 'plate-selected' : ''}`}
                  style={{
                    transform: 'none', // Strict identity transform to prevent mirroring
                  }}
                >
                  <span className="student-name-text">{student.displayName || student.name}</span>
                  {showPoints && (
                    <span className="student-points-badge">
                      {student.points} <small>pts</small>
                    </span>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {students.length === 0 && (
          <div className="aquarium-empty-state">
            <span className="empty-bubble">◌</span>
            <h3>No fish in this tank yet</h3>
            <p>Add students to the class roster to populate your classroom aquarium.</p>
          </div>
        )}
      </div>

      {/* 5. Foreground Aquatic Plants & Rewards */}
      <div className="plants-layer foreground-plants" aria-hidden="true">
        <div className="fg-kelp kelp-1" />
        <div className="fg-kelp kelp-2" />
        <div className="fg-kelp kelp-3" />
        <div className="fg-kelp kelp-4" />
      </div>

      {/* 6. Unlocked Aquarium Rewards (Challenges) */}
      <div className="unlocked-decor-layer" aria-hidden="true">
        {hasCoralReward && (
          <div className="reward-item coral-reef" title="Unlocked: Living Coral Reef">
            <svg viewBox="0 0 100 80" className="decor-svg">
              <path
                d="M 20 80 C 15 50, 5 35, 12 25 C 18 15, 30 30, 32 45 C 35 25, 45 10, 52 18 C 60 26, 50 48, 55 55 C 65 35, 78 20, 85 28 C 92 36, 75 58, 80 80 Z"
                fill="#f43f5e"
                opacity="0.95"
              />
              <path
                d="M 35 80 C 32 60, 25 45, 32 38 C 38 32, 45 45, 48 55 C 55 40, 65 30, 70 38 C 76 46, 68 62, 70 80 Z"
                fill="#fb7185"
                opacity="0.8"
              />
            </svg>
          </div>
        )}

        {hasPlantsReward && (
          <div className="reward-item lush-flora" title="Unlocked: Lush Aquatic Plants">
            <svg viewBox="0 0 90 90" className="decor-svg">
              <path
                d="M 15 90 C 8 60, 2 30, 15 10 C 22 35, 30 65, 35 90 Z"
                fill="#10b981"
                opacity="0.9"
              />
              <path
                d="M 40 90 C 35 55, 38 25, 52 5 C 58 35, 52 65, 60 90 Z"
                fill="#34d399"
                opacity="0.85"
              />
              <path
                d="M 65 90 C 60 65, 70 40, 82 20 C 85 45, 78 70, 85 90 Z"
                fill="#059669"
                opacity="0.9"
              />
            </svg>
          </div>
        )}

        {hasTreasureReward && (
          <div className="reward-item sunken-chest" title="Unlocked: Sunken Treasure Chest">
            <svg viewBox="0 0 80 60" className="decor-svg">
              <rect x="10" y="25" width="60" height="30" rx="4" fill="#854d0e" />
              <path d="M 8 25 Q 40 10 72 25 Z" fill="#a16207" />
              <rect x="36" y="22" width="8" height="12" rx="2" fill="#facc15" />
              <circle cx="40" cy="28" r="1.5" fill="#713f12" />
              <line x1="12" y1="38" x2="68" y2="38" stroke="#ca8a04" strokeWidth="2.5" />
            </svg>
          </div>
        )}
      </div>

      {/* 7. Organic Textured Sand & Rock Bed */}
      <div className="tank-seabed" aria-hidden="true">
        <div className="rock-formation rock-left" />
        <div className="rock-formation rock-mid" />
        <div className="rock-formation rock-right" />
        <div className="sand-dune sand-back" />
        <div className="sand-dune sand-front" />
      </div>

      {/* 8. Floating Classroom Usability Toolbar & Size Controls */}
      <div className="aquarium-controls-overlay" role="toolbar" aria-label="Aquarium controls">
        {/* Left cluster: Size mode segmented pills, Exit button, and Compact Teacher tools */}
        <div className="controls-cluster-left">
          {/* Visible Exit Button (Expanded / Full Screen) */}
          {isExpandedOrFs && (
            <button
              type="button"
              className="exit-mode-btn"
              onClick={() => handleSetSizeMode('standard')}
              title="Return to standard side-by-side view (or press Escape)"
              aria-label="Exit expanded view"
            >
              ✕ Exit (Esc)
            </button>
          )}

          {/* Aquarium Size Mode Segmented Switcher */}
          <div className="mode-segmented-pill" role="group" aria-label="Aquarium display size">
            <button
              type="button"
              className={`mode-segmented-btn ${currentSizeMode === 'standard' ? 'is-active' : ''}`}
              onClick={() => handleSetSizeMode('standard')}
              title="Standard: aquarium beside teacher controls"
            >
              ⊟ Standard
            </button>

            <button
              type="button"
              className={`mode-segmented-btn ${currentSizeMode === 'expanded' ? 'is-active' : ''}`}
              onClick={() => handleSetSizeMode('expanded')}
              title="Expanded: fill available page width and height, collapsing sidebars"
            >
              ⛶ Expanded
            </button>

            <button
              type="button"
              className={`mode-segmented-btn ${currentSizeMode === 'fullscreen' ? 'is-active' : ''}`}
              onClick={() => handleSetSizeMode('fullscreen')}
              title="Full Screen: browser full screen for projectors and presentations"
            >
              🗖 Full Screen
            </button>
          </div>

          {/* Compact Student Search in Expanded / Full Screen */}
          {isExpandedOrFs && (
            <div className="floating-search-wrap">
              <input
                type="search"
                className="floating-search-input"
                placeholder="Search learners…"
                value={search}
                onChange={handleSearchInputChange}
                onFocus={() => {
                  if (search.trim()) setShowSearchDropdown(true)
                }}
                aria-label="Search students in aquarium"
              />
              {search && (
                <button
                  type="button"
                  className="floating-search-clear"
                  onClick={handleClearSearch}
                  aria-label="Clear search filter"
                >
                  ✕
                </button>
              )}

              {/* Quick Search Dropdown */}
              {showSearchDropdown && isSearching && (
                <div className="floating-search-dropdown" role="listbox">
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', fontSize: '11px', color: '#94a3b8' }}>
                    <span>{searchMatches.length} match{searchMatches.length === 1 ? '' : 'es'}</span>
                    {searchMatches.length > 0 && onSelectStudent && (
                      <button
                        type="button"
                        style={{ border: 0, background: 'transparent', color: '#38bdf8', fontSize: '11px', cursor: 'pointer', padding: 0 }}
                        onClick={() => {
                          searchMatches.forEach((s) => {
                            if (!selectedIds.has(s.id)) onSelectStudent(s.id)
                          })
                        }}
                      >
                        Select all
                      </button>
                    )}
                  </div>
                  {searchMatches.map((s) => {
                    const isSelected = selectedIds.has(s.id)
                    const fish = getStudentCurrentFish(s)
                    return (
                      <button
                        key={s.id}
                        type="button"
                        className={`floating-search-match-item ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => onSelectStudent?.(s.id)}
                      >
                        <div className="floating-search-match-info">
                          <strong>{s.displayName || s.name}</strong>
                          <small>{fish.name} · {s.points} pts</small>
                        </div>
                        <span style={{ fontSize: '11px', color: isSelected ? '#facc15' : '#94a3b8' }}>
                          {isSelected ? '✓ Selected' : '+ Select'}
                        </span>
                      </button>
                    )
                  })}
                  {searchMatches.length === 0 && (
                    <div style={{ padding: '10px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                      No matching learners found
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Quick Award CTA in Expanded / Full Screen */}
          {isExpandedOrFs && onAwardReason && (
            <button
              type="button"
              className="floating-award-btn"
              onClick={() => setShowAwardPopover(!showAwardPopover)}
              aria-expanded={showAwardPopover}
              title="Award points to selected learners"
            >
              ★ Award {selectedIds.size > 0 ? `(${selectedIds.size})` : 'points'}
            </button>
          )}
        </div>

        {/* Right cluster: Pause, Labels, Points, and Counter */}
        <div className="controls-cluster-right">
          <div className="control-pill-group">
            <button
              type="button"
              className={`tank-tool-btn ${paused ? 'is-active' : ''}`}
              onClick={() => setPaused(!paused)}
              title={paused ? 'Resume fish swimming motion' : 'Pause swimming motion for projection / focus'}
              aria-pressed={paused}
            >
              {paused ? '▶ Resume' : '⏸ Pause'}
            </button>

            <button
              type="button"
              className="tank-tool-btn"
              onClick={() =>
                setLabelMode((prev) => (prev === 'all' ? 'selected' : prev === 'selected' ? 'none' : 'all'))
              }
              title="Toggle student name label density"
            >
              Labels: {labelMode === 'all' ? 'All' : labelMode === 'selected' ? 'Selected' : 'Off'}
            </button>

            <button
              type="button"
              className={`tank-tool-btn ${showPoints ? 'is-active' : ''}`}
              onClick={() => setShowPoints(!showPoints)}
              title="Toggle points visibility"
              aria-pressed={showPoints}
            >
              Points: {showPoints ? 'On' : 'Off'}
            </button>
          </div>

          <div className="tank-legend">
            <span className="count-chip">
              <b>{students.length}</b> fish{selectedIds.size > 0 ? ` · ${selectedIds.size} selected` : ''}
              {selectedIds.size > 0 && onDeselectAll && (
                <button
                  type="button"
                  style={{ marginLeft: '6px', border: 0, background: 'transparent', color: '#f87171', cursor: 'pointer', fontWeight: 700 }}
                  onClick={onDeselectAll}
                  title="Deselect all"
                >
                  ✕
                </button>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* 9. Floating Quick Award Popover for Expanded & Fullscreen Modes */}
      {showAwardPopover && (
        <div className="floating-award-popover" role="dialog" aria-modal="true" aria-label="Award participation points">
          <div className="popover-header">
            <h4>
              ★ Award Points {selectedIds.size > 0 ? `to ${selectedIds.size} learner${selectedIds.size > 1 ? 's' : ''}` : ''}
            </h4>
            <button
              type="button"
              className="popover-close-btn"
              onClick={() => setShowAwardPopover(false)}
              aria-label="Close award popover"
            >
              ✕
            </button>
          </div>

          {selectedIds.size === 0 ? (
            <div className="popover-empty-hint">
              <p>No learners selected. Click any swimming fish or search above to select learners first.</p>
              {onSelectAll && (
                <button
                  type="button"
                  className="button secondary sm"
                  onClick={() => {
                    onSelectAll()
                  }}
                >
                  Select all {students.length} learners
                </button>
              )}
            </div>
          ) : (
            <div className="popover-reasons-grid">
              {reasons.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  className="popover-reason-btn"
                  disabled={saving}
                  onClick={async () => {
                    if (onAwardReason) {
                      await onAwardReason(r)
                      setAwardFeedback(`+${r.points} pts awarded! ✨`)
                      setTimeout(() => setAwardFeedback(null), 3000)
                    }
                    setShowAwardPopover(false)
                  }}
                >
                  <span className="reason-text">{r.label}</span>
                  <b className="reason-pts">+{r.points} pts</b>
                </button>
              ))}
            </div>
          )}

          {awardFeedback && (
            <div style={{ marginTop: '10px', textAlign: 'center', color: '#facc15', fontWeight: 700, fontSize: '12px' }}>
              {awardFeedback}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
