import { collection, doc, onSnapshot, orderBy, query, runTransaction, serverTimestamp, type Unsubscribe } from 'firebase/firestore'
import { requireFirebase } from '../lib/firebase'
import { isLocalTestMode } from '../lib/testMode'
import { localStore } from './localStore'
import { applyAward, applyReversal } from '../domain/growth'
import { resolveEvolutionHistory } from '../domain/fishEvolution'
import type { AwardReason, AwardRecord } from '../types/domain'

const root = (uid: string, classId: string) => ['teachers', uid, 'classes', classId] as const
export function createRequestId() { return crypto.randomUUID() }

export function watchAwards(uid: string, classId: string, next: (items: AwardRecord[]) => void, error: (error: Error) => void): Unsubscribe {
  if (isLocalTestMode()) {
    return localStore.subscribe(`awards:${uid}:${classId}`, () => {
      next(localStore.getAwards(uid, classId))
    })
  }
  const { db } = requireFirebase()
  return onSnapshot(
    query(collection(db, ...root(uid, classId), 'awards'), orderBy('createdAt', 'desc')),
    (snapshot) => next(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as AwardRecord)),
    (err) => {
      console.warn('Firestore watchAwards error; falling back to local store', err)
      error(err)
      return localStore.subscribe(`awards:${uid}:${classId}`, () => next(localStore.getAwards(uid, classId)))
    }
  )
}

export async function awardStudents(uid: string, classId: string, studentIds: string[], reason: AwardReason, operationId: string) {
  if (isLocalTestMode()) {
    localStore.awardStudents(uid, classId, studentIds, reason, operationId)
    return
  }
  if (!studentIds.length) throw new Error('Select at least one student.')
  if (new Set(studentIds).size !== studentIds.length) throw new Error('Each student can receive an award only once per operation.')
  if (!Number.isInteger(reason.points) || reason.points <= 0 || reason.points > 10) throw new Error('Award points must be between 1 and 10.')
  const { db } = requireFirebase()
  await runTransaction(db, async (transaction) => {
    const classSnapshot = await transaction.get(doc(db, ...root(uid, classId)))
    const activeChallengeId = classSnapshot.data()?.activeChallengeId as string | undefined
    const challengeRef = activeChallengeId ? doc(db, ...root(uid, classId), 'challenges', activeChallengeId) : null
    const challengeSnapshot = challengeRef ? await transaction.get(challengeRef) : null
    const challengeData = challengeSnapshot?.exists() ? challengeSnapshot.data() : null
    const challengeQualifies = Boolean(challengeData && challengeData.status === 'active' && Date.now() >= challengeData.startsAt.toMillis() && Date.now() <= challengeData.endsAt.toMillis() && challengeData.reasonId === reason.id)
    const refs = studentIds.map((studentId) => ({ studentId, student: doc(db, ...root(uid, classId), 'students', studentId), award: doc(db, ...root(uid, classId), 'awards', `${operationId}_${studentId}`) }))
    const snapshots = await Promise.all(refs.flatMap((item) => [transaction.get(item.student), transaction.get(item.award)]))
    const newlyAwarded: string[] = []
    refs.forEach((item, index) => {
      const studentSnapshot = snapshots[index * 2]; const awardSnapshot = snapshots[index * 2 + 1]
      if (awardSnapshot.exists()) return
      if (!studentSnapshot.exists() || studentSnapshot.data().classId !== classId || studentSnapshot.data().ownerId !== uid) throw new Error('A selected student does not belong to this class.')
      const awardId = `${operationId}_${item.studentId}`
      newlyAwarded.push(item.studentId)
      const currentPoints = (studentSnapshot.data().points as number) || 0
      const nextPoints = applyAward(currentPoints, reason.points)
      const existingHistory = studentSnapshot.data().evolutionHistory as Record<string, string> | undefined
      const { history } = resolveEvolutionHistory(existingHistory, nextPoints)
      transaction.update(item.student, {
        points: nextPoints,
        evolutionHistory: history,
        lastMutationId: awardId,
        updatedAt: serverTimestamp()
      })
      transaction.set(item.award, { ownerId: uid, classId, studentId: item.studentId, recipientName: studentSnapshot.data().displayName || studentSnapshot.data().name, amount: reason.points, reasonId: reason.id, reasonLabel: reason.label, operationId, requestKey: operationId, challengeId: challengeQualifies && challengeData?.eligibleIds.includes(item.studentId) ? activeChallengeId : null, reversedBy: null, createdAt: serverTimestamp() })
    })
    if (challengeRef && challengeSnapshot?.exists() && newlyAwarded.length) {
      const challenge = challengeSnapshot.data()
      const eligible = newlyAwarded.filter((id) => challenge.eligibleIds.includes(id))
      const qualifies = challengeQualifies
      if (qualifies && challenge.mode === 'reason-count') {
        const progress = challenge.currentProgress + eligible.length
        transaction.update(challengeRef, { currentProgress: progress, rewardActive: progress >= challenge.target, lastMutationId: operationId })
        transaction.set(doc(db, ...root(uid, classId), 'challenges', activeChallengeId!, 'projectionEvents', operationId), { ownerId: uid, classId, challengeId: activeChallengeId, progress, contributorIds: challenge.contributorIds, rewardActive: progress >= challenge.target, sourceType: 'award', sourceId: operationId, createdAt: serverTimestamp() })
      } else if (qualifies && challenge.mode === 'distinct-contributors') {
        const counts = { ...(challenge.contributorCounts ?? {}) } as Record<string, number>
        eligible.forEach((id) => { counts[id] = (counts[id] ?? 0) + 1 })
        const contributorIds = Object.keys(counts).filter((id) => counts[id] > 0 && challenge.eligibleIds.includes(id))
        transaction.update(challengeRef, { contributorCounts: counts, contributorIds, currentProgress: contributorIds.length, rewardActive: contributorIds.length >= challenge.target, lastMutationId: operationId })
        transaction.set(doc(db, ...root(uid, classId), 'challenges', activeChallengeId!, 'projectionEvents', operationId), { ownerId: uid, classId, challengeId: activeChallengeId, progress: contributorIds.length, contributorIds, rewardActive: contributorIds.length >= challenge.target, sourceType: 'award', sourceId: operationId, createdAt: serverTimestamp() })
      }
    }
  })
}

