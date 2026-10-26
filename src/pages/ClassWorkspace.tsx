import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { AquariumView, type AquariumSizeMode } from '../components/AquariumView'
import { FishIllustration } from '../components/FishIllustration'
import { Modal } from '../components/Modal'
import { getErrorMessage } from '../lib/errors'
import {
  computeClassMilestoneGlows,
  generateEvolutionRepairPreview,
  getFishDefinition,
  getMilestoneForPoints,
  getStudentCurrentFish,
  MILESTONES,
  MILESTONE_ORDER,
  type EvolutionRepairPreview,
} from '../domain/fishEvolution'
import { awardStudents, createRequestId, reverseAward, watchAwards } from '../services/awardService'
import { watchClasses } from '../services/classService'
import { watchChallenges } from '../services/challengeService'
import { addStudent, addStudents, updateStudent, updateStudentEvolutions, watchStudents } from '../services/studentService'
import type { AwardReason, AwardRecord, ClassChallenge, Enrollment, TeacherClass } from '../types/domain'

type Tab = 'aquarium' | 'students' | 'history' | 'settings'

export function ClassWorkspace() {
  const { classId = '' } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeClass, setActiveClass] = useState<TeacherClass>()
  const [students, setStudents] = useState<Enrollment[]>([])
  const [awards, setAwards] = useState<AwardRecord[]>([])
  const [challenges, setChallenges] = useState<ClassChallenge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<Tab>('aquarium')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [dialog, setDialog] = useState<'add' | 'paste' | 'edit' | 'award' | 'history-detail' | null>(null)
  const [editing, setEditing] = useState<Enrollment>()
  const [pasteNames, setPasteNames] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [evolutionToast, setEvolutionToast] = useState<string | null>(null)
  const [repairPreviewData, setRepairPreviewData] = useState<EvolutionRepairPreview | null>(null)
  const [showRepairModal, setShowRepairModal] = useState(false)
  const [repairNotice, setRepairNotice] = useState<string | null>(null)

  const pendingRepairs = useMemo(
    () => generateEvolutionRepairPreview(students, { reRandomizeLegacyDefaults: true }),
    [students]
  )

  const [sizeMode, setSizeMode] = useState<AquariumSizeMode>(() => {
    if (typeof window === 'undefined') return 'standard'
    const key = user ? `aquarium_size_mode_${user.uid}` : 'aquarium_size_mode'
    const saved = localStorage.getItem(key)
    if (saved === 'fullscreen' || saved === 'expanded') return 'expanded'
    return 'standard'
  })

  useEffect(() => {
    if (!user) return
    const off = watchClasses(
      user.uid,
      (items) => {
        const found = items.find((c) => c.id === classId)
        if (!found) {
          navigate('/app', { replace: true })
          return
        }
        setActiveClass(found)
        setLoading(false)
      },
      (e) => {
        setError(getErrorMessage(e))
        setLoading(false)
      }
    )
    return off
  }, [user, classId, navigate])

  useEffect(() => {
    if (!user || !classId) return
    return watchStudents(user.uid, classId, setStudents, (e) => setError(getErrorMessage(e)))
  }, [user, classId])

  useEffect(() => {
    if (!user || !classId) return
    return watchAwards(user.uid, classId, setAwards, (e) => setError(getErrorMessage(e)))
  }, [user, classId])

  useEffect(() => {
    if (!user || !classId) return
    return watchChallenges(user.uid, classId, setChallenges, (e) => setError(getErrorMessage(e)))
  }, [user, classId])

  // Calculate per-class milestone glows authoritatively from award history
  const milestoneGlowData = useMemo(() => {
    return computeClassMilestoneGlows(awards, [], students, 10)
  }, [awards, students])

  const activeChallenge = challenges.find((c) => c.status === 'active')
  const rewards = challenges.filter((c) => c.rewardSelected && c.rewardActive)
  const filtered = useMemo(
    () =>
      students.filter((s) =>
        `${s.name} ${s.displayName} ${s.fishName}`.toLowerCase().includes(search.toLowerCase())
      ),
    [students, search]
  )

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const saveStudent = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    setError('')
    const d = new FormData(e.currentTarget)
    try {
      if (editing)
        await updateStudent(user.uid, classId, editing.id, {
          name: String(d.get('name')),
          displayName: String(d.get('displayName')),
          fishName: String(d.get('fishName')),
        })
      else
        await addStudent(user.uid, classId, String(d.get('name')), String(d.get('fishName')))
      setDialog(null)
      setEditing(undefined)
    } catch (x) {
      setError(getErrorMessage(x))
    } finally {
      setSaving(false)
    }
  }

  const previewPaste = (value: string) =>
    setPasteNames(value.split(/\r?\n/).map((n) => n.trim()).filter(Boolean))

  const confirmPaste = async () => {
    if (!user) return
    setSaving(true)
    try {
      await addStudents(user.uid, classId, pasteNames)
      setDialog(null)
      setPasteNames([])
    } catch (x) {
      setError(getErrorMessage(x))
    } finally {
      setSaving(false)
    }
  }

  const giveAward = async (reason: AwardReason) => {
    if (!user || saving) return
    setSaving(true)
    setError('')

    const awardedStudents = students.filter((s) => selected.has(s.id))
    const prevMilestones = new Map(awardedStudents.map((s) => [s.id, getMilestoneForPoints(s.points)]))

    try {
      await awardStudents(user.uid, classId, [...selected], reason, createRequestId())
      setSelected(new Set())
      setDialog(null)

      // Check if any recipient crossed a milestone
      const celebrations: string[] = []
      awardedStudents.forEach((st) => {
        const prevM = prevMilestones.get(st.id) || 'starter'
        const nextM = getMilestoneForPoints(st.points + reason.points)
        if (prevM !== nextM) {
          const nextFish = getStudentCurrentFish({ ...st, points: st.points + reason.points })
          celebrations.push(`${st.displayName || st.name} evolved into ${nextFish.name} (${MILESTONES[nextM].label})`)
        }
      })
      if (celebrations.length) {
        setEvolutionToast(`🎉 Evolution Milestone! ${celebrations.join(' · ')}`)
        setTimeout(() => setEvolutionToast(null), 6500)
      }
    } catch (x) {
      setError(getErrorMessage(x))
    } finally {
      setSaving(false)
    }
  }

  const undo = async (id: string) => {
    if (!user || saving) return
    setSaving(true)
    try {
      await reverseAward(user.uid, classId, id)
    } catch (x) {
      setError(getErrorMessage(x))
    } finally {
      setSaving(false)
    }
  }

  const handleOpenRepairPreview = () => {
    const preview = generateEvolutionRepairPreview(students, { reRandomizeLegacyDefaults: true })
    setRepairPreviewData(preview)
    setShowRepairModal(true)
  }

  const handleApplyRepairs = async () => {
    if (!user || !repairPreviewData || repairPreviewData.totalRepairsCount === 0) return
    setSaving(true)
    setError('')
    try {
      const updates = Object.entries(repairPreviewData.proposedHistories).map(([studentId, evolutionHistory]) => ({
        studentId,
        evolutionHistory,
      }))
      await updateStudentEvolutions(user.uid, classId, updates)
      setRepairNotice(`Successfully updated ${updates.length} student record(s) with independent random evolutions.`)
      setShowRepairModal(false)
      setRepairPreviewData(null)
    } catch (x) {
      setError(getErrorMessage(x))
    } finally {
      setSaving(false)
    }
  }

  if (loading || !activeClass)
    return (
      <div className="state">
        <div className="loader" />
        <p>Loading this class aquarium…</p>
      </div>
    )

  const archived = Boolean(activeClass.archivedAt)

  return (
    <>
      <header className="workspace-header">
        <div>
          <Link to="/app">← All classes</Link>
          <span className="eyebrow">{archived ? 'Archived class' : 'Active class'}</span>
          <h1>{activeClass.name}</h1>
          <p>
            {[activeClass.subject, activeClass.grade].filter(Boolean).join(' · ') || 'Class aquarium'} ·{' '}
            {students.length} learners
          </p>
        </div>
        <div className="header-actions">
          {activeChallenge && (
            <Link to={`/app/classes/${classId}/challenges`} className="active-challenge-pill" title="View class challenge">
              <span>✦ {activeChallenge.title}</span>
              <small>({activeChallenge.currentProgress}/{activeChallenge.target})</small>
            </Link>
          )}
          {archived && <span className="archive-badge">Read only until restored</span>}
        </div>
      </header>

      {/* Non-blocking Evolution Toast Banner */}
      {evolutionToast && (
        <div className="evolution-toast-banner" role="status">
          <span className="evolution-toast-icon">✨</span>
          <div className="evolution-toast-body">{evolutionToast}</div>
          <button
            type="button"
            className="toast-close-btn"
            onClick={() => setEvolutionToast(null)}
            style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Evolution Repair Success Notice */}
      {repairNotice && (
        <div
          className="alert success"
          role="status"
          style={{
            margin: '8px 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#ecfdf5',
            border: '1px solid #a7f3d0',
            color: '#065f46',
            borderRadius: '8px',
            padding: '10px 14px',
          }}
        >
          <span>✓ {repairNotice}</span>
          <button
            type="button"
            onClick={() => setRepairNotice(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#065f46' }}
            title="Dismiss notice"
          >
            ✕
          </button>
        </div>
      )}

      {/* Evolution Integrity Audit Notice */}
      {pendingRepairs.totalRepairsCount > 0 && (
        <div
          className="alert"
          role="status"
          style={{
            margin: '8px 0',
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            color: '#1e40af',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderRadius: '8px',
            padding: '10px 14px',
          }}
        >
          <div>
            <strong>⚠️ Evolution Audit Notice:</strong> {pendingRepairs.affectedStudentsCount} student(s) have unassigned or legacy uniform evolutions ({pendingRepairs.totalRepairsCount} milestone records affected).
          </div>
          <button
            type="button"
            className="button sm primary"
            onClick={handleOpenRepairPreview}
            style={{ whiteSpace: 'nowrap', marginLeft: '12px' }}
          >
            Review Repair Preview
          </button>
        </div>
      )}

      <nav className="workspace-tabs" aria-label="Class workspace">
        {(['aquarium', 'students', 'history', 'settings'] as Tab[]).map((item) => (
          <button className={tab === item ? 'active' : ''} onClick={() => setTab(item)} key={item}>
            {item === 'history' ? 'Award history' : item[0].toUpperCase() + item.slice(1)}
          </button>
        ))}
        <Link className="workspace-tab-link" to={`/app/classes/${classId}/activities`}>
          Group activities
        </Link>
        <Link className="workspace-tab-link" to={`/app/classes/${classId}/challenges`}>
          Challenges
        </Link>
        <Link className="workspace-tab-link highlight-display" to={`/app/classes/${classId}/display/aquarium`}>
          🖥 Open display
        </Link>
      </nav>

      {error && (
        <div className="alert error" role="alert">
          {error}
        </div>
      )}

      {tab === 'aquarium' && (
        <>
          <div className="workspace-toolbar">
            <span className="badge">
              <b>{students.length}</b> fish swimming · 5-Fish Working Sample Pool Active
            </span>
            <div className="toolbar-actions">
              <button
                className="button secondary sm"
                disabled={archived || students.length === 0}
                onClick={() => setSelected(new Set(students.map((s) => s.id)))}
              >
                Select all
              </button>
              <button
                className="button secondary sm"
                disabled={selected.size === 0}
                onClick={() => setSelected(new Set())}
              >
                Deselect
              </button>
            </div>
          </div>

          <div className={`workspace-aquarium-layout size-mode-${sizeMode}`}>
            <div className="aquarium-main-stage">
              <AquariumView
                students={students}
                thresholds={activeClass.thresholds}
                selectedIds={selected}
                onSelectStudent={toggle}
                rewards={rewards}
                glowsByStudent={milestoneGlowData.glowsByStudent}
                height={580}
                sizeMode={sizeMode}
                onSizeModeChange={setSizeMode}
                reasons={activeClass.reasons}
                onAwardReason={giveAward}
                saving={saving}
                searchQuery={search}
                onSearchChange={setSearch}
                onSelectAll={() => setSelected(new Set(students.map((s) => s.id)))}
                onDeselectAll={() => setSelected(new Set())}
                teacherId={user?.uid}
              />
            </div>

            {sizeMode === 'standard' && (
              <aside className="aquarium-roster-sidebar" aria-label="Class roster quick selection">
                <div className="roster-sidebar-header">
                <h3>Students</h3>
                <span className="roster-count">{selected.size > 0 ? `${selected.size} selected` : `${students.length} total`}</span>
              </div>

              <div className="roster-search-box">
                <input
                  type="search"
                  placeholder="Search students…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Filter students in roster"
                />
              </div>

              <div className="roster-quick-actions">
                <button
                  className="button award-cta-btn"
                  disabled={archived || selected.size === 0 || saving}
                  onClick={() => setDialog('award')}
                >
                  ★ Award {selected.size > 0 ? `(${selected.size})` : 'points'}
                </button>
              </div>

              {/* Single Selected Student Spotlight */}
              {selected.size === 1 &&
                (() => {
                  const singleId = Array.from(selected)[0]
                  const singleStudent = students.find((s) => s.id === singleId)
                  if (!singleStudent) return null
                  const fish = getStudentCurrentFish(singleStudent)
                  const hasGlow = Boolean(milestoneGlowData.glowsByStudent[singleStudent.id]?.[fish.collection])
                  const meta = MILESTONES[fish.collection]

                  return (
                    <div className="student-spotlight-card">
                      <div className="spotlight-fish-art">
                        <FishIllustration
                          fish={fish}
                          points={singleStudent.points}
                          hasGlow={hasGlow}
                          width={60}
                          height={38}
                          isSwimming={false}
                        />
                      </div>
                      <div className="spotlight-info">
                        <strong>{singleStudent.displayName || singleStudent.name}</strong>
                        <small>
                          {fish.name} · {meta.label} ({singleStudent.points} pts)
                        </small>
                        {hasGlow && (
                          <span
                            className="glow-earned-chip"
                            style={{
                              display: 'inline-block',
                              fontSize: '10px',
                              color: meta.glowColor,
                              fontWeight: 700,
                              marginTop: '2px',
                            }}
                          >
                            ★ {meta.glowName} Earned
                          </span>
                        )}
                      </div>
                      <div className="spotlight-points">
                        <button
                          type="button"
                          className="button sm secondary"
                          style={{ fontSize: '10px', padding: '3px 6px' }}
                          onClick={() => setDialog('history-detail')}
                        >
                          History
                        </button>
                      </div>
                    </div>
                  )
                })()}

              <div className="roster-student-list" role="list">
                {filtered.map((s) => {
                  const isSel = selected.has(s.id)
                  const fish = getStudentCurrentFish(s)
                  const hasGlow = Boolean(milestoneGlowData.glowsByStudent[s.id]?.[fish.collection])
                  return (
                    <button
                      key={s.id}
                      type="button"
                      className={`roster-student-item ${isSel ? 'is-selected' : ''}`}
                      onClick={() => toggle(s.id)}
                    >
                      <div className="roster-fish-preview">
                        <FishIllustration
                          fish={fish}
                          points={s.points}
                          hasGlow={hasGlow}
                          width={38}
                          height={24}
                          isSwimming={false}
                        />
                      </div>
                      <div className="roster-student-info">
                        <strong>{s.displayName || s.name}</strong>
                        <small>
                          {fish.name} ({s.points} pts)
                          {hasGlow && ' ★'}
                        </small>
                      </div>
                      <div className="roster-student-points">
                        <b>{s.points}</b>
                        <small>pts</small>
                      </div>
                      <span className="roster-check">{isSel ? '✓' : '+'}</span>
                    </button>
                  )
                })}
                {filtered.length === 0 && (
                  <p style={{ textAlign: 'center', color: '#64748b', fontSize: '12px', padding: '16px' }}>
                    No students match "{search}"
                  </p>
                )}
              </div>
            </aside>
          )}
          </div>
        </>
      )}

      {tab === 'students' && (
        <section aria-label="Student roster management">
          <div className="table-actions">
            <button className="button primary" disabled={archived} onClick={() => setDialog('add')}>
              + Add student
            </button>
            <button className="button secondary" disabled={archived} onClick={() => setDialog('paste')}>
              Paste roster
            </button>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Current fish</th>
                  <th>Collection</th>
                  <th>Points</th>
                  <th>Glows earned</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const fish = getStudentCurrentFish(s)
                  const earnedGlows = MILESTONE_ORDER.filter(
                    (m) => m !== 'starter' && milestoneGlowData.glowsByStudent[s.id]?.[m]
                  ).map((m) => MILESTONES[m].glowName)

                  return (
                    <tr key={s.id}>
                      <td>
                        <strong>{s.name}</strong>
                        {s.displayName !== s.name && <small> ({s.displayName})</small>}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <FishIllustration fish={fish} points={s.points} width={34} height={22} isSwimming={false} />
                          <span>{fish.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`milestone-tag tag-${fish.collection}`}>{MILESTONES[fish.collection].label}</span>
                      </td>
                      <td>
                        <b>{s.points}</b>
                      </td>
                      <td>
                        {earnedGlows.length > 0 ? (
                          <span style={{ color: '#0284c7', fontSize: '12px' }}>★ {earnedGlows.join(', ')}</span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontSize: '12px' }}>—</span>
                        )}
                      </td>
                      <td>
                        <button
                          className="button sm secondary"
                          disabled={archived}
                          onClick={() => {
                            setEditing(s)
                            setDialog('edit')
                          }}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'history' && (
        <section aria-label="Award history ledger">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Student</th>
                  <th>Reason</th>
                  <th>Points</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {awards.map((a) => (
                  <tr key={a.id} className={a.reversedBy ? 'reversed-row' : ''}>
                    <td>{a.createdAt?.toDate ? a.createdAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent'}</td>
                    <td>{a.recipientName}</td>
                    <td>{a.reasonLabel}</td>
                    <td>+{a.amount}</td>
                    <td>
                      {!a.reversedBy && (
                        <button className="button sm danger" disabled={archived || saving} onClick={() => undo(a.id)}>
                          Undo
                        </button>
                      )}
                      {a.reversedBy && <small style={{ color: '#ef4444' }}>Undone</small>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {tab === 'settings' && (
        <section aria-label="Classroom and milestone settings">
          <div className="settings-card" style={{ padding: '20px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3>Fish Evolution Milestones</h3>
            <p style={{ color: '#64748b', fontSize: '14px' }}>
              Every student starts with the tiny Starter Goldfish. Individual participation points continuously grow visual size and unlock permanent random evolutions at configured milestones.
            </p>
            <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              {MILESTONE_ORDER.map((m) => {
                const meta = MILESTONES[m]
                const qualifiers = milestoneGlowData.qualifiersByMilestone[m] || []
                return (
                  <div key={m} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    <strong>{meta.label} Milestone</strong>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                      Threshold: <b>{meta.points} points</b>
                    </div>
                    {m !== 'starter' && (
                      <div style={{ fontSize: '12px', color: '#0369a1', marginTop: '4px' }}>
                        Glow: <b>{meta.glowName}</b> ({qualifiers.length}/10 earned)
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="settings-card" style={{ marginTop: '20px', padding: '20px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3>Evolution Randomization & Integrity Audit</h3>
                <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
                  All 40 unique species (10 Natural, 10 Rare, 10 Magical, 10 Mythical) are verified and active.
                  Each student receives an independent random roll when reaching milestones.
                </p>
              </div>
              <button
                type="button"
                className="button secondary sm"
                onClick={handleOpenRepairPreview}
              >
                Inspect Repair Preview
              </button>
            </div>

            <div style={{ marginTop: '14px', padding: '12px', borderRadius: '8px', background: pendingRepairs.totalRepairsCount > 0 ? '#fef3c7' : '#f0fdf4', border: `1px solid ${pendingRepairs.totalRepairsCount > 0 ? '#fde68a' : '#bbf7d0'}` }}>
              {pendingRepairs.totalRepairsCount > 0 ? (
                <div style={{ color: '#92400e', fontSize: '13px' }}>
                  <strong>Audit status:</strong> {pendingRepairs.affectedStudentsCount} student(s) have unassigned or legacy uniform evolutions ({pendingRepairs.totalRepairsCount} milestone records affected).
                  Click "Inspect Repair Preview" above to examine proposed independent replacements before committing changes.
                </div>
              ) : (
                <div style={{ color: '#166534', fontSize: '13px' }}>
                  <strong>Audit status:</strong> All student records have verified independent random evolutions saved. No legacy uniform defaults or missing records detected.
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Evolution History Modal */}
      {dialog === 'history-detail' && selected.size === 1 && (() => {
        const singleId = Array.from(selected)[0]
        const student = students.find((s) => s.id === singleId)
        if (!student) return null
        const currentFish = getStudentCurrentFish(student)

        return (
          <Modal title={`Evolution History · ${student.displayName || student.name}`} onClose={() => setDialog(null)}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px', padding: '12px', background: '#f0f9ff', borderRadius: '10px' }}>
                <FishIllustration fish={currentFish} points={student.points} hasGlow={Boolean(milestoneGlowData.glowsByStudent[student.id]?.[currentFish.collection])} width={75} height={48} isSwimming={false} />
                <div>
                  <h4 style={{ margin: 0 }}>Current: {currentFish.name}</h4>
                  <small style={{ color: '#0369a1' }}>
                    {MILESTONES[currentFish.collection].label} collection · {student.points} total participation points
                  </small>
                </div>
              </div>

              <h4>Milestone Progression</h4>
              <div className="evolution-history-grid">
                {MILESTONE_ORDER.map((m) => {
                  const meta = MILESTONES[m]
                  const isUnlocked = student.points >= meta.points
                  const hasGlow = Boolean(milestoneGlowData.glowsByStudent[student.id]?.[m])
                  const savedId = student.evolutionHistory?.[m]
                  const fishDef = savedId
                    ? getFishDefinition(savedId)
                    : isUnlocked
                    ? (m === 'starter' ? getFishDefinition('starter') : getStudentCurrentFish(student).collection === m ? getStudentCurrentFish(student) : null)
                    : null

                  return (
                    <div
                      key={m}
                      className={`evolution-milestone-chip ${isUnlocked ? 'is-unlocked' : ''} ${hasGlow ? 'has-glow' : ''}`}
                    >
                      <span style={{ fontWeight: 700, color: '#334155' }}>{meta.label}</span>
                      <small style={{ color: '#64748b' }}>{meta.points} pts</small>
                      {fishDef && isUnlocked ? (
                        <>
                          <div style={{ margin: '6px 0' }}>
                            <img src={fishDef.imagePath} alt={fishDef.name} style={{ width: '40px', height: '24px', objectFit: 'contain' }} />
                          </div>
                          <b>{fishDef.name}</b>
                          {hasGlow && (
                            <span style={{ color: meta.glowColor, fontWeight: 700, fontSize: '10px', marginTop: '2px' }}>
                              ★ {meta.glowName}
                            </span>
                          )}
                        </>
                      ) : (
                        <span style={{ color: '#94a3b8', margin: '14px 0' }}>Locked</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </Modal>
        )
      })()}

      {dialog === 'award' && (
        <Modal title={`Award points to ${selected.size} selected learners`} onClose={() => setDialog(null)}>
          <div className="modal-award-reasons">
            {activeClass.reasons.map((r) => (
              <button
                key={r.id}
                className="award-reason-btn"
                disabled={saving}
                onClick={() => giveAward(r)}
              >
                <span>{r.label}</span>
                <b>+{r.points} pts</b>
              </button>
            ))}
          </div>
        </Modal>
      )}

      {dialog === 'add' && (
        <Modal title="Add student to class" onClose={() => setDialog(null)}>
          <form onSubmit={saveStudent}>
            <label>
              Student full name
              <input name="name" required placeholder="e.g. Maria Santos" autoFocus />
            </label>
            <label>
              Fish nickname (optional)
              <input name="fishName" placeholder="e.g. Finny" />
            </label>
            <button className="button primary" disabled={saving}>
              {saving ? 'Adding…' : 'Add student'}
            </button>
          </form>
        </Modal>
      )}

      {dialog === 'edit' && editing && (
        <Modal title="Edit student" onClose={() => { setDialog(null); setEditing(undefined) }}>
          <form onSubmit={saveStudent}>
            <label>
              Full name
              <input name="name" defaultValue={editing.name} required />
            </label>
            <label>
              Display name
              <input name="displayName" defaultValue={editing.displayName || editing.name} required />
            </label>
            <label>
              Fish nickname
              <input name="fishName" defaultValue={editing.fishName} />
            </label>
            <button className="button primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </Modal>
      )}

      {dialog === 'paste' && (
        <Modal title="Paste student roster" onClose={() => setDialog(null)}>
          <div>
            <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '8px' }}>
              Paste student names below (one name per line).
            </p>
            <textarea
              rows={6}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              onChange={(e) => previewPaste(e.target.value)}
              placeholder="Juan Dela Cruz&#10;Maria Santos&#10;Sam Cruz"
            />
            {pasteNames.length > 0 && (
              <p style={{ margin: '8px 0', fontSize: '13px' }}>
                Found <b>{pasteNames.length}</b> students ready to import.
              </p>
            )}
            <button className="button primary" disabled={saving || pasteNames.length === 0} onClick={confirmPaste}>
              {saving ? 'Importing…' : `Import ${pasteNames.length} students`}
            </button>
          </div>
        </Modal>
      )}

      {/* Non-Destructive Evolution Repair Preview Modal */}
      {showRepairModal && repairPreviewData && (
        <Modal
          title="Evolution Repair Preview"
          onClose={() => {
            if (!saving) setShowRepairModal(false)
          }}
        >
          <div style={{ maxWidth: '680px' }}>
            <p style={{ color: '#475569', fontSize: '14px', marginBottom: '12px', lineHeight: 1.5 }}>
              Review affected student records and proposed independent fish selections before committing changes.
              In accordance with system requirements, <strong>existing saved evolutions are never silently rerolled</strong>.
              Each repair independently draws from the 10 designs in the corresponding collection.
            </p>

            {repairPreviewData.items.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <p style={{ margin: 0, color: '#166534', fontWeight: 600 }}>
                  ✓ All active students already possess verified independent random evolutions.
                </p>
                <small style={{ color: '#64748b' }}>No repair actions required.</small>
              </div>
            ) : (
              <div style={{ maxHeight: '380px', overflowY: 'auto', border: '1px solid #cbd5e1', borderRadius: '8px', marginBottom: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                      <th style={{ padding: '8px 12px' }}>Student</th>
                      <th style={{ padding: '8px 12px' }}>Milestone</th>
                      <th style={{ padding: '8px 12px' }}>Current Saved</th>
                      <th style={{ padding: '8px 12px' }}>Proposed Correction</th>
                      <th style={{ padding: '8px 12px' }}>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {repairPreviewData.items.map((item, idx) => (
                      <tr key={`${item.studentId}-${item.milestone}-${idx}`} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '8px 12px', fontWeight: 600 }}>{item.studentName}</td>
                        <td style={{ padding: '8px 12px' }}>
                          <span className={`milestone-tag tag-${item.milestone}`}>
                            {MILESTONES[item.milestone].label}
                          </span>
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <img
                              src={item.currentImagePath}
                              alt={item.currentFishName}
                              style={{ width: '28px', height: '18px', objectFit: 'contain' }}
                            />
                            <span>{item.currentFishName}</span>
                          </div>
                        </td>
                        <td style={{ padding: '8px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0369a1', fontWeight: 600 }}>
                            <img
                              src={item.proposedImagePath}
                              alt={item.proposedFishName}
                              style={{ width: '28px', height: '18px', objectFit: 'contain' }}
                            />
                            <span>{item.proposedFishName} ({item.proposedFishId})</span>
                          </div>
                        </td>
                        <td style={{ padding: '8px 12px', fontSize: '12px' }}>
                          {item.isMissing ? (
                            <span style={{ color: '#b91c1c' }}>Missing Record</span>
                          ) : (
                            <span style={{ color: '#d97706' }}>Legacy Uniform Default</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button
                type="button"
                className="button secondary"
                disabled={saving}
                onClick={() => setShowRepairModal(false)}
              >
                Cancel
              </button>
              {repairPreviewData.items.length > 0 && (
                <button
                  type="button"
                  className="button primary"
                  disabled={saving}
                  onClick={handleApplyRepairs}
                >
                  {saving ? 'Applying Corrections…' : `Confirm & Apply ${repairPreviewData.totalRepairsCount} Evolution(s)`}
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
