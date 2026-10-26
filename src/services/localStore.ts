import type { Timestamp } from 'firebase/firestore'
import { applyAward, applyReversal } from '../domain/growth'
import { validateGrouping, type DraftGroup } from '../domain/grouping'
import { getHouseProgress } from '../domain/house'
import { projectChallenge } from '../domain/challenge'
import { resolveEvolutionHistory } from '../domain/fishEvolution'
import {
  DEFAULT_GROUP_REASONS,
  DEFAULT_HOUSE_THRESHOLDS,
  DEFAULT_REASONS,
  DEFAULT_THRESHOLDS,
  type ActivityGroup,
  type AquariumReward,
  type AwardReason,
  type AwardRecord,
  type ChallengeMode,
  type ChallengeProgressEvent,
  type ClassChallenge,
  type EligibilityEvent,
  type Enrollment,
  type GroupActivity,
  type GroupAwardRecord,
  type GroupingTemplate,
  type GroupReason,
  type MembershipEvent,
  type TeacherClass,
} from '../types/domain'

export function makeTimestamp(date: Date = new Date()): Timestamp {
  const ms = date.getTime()
  return {
    seconds: Math.floor(ms / 1000),
    nanoseconds: (ms % 1000) * 1e6,
    toDate: () => new Date(ms),
    toMillis: () => ms,
    isEqual: (other: { toMillis?: () => number }) => Boolean(other && typeof other.toMillis === 'function' && other.toMillis() === ms),
    valueOf: () => new Date(ms).toISOString(),
    toJSON: () => ({ seconds: Math.floor(ms / 1000), nanoseconds: (ms % 1000) * 1e6 }),
  } as unknown as Timestamp
}

function revive<T>(item: T): T {
  if (!item || typeof item !== 'object') return item
  if (Array.isArray(item)) return item.map(revive) as unknown as T
  const record = item as Record<string, unknown>
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(record)) {
    if (v && typeof v === 'object' && typeof (v as { seconds?: number }).seconds === 'number') {
      const ts = v as { seconds: number; nanoseconds?: number }
      out[k] = makeTimestamp(new Date(ts.seconds * 1000 + Math.floor((ts.nanoseconds || 0) / 1e6)))
    } else if (v && typeof v === 'object') {
      out[k] = revive(v)
    } else {
      out[k] = v
    }
  }
  return out as T
}

interface LocalStoreData {
  classes: Record<string, TeacherClass[]>
  students: Record<string, Enrollment[]>
  awards: Record<string, AwardRecord[]>
  activities: Record<string, GroupActivity[]>
  activityGroups: Record<string, ActivityGroup[]>
  groupAwards: Record<string, GroupAwardRecord[]>
  membershipEvents: Record<string, MembershipEvent[]>
  templates: Record<string, GroupingTemplate[]>
  challenges: Record<string, ClassChallenge[]>
  challengeProgress: Record<string, ChallengeProgressEvent[]>
  challengeEligibility: Record<string, EligibilityEvent[]>
}

const STORAGE_KEY = 'grow_build_local_store_v2'

