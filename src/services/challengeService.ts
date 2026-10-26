import { collection, doc, onSnapshot, orderBy, query, runTransaction, serverTimestamp, Timestamp, type Unsubscribe } from 'firebase/firestore'
import { projectChallenge } from '../domain/challenge'
import { requireFirebase } from '../lib/firebase'
import { isLocalTestMode } from '../lib/testMode'
import { localStore } from './localStore'
import type { AquariumReward, ChallengeMode, ChallengeProgressEvent, ClassChallenge, EligibilityEvent } from '../types/domain'

const base = (uid: string, classId: string) => ['teachers', uid, 'classes', classId] as const

export function watchChallenges(uid: string, classId: string, next: (items: ClassChallenge[]) => void, error: (e: Error) => void): Unsubscribe {
  if (isLocalTestMode()) {
    return localStore.subscribe(`challenges:${uid}:${classId}`, () => {
      next(localStore.getChallenges(uid, classId))
    })
  }
  const { db } = requireFirebase()
  return onSnapshot(
    query(collection(db, ...base(uid, classId), 'challenges'), orderBy('startsAt', 'desc')),
    (snap) => next(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ClassChallenge)),
    (err) => {
      console.warn('Firestore watchChallenges error; falling back to local store', err)
      error(err)
      return localStore.subscribe(`challenges:${uid}:${classId}`, () => next(localStore.getChallenges(uid, classId)))
    }
  )
}

export function watchManualProgress(uid: string, classId: string, challengeId: string, next: (items: ChallengeProgressEvent[]) => void, error: (e: Error) => void): Unsubscribe {
  if (isLocalTestMode()) {
    return localStore.subscribe(`challengeProgress:${uid}:${classId}:${challengeId}`, () => {
      next(localStore.getManualProgress(uid, classId, challengeId))
    })
  }
  const { db } = requireFirebase()
  return onSnapshot(
    query(collection(db, ...base(uid, classId), 'challenges', challengeId, 'progressEvents'), orderBy('createdAt', 'desc')),
    (snap) => next(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ChallengeProgressEvent)),
    (err) => {
      console.warn('Firestore watchManualProgress error; falling back to local store', err)
      error(err)
      return localStore.subscribe(`challengeProgress:${uid}:${classId}:${challengeId}`, () => next(localStore.getManualProgress(uid, classId, challengeId)))
    }
  )
}

export function watchEligibilityEvents(uid: string, classId: string, challengeId: string, next: (items: EligibilityEvent[]) => void, error: (e: Error) => void): Unsubscribe {
  if (isLocalTestMode()) {
    return localStore.subscribe(`challengeEligibility:${uid}:${classId}:${challengeId}`, () => {
      next(localStore.getEligibilityEvents(uid, classId, challengeId))
    })
  }
  const { db } = requireFirebase()
  return onSnapshot(
    query(collection(db, ...base(uid, classId), 'challenges', challengeId, 'eligibilityEvents'), orderBy('createdAt', 'desc')),
    (snap) => next(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as EligibilityEvent)),
    (err) => {
      console.warn('Firestore watchEligibilityEvents error; falling back to local store', err)
      error(err)
      return localStore.subscribe(`challengeEligibility:${uid}:${classId}:${challengeId}`, () => next(localStore.getEligibilityEvents(uid, classId, challengeId)))
    }
  )
}

export async function startChallenge(uid: string, classId: string, input: { title: string; target: number; mode: ChallengeMode; reasonId: string | null; reasonLabel: string | null; eligibleIds: string[]; reward: AquariumReward; startsAt: Date; endsAt: Date }, requestId: string) {
  if (isLocalTestMode()) {
    return localStore.startChallenge(uid, classId, input, requestId)
  }
  if (!input.title.trim()) throw new Error('Challenge title is required.')
  if (!Number.isInteger(input.target) || input.target < 1) throw new Error('Target must be a positive whole number.')
  if (input.endsAt <= input.startsAt) throw new Error('The end date must be after the start date.')
  if (!input.eligibleIds.length) throw new Error('Select at least one eligible student.')
  const { db } = requireFirebase()
  const classRef = doc(db, ...base(uid, classId)), challengeRef = doc(collection(db, ...base(uid, classId), 'challenges'))
  await runTransaction(db, async (tx) => {
    const cls = await tx.get(classRef)
    if (!cls.exists() || cls.data().ownerId !== uid) throw new Error('Class not found.')
    if (cls.data().activeChallengeId) throw new Error('This class already has an active challenge.')
    tx.set(challengeRef, { ownerId: uid, classId, title: input.title.trim(), target: input.target, mode: input.mode, reasonId: input.mode === 'manual' ? null : input.reasonId, reasonLabel: input.mode === 'manual' ? null : input.reasonLabel, eligibleIds: input.eligibleIds, contributorIds: [], currentProgress: 0, reward: input.reward, rewardActive: false, rewardSelected: false, status: 'active', startsAt: Timestamp.fromDate(input.startsAt), endsAt: Timestamp.fromDate(input.endsAt), activatedAt: serverTimestamp(), endedAt: null, startRequestId: requestId, lastMutationId: requestId })
    tx.update(classRef, { activeChallengeId: challengeRef.id, updatedAt: serverTimestamp() })
  })
  return challengeRef.id
}

