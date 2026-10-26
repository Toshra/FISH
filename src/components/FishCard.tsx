import { FishIllustration } from './FishIllustration'
import { getStudentCurrentFish } from '../domain/fishEvolution'
import { getGrowthProgress } from '../domain/growth'
import type { Enrollment, GrowthThreshold } from '../types/domain'

export function FishCard({
  student,
  thresholds,
  selected,
  onSelect,
}: {
  student: Enrollment
  thresholds: GrowthThreshold[]
  selected: boolean
  onSelect: () => void
}) {
  const growth = getGrowthProgress(student.points, thresholds)
  const fish = getStudentCurrentFish(student)
  const hasGlow = Boolean(student.earnedGlows?.[fish.collection])

  return (
    <button
      className={`student-fish-card collection-${fish.collection} ${selected ? 'selected' : ''}`}
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
    >
      <span className="select-dot">{selected ? '✓' : ''}</span>
      <div style={{ margin: '10px auto', display: 'flex', justifyContent: 'center' }}>
        <FishIllustration fish={fish} points={student.points} hasGlow={hasGlow} width={80} height={50} isSwimming={true} />
      </div>
      <strong>{student.displayName || student.name}</strong>
      <small>
        {student.fishName ? `${student.fishName} · ` : ''}
        {fish.name} ({fish.collection})
      </small>
      <div className="fish-points">
        <b>{student.points}</b> points
      </div>
      <div
        className="student-progress"
        aria-label={growth.next ? `${growth.percent}% toward ${growth.next.label}` : 'Highest growth stage reached'}
      >
        <span style={{ width: `${growth.percent}%` }} />
      </div>
      <em>{growth.next ? `${growth.next.points - student.points} to ${growth.next.label}` : 'Mythical milestone reached'}</em>
    </button>
  )
}