function getInitialData(): LocalStoreData {
  const teacherId = 'teacher-local-user'
  const classId = 'demo-science-9'
  const now = makeTimestamp()

  const starterClass: TeacherClass = {
    id: classId,
    ownerId: teacherId,
    name: 'Science 9 - Earth & Space',
    subject: 'General Science',
    grade: 'Grade 9',
    archivedAt: null,
    activeActivityId: null,
    activeChallengeId: null,
    aquariumDecorations: [],
    thresholds: DEFAULT_THRESHOLDS,
    reasons: DEFAULT_REASONS,
    createdAt: now,
    updatedAt: now,
  }

  const starterStudents: Enrollment[] = [
    { id: 's-1', ownerId: teacherId, classId, name: 'Alex Rivera', displayName: 'Alex Rivera', fishName: 'Bubbles', fishStyle: 0, points: 12, status: 'active', evolutionHistory: { starter: 'starter', natural: 'N03' }, lastMutationId: 'a-init-1', createdAt: now, updatedAt: now },
    { id: 's-2', ownerId: teacherId, classId, name: 'Sam Cruz', displayName: 'Sam Cruz', fishName: 'Finny', fishStyle: 1, points: 8, status: 'active', evolutionHistory: { starter: 'starter' }, lastMutationId: 'a-init-2', createdAt: now, updatedAt: now },
    { id: 's-3', ownerId: teacherId, classId, name: 'Maria Santos', displayName: 'Maria Santos', fishName: 'Coral', fishStyle: 2, points: 4, status: 'active', evolutionHistory: { starter: 'starter' }, lastMutationId: 'a-init-3', createdAt: now, updatedAt: now },
    { id: 's-4', ownerId: teacherId, classId, name: 'Juan Dela Cruz', displayName: 'Juan Dela Cruz', fishName: 'Splash', fishStyle: 3, points: 28, status: 'active', evolutionHistory: { starter: 'starter', natural: 'N07', rare: 'R05' }, lastMutationId: 'a-init-4', createdAt: now, updatedAt: now },
    { id: 's-5', ownerId: teacherId, classId, name: 'Bea Reyes', displayName: 'Bea Reyes', fishName: 'Nemo', fishStyle: 4, points: 55, status: 'active', evolutionHistory: { starter: 'starter', natural: 'N02', rare: 'R09', magical: 'MG04' }, lastMutationId: 'a-init-5', createdAt: now, updatedAt: now },
  ]

  const starterAwards: AwardRecord[] = [
    { id: 'a-init-5', ownerId: teacherId, classId, studentId: 's-5', recipientName: 'Bea Reyes', amount: 55, reasonId: 'explanation', reasonLabel: 'Clear explanation', operationId: 'op-init-5', requestKey: 'req-init-5', reversedBy: null, createdAt: now },
    { id: 'a-init-4', ownerId: teacherId, classId, studentId: 's-4', recipientName: 'Juan Dela Cruz', amount: 28, reasonId: 'thoughtful-question', reasonLabel: 'Thoughtful question', operationId: 'op-init-4', requestKey: 'req-init-4', reversedBy: null, createdAt: now },
    { id: 'a-init-1', ownerId: teacherId, classId, studentId: 's-1', recipientName: 'Alex Rivera', amount: 12, reasonId: 'relevant-attempt', reasonLabel: 'Relevant attempt', operationId: 'op-init-1', requestKey: 'req-init-1', reversedBy: null, createdAt: now },
    { id: 'a-init-2', ownerId: teacherId, classId, studentId: 's-2', recipientName: 'Sam Cruz', amount: 8, reasonId: 'helping', reasonLabel: 'Helping a classmate', operationId: 'op-init-2', requestKey: 'req-init-2', reversedBy: null, createdAt: now },
    { id: 'a-init-3', ownerId: teacherId, classId, studentId: 's-3', recipientName: 'Maria Santos', amount: 4, reasonId: 'relevant-attempt', reasonLabel: 'Relevant attempt', operationId: 'op-init-3', requestKey: 'req-init-3', reversedBy: null, createdAt: now },
  ]

  return {
    classes: { [teacherId]: [starterClass] },
    students: { [`${teacherId}:${classId}`]: starterStudents },
    awards: { [`${teacherId}:${classId}`]: starterAwards },
    activities: { [`${teacherId}:${classId}`]: [] },
    activityGroups: {},
    groupAwards: {},
    membershipEvents: {},
    templates: {},
    challenges: { [`${teacherId}:${classId}`]: [] },
    challengeProgress: {},
    challengeEligibility: {},
  }
}

class LocalStoreEngine {
  private data: LocalStoreData
  private listeners: Map<string, Set<() => void>> = new Map()

  constructor() {
    this.data = this.load()
  }

