import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { AquariumView } from '../components/AquariumView'
import { HouseVisual } from '../components/HouseVisual'
import { watchActivities, watchActivityGroups } from '../services/activityService'
import { watchAwards } from '../services/awardService'
import { watchChallenges } from '../services/challengeService'
import { watchClasses } from '../services/classService'
import { watchStudents } from '../services/studentService'
import { computeClassMilestoneGlows } from '../domain/fishEvolution'
import type { ActivityGroup, AwardRecord, ClassChallenge, Enrollment, GroupActivity, TeacherClass } from '../types/domain'

export function ClassroomDisplay() {
  const { classId = '', mode = 'aquarium' } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [cls, setCls] = useState<TeacherClass>()
  const [students, setStudents] = useState<Enrollment[]>([])
  const [activities, setActivities] = useState<GroupActivity[]>([])
  const [groups, setGroups] = useState<ActivityGroup[]>([])
  const [challenges, setChallenges] = useState<ClassChallenge[]>([])
  const [awards, setAwards] = useState<AwardRecord[]>([])
  const [showPoints, setShowPoints] = useState(false)
  const [showNames, setShowNames] = useState(true)
  const [error, setError] = useState('')

  useEffect(
    () => (user ? watchClasses(user.uid, (items) => setCls(items.find((c) => c.id === classId)), (e) => setError(e.message)) : undefined),
    [user, classId]
  )
  useEffect(
    () => (user ? watchStudents(user.uid, classId, setStudents, (e) => setError(e.message)) : undefined),
    [user, classId]
  )
  useEffect(
    () => (user ? watchAwards(user.uid, classId, setAwards, (e) => setError(e.message)) : undefined),
    [user, classId]
  )
  useEffect(
    () => (user ? watchActivities(user.uid, classId, setActivities, (e) => setError(e.message)) : undefined),
    [user, classId]
  )
  useEffect(
    () => (user ? watchChallenges(user.uid, classId, setChallenges, (e) => setError(e.message)) : undefined),
    [user, classId]
  )

  const activeActivity = activities.find((a) => a.status === 'active')
  useEffect(() => {
    if (!user || !activeActivity) return
    return watchActivityGroups(user.uid, classId, activeActivity.id, setGroups, (e) => setError(e.message))
  }, [user, classId, activeActivity])

  // Global classroom shortcuts
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') navigate(`/app/classes/${classId}`)
      if (e.key === 'n' || e.key === 'N') setShowNames((prev) => !prev)
      if (e.key === 'p' || e.key === 'P') setShowPoints((prev) => !prev)
    }
    document.addEventListener('keydown', key)
    return () => document.removeEventListener('keydown', key)
  }, [navigate, classId])

  if (!cls) {
    return (
      <main className="route-state">
        <div className="loader" />
        <h1>Preparing classroom display…</h1>
      </main>
    )
  }

  const activeChallenge = challenges.find((c) => c.status === 'active')
  const rewards = challenges.filter((c) => c.rewardSelected && c.rewardActive)

  return (
    <main className={`class-display display-${mode} ${rewards.some((r) => r.reward === 'background') ? 'reward-background' : ''}`}>
      <header>
        <div>
          <span>Grow &amp; Build · Classroom display</span>
          <h1>{cls.name}</h1>
        </div>
        <div className="display-controls">
          <label>
            <input type="checkbox" checked={showNames} onChange={(e) => setShowNames(e.target.checked)} /> Names (N)
          </label>
          <label>
            <input type="checkbox" checked={showPoints} onChange={(e) => setShowPoints(e.target.checked)} /> Points (P)
          </label>
          <span title="Sound is disabled">🔇 Sound off</span>
          <button onClick={() => document.documentElement.requestFullscreen?.()}>Full screen</button>
          <Link to={`/app/classes/${classId}`}>Exit display</Link>
        </div>
      </header>

      <nav aria-label="Switch classroom display">
        <Link className={mode === 'aquarium' ? 'active' : ''} to={`/app/classes/${classId}/display/aquarium`}>
          Aquarium
        </Link>
        <Link className={mode === 'village' ? 'active' : ''} to={`/app/classes/${classId}/display/village`}>
          Group village
        </Link>
        <Link className={mode === 'challenge' ? 'active' : ''} to={`/app/classes/${classId}/display/challenge`}>
          Challenge
        </Link>
      </nav>

      {error && (
        <div className="display-empty" role="alert">
          <h2>Display could not update</h2>
          <p>{error}</p>
          <button onClick={() => location.reload()}>Retry</button>
        </div>
      )}

      {mode === 'aquarium' && (
        <AquariumDisplay
          students={students}
          cls={cls}
          showNames={showNames}
          showPoints={showPoints}
          rewards={rewards}
          awards={awards}
        />
      )}
      {mode === 'village' && (
        <VillageDisplay
          activity={activeActivity}
          groups={groups}
          students={students}
          showNames={showNames}
          showPoints={showPoints}
        />
      )}
      {mode === 'challenge' && <ChallengeDisplay challenge={activeChallenge} />}

      <footer>Press Esc to exit · Press N for names, P for points · Non-competitive classroom projector</footer>
    </main>
  )
}