export async function addManualProgress(uid: string, classId: string, challengeId: string, amount: number, note: string, requestId: string) {
  if (isLocalTestMode()) {
    localStore.addManualProgress(uid, classId, challengeId, amount, note, requestId)
    return
  }
  if (!Number.isInteger(amount) || amount < 1) throw new Error('Progress must be a positive whole number.')
  const { db } = requireFirebase()
  const challengeRef = doc(db, ...base(uid, classId), 'challenges', challengeId), eventRef = doc(db, ...base(uid, classId), 'challenges', challengeId, 'progressEvents', requestId)
  await runTransaction(db, async (tx) => {
    const [c, e] = await Promise.all([tx.get(challengeRef), tx.get(eventRef)])
    if (e.exists()) return
    if (!c.exists() || c.data().status !== 'active' || c.data().mode !== 'manual') throw new Error('This is not an active manual challenge.')
    const p = projectChallenge('manual', c.data().target, c.data().currentProgress, c.data().contributorIds, c.data().eligibleIds, { amount, qualifies: true })
    tx.update(challengeRef, { currentProgress: p.progress, rewardActive: p.rewardActive, lastMutationId: requestId })
    tx.set(eventRef, { ownerId: uid, classId, challengeId, amount, note: note.trim(), reversedBy: null, createdAt: serverTimestamp() })
  })
}

export async function reverseManualProgress(uid: string, classId: string, challengeId: string, eventId: string) {
  if (isLocalTestMode()) {
    localStore.reverseManualProgress(uid, classId, challengeId, eventId)
    return
  }
  const { db } = requireFirebase()
  const reversalId = `reversal_${eventId}`, challengeRef = doc(db, ...base(uid, classId), 'challenges', challengeId), eventRef = doc(db, ...base(uid, classId), 'challenges', challengeId, 'progressEvents', eventId), reversalRef = doc(db, ...base(uid, classId), 'challenges', challengeId, 'progressReversals', reversalId)
  await runTransaction(db, async (tx) => {
    const [c, e, r] = await Promise.all([tx.get(challengeRef), tx.get(eventRef), tx.get(reversalRef)])
    if (r.exists()) return
    if (!c.exists() || !e.exists() || e.data().reversedBy) throw new Error('Progress entry is unavailable or already corrected.')
    const p = projectChallenge('manual', c.data().target, c.data().currentProgress, c.data().contributorIds, c.data().eligibleIds, { amount: e.data().amount, qualifies: true, reverse: true })
    tx.update(challengeRef, { currentProgress: p.progress, rewardActive: p.rewardActive, lastMutationId: reversalId })
    tx.update(eventRef, { reversedBy: reversalId })
    tx.set(reversalRef, { ownerId: uid, classId, challengeId, eventId, amount: e.data().amount, createdAt: serverTimestamp() })
  })
}

export async function changeEligibility(uid: string, classId: string, challengeId: string, studentId: string, studentName: string, action: 'add' | 'remove', requestId: string) {
  if (isLocalTestMode()) {
    localStore.changeEligibility(uid, classId, challengeId, studentId, studentName, action, requestId)
    return
  }
  const { db } = requireFirebase()
  const challengeRef = doc(db, ...base(uid, classId), 'challenges', challengeId), eventRef = doc(db, ...base(uid, classId), 'challenges', challengeId, 'eligibilityEvents', requestId)
  await runTransaction(db, async (tx) => {
    const [c, e] = await Promise.all([tx.get(challengeRef), tx.get(eventRef)])
    if (e.exists()) return
    if (!c.exists() || c.data().status !== 'active') throw new Error('Challenge is no longer active.')
    const ids: string[] = c.data().eligibleIds
    const next = action === 'add' ? [...new Set([...ids, studentId])] : ids.filter((id) => id !== studentId)
    const contributors = (c.data().contributorIds as string[]).filter((id) => next.includes(id))
    const progress = c.data().mode === 'distinct-contributors' ? contributors.length : c.data().currentProgress
    tx.update(challengeRef, { eligibleIds: next, contributorIds: contributors, currentProgress: progress, rewardActive: progress >= c.data().target, lastMutationId: requestId })
    tx.set(eventRef, { ownerId: uid, classId, challengeId, studentId, studentName, action, createdAt: serverTimestamp() })
  })
}

export async function setRewardSelected(uid: string, classId: string, challengeId: string, selected: boolean) {
  if (isLocalTestMode()) {
    localStore.setRewardSelected(uid, classId, challengeId, selected)
    return
  }
  const { db } = requireFirebase()
  const ref = doc(db, ...base(uid, classId), 'challenges', challengeId)
  await runTransaction(db, async (tx) => {
    const c = await tx.get(ref)
    if (!c.exists()) throw new Error('Challenge not found.')
    if (selected && !c.data().rewardActive) throw new Error('Complete the challenge before applying its reward.')
    tx.update(ref, { rewardSelected: selected })
  })
}

export async function endChallenge(uid: string, classId: string, challengeId: string, requestId: string) {
  if (isLocalTestMode()) {
    localStore.endChallenge(uid, classId, challengeId)
    return
  }
  const { db } = requireFirebase()
  const classRef = doc(db, ...base(uid, classId)), challengeRef = doc(db, ...base(uid, classId), 'challenges', challengeId)
  await runTransaction(db, async (tx) => {
    const [c, h] = await Promise.all([tx.get(classRef), tx.get(challengeRef)])
    if (h.data()?.status === 'ended') return
    if (!h.exists() || c.data()?.activeChallengeId !== challengeId) throw new Error('This challenge is not active.')
    tx.update(challengeRef, { status: 'ended', endedAt: serverTimestamp(), endRequestId: requestId })
    tx.update(classRef, { activeChallengeId: null, updatedAt: serverTimestamp() })
  })
}