  private load(): LocalStoreData {
    if (typeof window === 'undefined') return getInitialData()
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) return revive(JSON.parse(raw))
    } catch (e) {
      console.warn('Failed to parse local store, seeding initial data', e)
    }
    const initial = getInitialData()
    this.persist(initial)
    return initial
  }

  private persist(data = this.data) {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (e) {
      console.error('Failed to persist local store', e)
    }
  }

  private notify(channel: string) {
    this.persist()
    const set = this.listeners.get(channel)
    if (set) {
      set.forEach((cb) => cb())
    }
  }

  public subscribe(channel: string, callback: () => void): () => void {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set())
    }
    this.listeners.get(channel)!.add(callback)
    callback()
    return () => {
      this.listeners.get(channel)?.delete(callback)
    }
  }

  // --- Classes ---
  public getClasses(uid: string): TeacherClass[] {
    const list = this.data.classes[uid] || this.data.classes['teacher-local-user'] || []
    return [...list].sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
  }

  public createClass(uid: string, input: { name: string; subject: string; grade: string }): TeacherClass {
    const name = input.name.trim()
    if (!name) throw new Error('Class name is required.')
    const now = makeTimestamp()
    const newClass: TeacherClass = {
      id: `class-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ownerId: uid,
      name,
      subject: input.subject.trim(),
      grade: input.grade.trim(),
      archivedAt: null,
      activeActivityId: null,
      activeChallengeId: null,
      aquariumDecorations: [],
      thresholds: DEFAULT_THRESHOLDS,
      reasons: DEFAULT_REASONS,
      createdAt: now,
      updatedAt: now,
    }
    if (!this.data.classes[uid]) this.data.classes[uid] = []
    this.data.classes[uid].push(newClass)
    this.notify(`classes:${uid}`)
    return newClass
  }

  public updateClass(uid: string, classId: string, input: { name: string; subject: string; grade: string }) {
    const list = this.data.classes[uid] || this.data.classes['teacher-local-user'] || []
    const target = list.find((c) => c.id === classId)
    if (!target) throw new Error('Class not found.')
    target.name = input.name.trim()
    target.subject = input.subject.trim()
    target.grade = input.grade.trim()
    target.updatedAt = makeTimestamp()
    this.notify(`classes:${uid}`)
  }

  public setClassArchived(uid: string, classId: string, archived: boolean) {
    const list = this.data.classes[uid] || this.data.classes['teacher-local-user'] || []
    const target = list.find((c) => c.id === classId)
    if (!target) throw new Error('Class not found.')
    target.archivedAt = archived ? makeTimestamp() : null
    target.updatedAt = makeTimestamp()
    this.notify(`classes:${uid}`)
  }

  public updateClassConfiguration(uid: string, classId: string, thresholds: TeacherClass['thresholds'], reasons: TeacherClass['reasons']) {
    const list = this.data.classes[uid] || this.data.classes['teacher-local-user'] || []
    const target = list.find((c) => c.id === classId)
    if (!target) throw new Error('Class not found.')
    target.thresholds = thresholds
    target.reasons = reasons
    target.updatedAt = makeTimestamp()
    this.notify(`classes:${uid}`)
  }

  // --- Students ---
  public getStudents(uid: string, classId: string): Enrollment[] {
    const key = `${uid}:${classId}`
    const fallbackKey = `teacher-local-user:${classId}`
    const list = this.data.students[key] || this.data.students[fallbackKey] || []
    return [...list].sort((a, b) => (a.createdAt?.toMillis?.() || 0) - (b.createdAt?.toMillis?.() || 0))
  }

  public addStudent(uid: string, classId: string, name: string, fishName = ''): Enrollment {
    if (!name.trim()) throw new Error('Student name is required.')
    const key = `${uid}:${classId}`
    if (!this.data.students[key]) this.data.students[key] = []
    const now = makeTimestamp()
    const student: Enrollment = {
      id: `s-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      ownerId: uid,
      classId,
      name: name.trim(),
      displayName: name.trim(),
      fishName: fishName.trim(),
      fishStyle: Math.floor(Math.random() * 5),
      points: 0,
      status: 'active',
      lastMutationId: '',
      createdAt: now,
      updatedAt: now,
    }
    this.data.students[key].push(student)
    this.notify(`students:${uid}:${classId}`)
    return student
  }

  public addStudents(uid: string, classId: string, names: string[]) {
    const clean = names.map((n) => n.trim()).filter(Boolean)
    if (!clean.length) throw new Error('Add at least one student name.')
    clean.forEach((name) => this.addStudent(uid, classId, name))
  }

  public updateStudent(uid: string, classId: string, studentId: string, input: { name: string; displayName: string; fishName: string }) {
    if (!input.name.trim()) throw new Error('Student name is required.')
    const key = `${uid}:${classId}`
    const list = this.data.students[key] || this.data.students[`teacher-local-user:${classId}`] || []
    const s = list.find((st) => st.id === studentId)
    if (!s) throw new Error('Student not found.')
    s.name = input.name.trim()
    s.displayName = input.displayName.trim() || input.name.trim()
    s.fishName = input.fishName.trim()
    s.updatedAt = makeTimestamp()
    this.notify(`students:${uid}:${classId}`)
  }

  public updateStudentEvolutions(
    uid: string,
    classId: string,
    updates: Array<{ studentId: string; evolutionHistory: Record<string, string> }>
  ) {
    const key = `${uid}:${classId}`
    const list = this.data.students[key] || this.data.students[`teacher-local-user:${classId}`] || []
    updates.forEach(({ studentId, evolutionHistory }) => {
      const s = list.find((st) => st.id === studentId)
      if (s) {
        s.evolutionHistory = evolutionHistory
        s.updatedAt = makeTimestamp()
      }
    })
    this.notify(`students:${uid}:${classId}`)
  }

  // --- Awards ---
  public getAwards(uid: string, classId: string): AwardRecord[] {
    const key = `${uid}:${classId}`
    const list = this.data.awards[key] || this.data.awards[`teacher-local-user:${classId}`] || []
    return [...list].sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
  }

  public awardStudents(uid: string, classId: string, studentIds: string[], reason: AwardReason, operationId: string) {
    if (!studentIds.length) throw new Error('Select at least one student.')
    if (new Set(studentIds).size !== studentIds.length) throw new Error('Each student can receive an award only once per operation.')
    if (!Number.isInteger(reason.points) || reason.points <= 0 || reason.points > 10) throw new Error('Award points must be between 1 and 10.')

    const studentKey = `${uid}:${classId}`
    const students = this.data.students[studentKey] || this.data.students[`teacher-local-user:${classId}`] || []
    const awardKey = `${uid}:${classId}`
    if (!this.data.awards[awardKey]) this.data.awards[awardKey] = []

    const classes = this.data.classes[uid] || this.data.classes['teacher-local-user'] || []
    const cls = classes.find((c) => c.id === classId)
    const activeChallengeId = cls?.activeChallengeId
    const challengeKey = `${uid}:${classId}`
    const challenges = this.data.challenges[challengeKey] || []
    const challenge = activeChallengeId ? challenges.find((c) => c.id === activeChallengeId) : null

    const now = makeTimestamp()
    const newlyAwarded: string[] = []

    studentIds.forEach((studentId) => {
      const student = students.find((s) => s.id === studentId)
      if (!student) throw new Error('A selected student does not belong to this class.')
      const awardId = `${operationId}_${studentId}`
      if (this.data.awards[awardKey].some((a) => a.id === awardId)) return

      student.points = applyAward(student.points, reason.points)
      const { history } = resolveEvolutionHistory(student.evolutionHistory, student.points)
      student.evolutionHistory = history
      student.lastMutationId = awardId
      student.updatedAt = now
      newlyAwarded.push(studentId)

      this.data.awards[awardKey].unshift({
        id: awardId,
        ownerId: uid,
        classId,
        studentId,
        recipientName: student.displayName || student.name,
        amount: reason.points,
        reasonId: reason.id,
        reasonLabel: reason.label,
        operationId,
        requestKey: operationId,
        challengeId: challenge && challenge.status === 'active' && challenge.eligibleIds.includes(studentId) ? activeChallengeId : null,
        reversedBy: null,
        createdAt: now,
      } as AwardRecord & { challengeId?: string | null })
    })

    // Update challenge progress if active and matches reason
    if (challenge && challenge.status === 'active' && newlyAwarded.length) {
      const eligible = newlyAwarded.filter((id) => challenge.eligibleIds.includes(id))
      const qualifies = challenge.mode === 'manual' ? false : !challenge.reasonId || challenge.reasonId === reason.id
      if (qualifies && eligible.length) {
        const nextContributors = [...new Set([...challenge.contributorIds, ...eligible])]
        const counts = { ...(challenge.contributorCounts || {}) }
        eligible.forEach((id) => {
          counts[id] = (counts[id] || 0) + 1
        })
        const amount = challenge.mode === 'distinct-contributors' ? nextContributors.length : challenge.currentProgress + eligible.length
        challenge.contributorIds = nextContributors
        challenge.contributorCounts = counts
        challenge.currentProgress = amount
        challenge.rewardActive = amount >= challenge.target
        this.notify(`challenges:${uid}:${classId}`)
      }
    }

    this.notify(`students:${uid}:${classId}`)
    this.notify(`awards:${uid}:${classId}`)
  }

  public reverseAward(uid: string, classId: string, awardId: string) {
    const awardKey = `${uid}:${classId}`
    const awards = this.data.awards[awardKey] || []
    const award = awards.find((a) => a.id === awardId)
    if (!award || award.reversedBy) throw new Error('This award was already reversed or does not exist.')

    const studentKey = `${uid}:${classId}`
    const students = this.data.students[studentKey] || this.data.students[`teacher-local-user:${classId}`] || []
    const student = students.find((s) => s.id === award.studentId)
    if (student) {
      student.points = applyReversal(student.points, award.amount)
      student.updatedAt = makeTimestamp()
    }

    award.reversedBy = `reversal_${awardId}`
    this.notify(`students:${uid}:${classId}`)
    this.notify(`awards:${uid}:${classId}`)
  }

  // --- Activities ---
  public getActivities(uid: string, classId: string): GroupActivity[] {
    const key = `${uid}:${classId}`
    return this.data.activities[key] || []
  }

  public getActivityGroups(uid: string, classId: string, activityId: string): ActivityGroup[] {
    return this.data.activityGroups[`${uid}:${classId}:${activityId}`] || []
  }

  public getGroupAwards(uid: string, classId: string, activityId: string): GroupAwardRecord[] {
    return this.data.groupAwards[`${uid}:${classId}:${activityId}`] || []
  }

  public getMembershipEvents(uid: string, classId: string, activityId: string): MembershipEvent[] {
    return this.data.membershipEvents[`${uid}:${classId}:${activityId}`] || []
  }

  public getTemplates(uid: string, classId: string): GroupingTemplate[] {
    return this.data.templates[`${uid}:${classId}`] || []
  }

  public startActivity(uid: string, classId: string, title: string, participantIds: string[], excludedIds: string[], groups: DraftGroup[], requestId: string): string {
    validateGrouping(participantIds, groups)
    if (!title.trim()) throw new Error('Activity name is required.')

    const classKey = uid
    const classes = this.data.classes[classKey] || this.data.classes['teacher-local-user'] || []
    const cls = classes.find((c) => c.id === classId)
    if (!cls) throw new Error('Class not found.')
    if (cls.activeActivityId) throw new Error('This class already has an active group activity.')

    const activityId = `act-${Date.now()}`
    const now = makeTimestamp()

    const act: GroupActivity = {
      id: activityId,
      ownerId: uid,
      classId,
      title: title.trim(),
      status: 'active',
      participantIds,
      excludedIds,
      groupIds: groups.map((g) => g.id),
      houseThresholds: DEFAULT_HOUSE_THRESHOLDS,
      groupReasons: DEFAULT_GROUP_REASONS,
      startedAt: now,
      completedAt: null,
      completionRequestId: null,
      startRequestId: requestId,
    } as GroupActivity & { startRequestId?: string }

    const activityGroups: ActivityGroup[] = groups.map((g) => ({
      id: g.id,
      ownerId: uid,
      classId,
      activityId,
      name: g.name.trim() || 'Group',
      memberIds: [...g.memberIds],
      initialMemberIds: [...g.memberIds],
      finalMemberIds: [],
      points: 0,
      lastMutationId: '',
      decorationSelections: [],
      createdAt: now,
      updatedAt: now,
    }))

    const actKey = `${uid}:${classId}`
    if (!this.data.activities[actKey]) this.data.activities[actKey] = []
    this.data.activities[actKey].unshift(act)

    this.data.activityGroups[`${uid}:${classId}:${activityId}`] = activityGroups
    cls.activeActivityId = activityId
    cls.updatedAt = now

    this.notify(`classes:${uid}`)
    this.notify(`activities:${uid}:${classId}`)
    this.notify(`activityGroups:${uid}:${classId}:${activityId}`)
    return activityId
  }

  public moveMember(uid: string, classId: string, activityId: string, studentId: string, studentName: string, fromGroup: ActivityGroup, toGroup: ActivityGroup, requestId: string) {
    if (fromGroup.id === toGroup.id) return
    const groups = this.data.activityGroups[`${uid}:${classId}:${activityId}`] || []
    const from = groups.find((g) => g.id === fromGroup.id)
    const to = groups.find((g) => g.id === toGroup.id)
    if (!from || !to) throw new Error('Groups not found.')

    from.memberIds = from.memberIds.filter((id) => id !== studentId)
    to.memberIds = [...to.memberIds, studentId]

    const eventsKey = `${uid}:${classId}:${activityId}`
    if (!this.data.membershipEvents[eventsKey]) this.data.membershipEvents[eventsKey] = []
    this.data.membershipEvents[eventsKey].unshift({
      id: requestId,
      ownerId: uid,
      classId,
      activityId,
      studentId,
      studentName,
      fromGroupId: fromGroup.id,
      fromGroupName: from.name,
      toGroupId: toGroup.id,
      toGroupName: to.name,
      requestKey: requestId,
      createdAt: makeTimestamp(),
    })

    this.notify(`activityGroups:${uid}:${classId}:${activityId}`)
    this.notify(`membershipEvents:${uid}:${classId}:${activityId}`)
  }

  public renameGroup(uid: string, classId: string, activityId: string, groupId: string, name: string) {
    if (!name.trim()) throw new Error('Group name is required.')
    const groups = this.data.activityGroups[`${uid}:${classId}:${activityId}`] || []
    const g = groups.find((gr) => gr.id === groupId)
    if (g) {
      g.name = name.trim()
      g.updatedAt = makeTimestamp()
      this.notify(`activityGroups:${uid}:${classId}:${activityId}`)
    }
  }

  public awardGroup(uid: string, classId: string, activityId: string, group: ActivityGroup, reason: GroupReason, requestId: string) {
    const groups = this.data.activityGroups[`${uid}:${classId}:${activityId}`] || []
    const g = groups.find((gr) => gr.id === group.id)
    if (!g) throw new Error('Group not found.')

    g.points += reason.points
    g.lastMutationId = requestId
    g.updatedAt = makeTimestamp()

    const awardKey = `${uid}:${classId}:${activityId}`
    if (!this.data.groupAwards[awardKey]) this.data.groupAwards[awardKey] = []
    this.data.groupAwards[awardKey].unshift({
      id: requestId,
      ownerId: uid,
      classId,
      activityId,
      groupId: group.id,
      groupName: g.name,
      amount: reason.points,
      reasonId: reason.id,
      reasonLabel: reason.label,
      requestKey: requestId,
      reversedBy: null,
      createdAt: makeTimestamp(),
    })

    this.notify(`activityGroups:${uid}:${classId}:${activityId}`)
    this.notify(`groupAwards:${uid}:${classId}:${activityId}`)
  }

  public reverseGroupAward(uid: string, classId: string, activityId: string, awardId: string) {
    const awardKey = `${uid}:${classId}:${activityId}`
    const awards = this.data.groupAwards[awardKey] || []
    const a = awards.find((aw) => aw.id === awardId)
    if (!a || a.reversedBy) throw new Error('Award already reversed.')

    const groups = this.data.activityGroups[`${uid}:${classId}:${activityId}`] || []
    const g = groups.find((gr) => gr.id === a.groupId)
    if (g) {
      g.points = Math.max(0, g.points - a.amount)
      g.updatedAt = makeTimestamp()
    }
    a.reversedBy = `reversal_${awardId}`

    this.notify(`activityGroups:${uid}:${classId}:${activityId}`)
    this.notify(`groupAwards:${uid}:${classId}:${activityId}`)
  }

  public selectDecoration(uid: string, classId: string, activityId: string, group: ActivityGroup, decoration: string) {
    const groups = this.data.activityGroups[`${uid}:${classId}:${activityId}`] || []
    const g = groups.find((gr) => gr.id === group.id)
    if (!g) throw new Error('Group not found.')
    const progress = getHouseProgress(g.points, DEFAULT_HOUSE_THRESHOLDS)
    const current = g.decorationSelections || []
    if (current.includes(decoration)) return
    if (current.length >= progress.decorationEntitlements) throw new Error('No unused decoration entitlement.')
    g.decorationSelections = [...current, decoration]
    g.updatedAt = makeTimestamp()
    this.notify(`activityGroups:${uid}:${classId}:${activityId}`)
  }

  public endActivity(uid: string, classId: string, activityId: string, requestId: string) {
    const classes = this.data.classes[uid] || this.data.classes['teacher-local-user'] || []
    const cls = classes.find((c) => c.id === classId)
    const actKey = `${uid}:${classId}`
    const activities = this.data.activities[actKey] || []
    const act = activities.find((a) => a.id === activityId)
    if (!act) throw new Error('Activity not found.')

    act.status = 'completed'
    act.completedAt = makeTimestamp()
    act.completionRequestId = requestId

    const groups = this.data.activityGroups[`${uid}:${classId}:${activityId}`] || []
    groups.forEach((g) => {
      g.finalMemberIds = [...g.memberIds]
    })

    if (cls) cls.activeActivityId = null

    this.notify(`classes:${uid}`)
    this.notify(`activities:${uid}:${classId}`)
    this.notify(`activityGroups:${uid}:${classId}:${activityId}`)
  }

  public saveTemplate(uid: string, classId: string, name: string, groups: Array<{ name: string; memberIds: string[] }>): GroupingTemplate {
    if (!name.trim()) throw new Error('Template name is required.')
    const key = `${uid}:${classId}`
    if (!this.data.templates[key]) this.data.templates[key] = []
    const tpl: GroupingTemplate = {
      id: `tpl-${Date.now()}`,
      ownerId: uid,
      classId,
      name: name.trim(),
      groups: groups.map((g) => ({ name: g.name, memberIds: [...g.memberIds] })),
      createdAt: makeTimestamp(),
    }
    this.data.templates[key].unshift(tpl)
    this.notify(`templates:${uid}:${classId}`)
    return tpl
  }

  // --- Challenges ---
  public getChallenges(uid: string, classId: string): ClassChallenge[] {
    const key = `${uid}:${classId}`
    return this.data.challenges[key] || []
  }

  public getManualProgress(uid: string, classId: string, challengeId: string): ChallengeProgressEvent[] {
    return this.data.challengeProgress[`${uid}:${classId}:${challengeId}`] || []
  }

  public getEligibilityEvents(uid: string, classId: string, challengeId: string): EligibilityEvent[] {
    return this.data.challengeEligibility[`${uid}:${classId}:${challengeId}`] || []
  }

  public startChallenge(uid: string, classId: string, input: { title: string; target: number; mode: ChallengeMode; reasonId: string | null; reasonLabel: string | null; eligibleIds: string[]; reward: AquariumReward; startsAt: Date; endsAt: Date }, requestId: string): string {
    if (!input.title.trim()) throw new Error('Challenge title is required.')
    if (!Number.isInteger(input.target) || input.target < 1) throw new Error('Target must be a positive whole number.')
    if (input.endsAt <= input.startsAt) throw new Error('The end date must be after the start date.')
    if (!input.eligibleIds.length) throw new Error('Select at least one eligible student.')

    const classes = this.data.classes[uid] || this.data.classes['teacher-local-user'] || []
    const cls = classes.find((c) => c.id === classId)
    if (!cls) throw new Error('Class not found.')
    if (cls.activeChallengeId) throw new Error('This class already has an active challenge.')

    const challengeId = `ch-${Date.now()}`
    const challenge: ClassChallenge = {
      id: challengeId,
      ownerId: uid,
      classId,
      title: input.title.trim(),
      target: input.target,
      mode: input.mode,
      reasonId: input.mode === 'manual' ? null : input.reasonId,
      reasonLabel: input.mode === 'manual' ? null : input.reasonLabel,
      eligibleIds: [...input.eligibleIds],
      contributorIds: [],
      contributorCounts: {},
      currentProgress: 0,
      reward: input.reward,
      rewardActive: false,
      rewardSelected: false,
      status: 'active',
      startsAt: makeTimestamp(input.startsAt),
      endsAt: makeTimestamp(input.endsAt),
      endedAt: null,
      startRequestId: requestId,
    } as ClassChallenge & { startRequestId?: string }

    const key = `${uid}:${classId}`
    if (!this.data.challenges[key]) this.data.challenges[key] = []
    this.data.challenges[key].unshift(challenge)

    cls.activeChallengeId = challengeId
    cls.updatedAt = makeTimestamp()

    this.notify(`classes:${uid}`)
    this.notify(`challenges:${uid}:${classId}`)
    return challengeId
  }

  public addManualProgress(uid: string, classId: string, challengeId: string, amount: number, note: string, requestId: string) {
    if (!Number.isInteger(amount) || amount < 1) throw new Error('Progress must be a positive whole number.')
    const key = `${uid}:${classId}`
    const challenges = this.data.challenges[key] || []
    const c = challenges.find((ch) => ch.id === challengeId)
    if (!c || c.status !== 'active' || c.mode !== 'manual') throw new Error('This is not an active manual challenge.')

    const p = projectChallenge('manual', c.target, c.currentProgress, c.contributorIds, c.eligibleIds, { amount, qualifies: true })
    c.currentProgress = p.progress
    c.rewardActive = p.rewardActive

    const progKey = `${uid}:${classId}:${challengeId}`
    if (!this.data.challengeProgress[progKey]) this.data.challengeProgress[progKey] = []
    this.data.challengeProgress[progKey].unshift({
      id: requestId,
      ownerId: uid,
      classId,
      challengeId,
      amount,
      note: note.trim(),
      reversedBy: null,
      createdAt: makeTimestamp(),
    })

    this.notify(`challenges:${uid}:${classId}`)
    this.notify(`challengeProgress:${uid}:${classId}:${challengeId}`)
  }

  public reverseManualProgress(uid: string, classId: string, challengeId: string, eventId: string) {
    const progKey = `${uid}:${classId}:${challengeId}`
    const events = this.data.challengeProgress[progKey] || []
    const ev = events.find((e) => e.id === eventId)
    if (!ev || ev.reversedBy) throw new Error('Progress entry unavailable or already corrected.')

    const key = `${uid}:${classId}`
    const challenges = this.data.challenges[key] || []
    const c = challenges.find((ch) => ch.id === challengeId)
    if (c) {
      const p = projectChallenge('manual', c.target, c.currentProgress, c.contributorIds, c.eligibleIds, { amount: ev.amount, qualifies: true, reverse: true })
      c.currentProgress = p.progress
      c.rewardActive = p.rewardActive
    }
    ev.reversedBy = `reversal_${eventId}`

    this.notify(`challenges:${uid}:${classId}`)
    this.notify(`challengeProgress:${uid}:${classId}:${challengeId}`)
  }

  public changeEligibility(uid: string, classId: string, challengeId: string, studentId: string, studentName: string, action: 'add' | 'remove', requestId: string) {
    const key = `${uid}:${classId}`
    const challenges = this.data.challenges[key] || []
    const c = challenges.find((ch) => ch.id === challengeId)
    if (!c || c.status !== 'active') throw new Error('Challenge is no longer active.')

    const ids = c.eligibleIds
    const next = action === 'add' ? [...new Set([...ids, studentId])] : ids.filter((id) => id !== studentId)
    const contributors = (c.contributorIds || []).filter((id) => next.includes(id))
    c.eligibleIds = next
    c.contributorIds = contributors
    c.currentProgress = c.mode === 'distinct-contributors' ? contributors.length : c.currentProgress
    c.rewardActive = c.currentProgress >= c.target

    const elKey = `${uid}:${classId}:${challengeId}`
    if (!this.data.challengeEligibility[elKey]) this.data.challengeEligibility[elKey] = []
    this.data.challengeEligibility[elKey].unshift({
      id: requestId,
      ownerId: uid,
      classId,
      challengeId,
      studentId,
      studentName,
      action,
      createdAt: makeTimestamp(),
    })

    this.notify(`challenges:${uid}:${classId}`)
    this.notify(`challengeEligibility:${uid}:${classId}:${challengeId}`)
  }

  public setRewardSelected(uid: string, classId: string, challengeId: string, selected: boolean) {
    const key = `${uid}:${classId}`
    const challenges = this.data.challenges[key] || []
    const c = challenges.find((ch) => ch.id === challengeId)
    if (!c) throw new Error('Challenge not found.')
    if (selected && !c.rewardActive) throw new Error('Complete the challenge before applying its reward.')
    c.rewardSelected = selected

    const classes = this.data.classes[uid] || this.data.classes['teacher-local-user'] || []
    const cls = classes.find((cl) => cl.id === classId)
    if (cls) {
      if (!cls.aquariumDecorations) cls.aquariumDecorations = []
      const existing = cls.aquariumDecorations.find((d) => d.challengeId === challengeId)
      if (existing) {
        existing.selected = selected
      } else {
        cls.aquariumDecorations.push({ challengeId, reward: c.reward, selected })
      }
      this.notify(`classes:${uid}`)
    }

    this.notify(`challenges:${uid}:${classId}`)
  }

  public endChallenge(uid: string, classId: string, challengeId: string) {
    const classes = this.data.classes[uid] || this.data.classes['teacher-local-user'] || []
    const cls = classes.find((c) => c.id === classId)
    const key = `${uid}:${classId}`
    const challenges = this.data.challenges[key] || []
    const c = challenges.find((ch) => ch.id === challengeId)
    if (!c) throw new Error('Challenge not found.')

    c.status = 'ended'
    c.endedAt = makeTimestamp()
    if (cls && cls.activeChallengeId === challengeId) {
      cls.activeChallengeId = null
      cls.updatedAt = makeTimestamp()
      this.notify(`classes:${uid}`)
    }
    this.notify(`challenges:${uid}:${classId}`)
  }

  public resetAll() {
    this.data = getInitialData()
    this.persist()
    if (typeof window !== 'undefined') window.location.reload()
  }
}

export const localStore = new LocalStoreEngine()