function AquariumDisplay({
  students,
  cls,
  showNames,
  showPoints,
  rewards,
  awards,
}: {
  students: Enrollment[]
  cls: TeacherClass
  showNames: boolean
  showPoints: boolean
  rewards: ClassChallenge[]
  awards: AwardRecord[]
}) {
  if (!students.length) {
    return (
      <div className="display-empty">
        <h2>No fish to display yet</h2>
        <p>Add students from the class roster first.</p>
      </div>
    )
  }

  const { glowsByStudent } = computeClassMilestoneGlows(awards, [], students, 10)

  return (
    <section className="projector-aquarium" aria-label="Class aquarium" style={{ padding: '16px 24px', flex: 1, display: 'flex' }}>
      <AquariumView
        students={students}
        thresholds={cls.thresholds}
        rewards={rewards}
        glowsByStudent={glowsByStudent}
        showNames={showNames}
        showPoints={showPoints}
        isProjector={true}
        height="calc(100vh - 165px)"
        teacherId={cls.ownerId}
      />
    </section>
  )
}

function VillageDisplay({
  activity,
  groups,
  students,
  showNames,
  showPoints,
}: {
  activity?: GroupActivity
  groups: ActivityGroup[]
  students: Enrollment[]
  showNames: boolean
  showPoints: boolean
}) {
  if (!activity) {
    return (
      <div className="display-empty">
        <h2>No active group activity</h2>
        <p>Start an activity to show the group village.</p>
      </div>
    )
  }
  const name = (id: string) => students.find((s) => s.id === id)?.displayName || students.find((s) => s.id === id)?.name || 'Student'
  return (
    <section className="projector-village">
      <h2>{activity.title}</h2>
      <div>
        {groups.map((g) => (
          <article key={g.id}>
            <h3>{g.name}</h3>
            <HouseVisual points={g.points} thresholds={activity.houseThresholds} selections={g.decorationSelections} />
            {showPoints && <b>{g.points} building points</b>}
            {showNames && <p>{g.memberIds.map(name).join(' · ')}</p>}
          </article>
        ))}
      </div>
    </section>
  )
}

function ChallengeDisplay({ challenge }: { challenge?: ClassChallenge }) {
  if (!challenge) {
    return (
      <div className="display-empty">
        <h2>No active challenge</h2>
        <p>Create a shared class challenge to use this display.</p>
      </div>
    )
  }
  const percent = Math.min(100, Math.round((challenge.currentProgress / challenge.target) * 100))
  return (
    <section className="projector-challenge">
      <span>Shared class challenge</span>
      <h2>{challenge.title}</h2>
      <div className="challenge-orb">
        <strong>{challenge.currentProgress}</strong>
        <small>of {challenge.target}</small>
      </div>
      <div className="big-progress">
        <span style={{ width: `${percent}%` }} />
      </div>
      <p>{percent}% complete</p>
      <div className={challenge.rewardActive ? 'display-reward earned' : 'display-reward'}>
        <span>{challenge.reward === 'coral' ? '♨' : challenge.reward === 'plants' ? '♣' : challenge.reward === 'treasure' ? '▣' : '◒'}</span>
        <b>{challenge.rewardActive ? 'Reward unlocked!' : `Unlock: ${challenge.reward}`}</b>
      </div>
    </section>
  )
}
