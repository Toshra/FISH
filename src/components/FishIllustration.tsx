import { memo } from 'react'
import type { FishDefinition } from '../domain/fishEvolution'
import { getContinuousFishScale, MILESTONES } from '../domain/fishEvolution'

interface FishIllustrationProps {
  fish: FishDefinition
  points: number
  hasGlow?: boolean
  isSwimming?: boolean
  isReducedMotion?: boolean
  className?: string
  width?: number
  height?: number
}

export const FishIllustration = memo(function FishIllustration({
  fish,
  points,
  hasGlow = false,
  isSwimming = true,
  isReducedMotion = false,
  className = '',
  width = 110,
  height = 70,
}: FishIllustrationProps) {
  const continuousScale = getContinuousFishScale(points)
  const milestoneMeta = MILESTONES[fish.collection]

  return (
    <div
      className={`ornamental-fish-wrap collection-${fish.collection} ${isSwimming && !isReducedMotion ? 'swimming' : ''} ${className}`}
      style={{
        transform: `scale(${continuousScale})`,
        transformOrigin: 'center center',
      }}
      data-fish-id={fish.id}
      data-milestone={fish.collection}
      data-points={points}
    >
      {/* 1. Separate Evolution Glow Effect */}
      {hasGlow && (
        <div
          className={`evolution-glow-effect glow-${fish.collection} ${isReducedMotion ? 'static-halo' : 'animated-aura'}`}
          aria-hidden="true"
          title={`Earned ${milestoneMeta.glowName} glow`}
        >
          {fish.collection === 'magical' && !isReducedMotion && (
            <span className="sparkle-orbit" />
          )}
        </div>
      )}

      {/* 2. Realistic Fish Sprite Image with transparent background */}
      <img
        src={fish.imagePath}
        alt={fish.name}
        className={`realistic-fish-img fish-${fish.id}`}
        draggable={false}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          objectFit: 'contain',
          filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.28))',
        }}
      />
    </div>
  )
})