export async function reverseAward(uid: string, classId: string, awardId: string) {
  if (isLocalTestMode()) {
    localStore.reverseAward(uid, classId, awardId)
    return
  }
  const { db } = requireFirebase(); const reversalId = `reversal_${awardId}`
  await runTransaction(db, async (transaction) => {
    const awardRef = doc(db, ...root(uid, classId), 'awards', awardId)
    const reversalRef = doc(db, ...root(uid, classId), 'reversals', reversalId)
    const [awardSnapshot, reversalSnapshot] = await Promise.all([transaction.get(awardRef), transaction.get(reversalRef)])
    if (reversalSnapshot.exists()) return
    if (!awardSnapshot.exists() || awardSnapshot.data().ownerId !== uid) throw new Error('Award not found.')
    if (awardSnapshot.data().reversedBy) throw new Error('This award was already undone.')
    const challengeId = awardSnapshot.data().challengeId as string | null
    const challengeRef = challengeId ? doc(db, ...root(uid, classId), 'challenges', challengeId) : null
    const challengeSnapshot = challengeRef ? await transaction.get(challengeRef) : null
    const studentRef = doc(db, ...root(uid, classId), 'students', awardSnapshot.data().studentId)
    const studentSnapshot = await transaction.get(studentRef)
    if (!studentSnapshot.exists()) throw new Error('Student record not found.')
    transaction.update(studentRef, { points: applyReversal(studentSnapshot.data().points, awardSnapshot.data().amount), lastMutationId: reversalId, updatedAt: serverTimestamp() })
    transaction.update(awardRef, { reversedBy: reversalId })
    transaction.set(reversalRef, { ownerId: uid, classId, studentId: awardSnapshot.data().studentId, awardId, amount: awardSnapshot.data().amount, createdAt: serverTimestamp() })
    if (challengeRef && challengeSnapshot?.exists()) {
      const challenge = challengeSnapshot.data()
      if (challenge.mode === 'reason-count') {
        const progress = Math.max(0, challenge.currentProgress - 1)
        transaction.update(challengeRef, { currentProgress: progress, rewardActive: progress >= challenge.target, lastMutationId: reversalId })
        transaction.set(doc(db, ...root(uid, classId), 'challenges', challengeId!, 'projectionEvents', reversalId), { ownerId: uid, classId, challengeId, progress, contributorIds: challenge.contributorIds, rewardActive: progress >= challenge.target, sourceType: 'reversal', sourceId: awardId, createdAt: serverTimestamp() })
      } else if (challenge.mode === 'distinct-contributors') {
        const counts = { ...(challenge.contributorCounts ?? {}) } as Record<string, number>
        const studentId = awardSnapshot.data().studentId
        counts[studentId] = Math.max(0, (counts[studentId] ?? 1) - 1)
        const contributorIds = Object.keys(counts).filter((id) => counts[id] > 0 && challenge.eligibleIds.includes(id))
        transaction.update(challengeRef, { contributorCounts: counts, contributorIds, currentProgress: contributorIds.length, rewardActive: contributorIds.length >= challenge.target, lastMutationId: reversalId })
        transaction.set(doc(db, ...root(uid, classId), 'challenges', challengeId!, 'projectionEvents', reversalId), { ownerId: uid, classId, challengeId, progress: contributorIds.length, contributorIds, rewardActive: contributorIds.length >= challenge.target, sourceType: 'reversal', sourceId: awardId, createdAt: serverTimestamp() })
      }
    }
  })
}
