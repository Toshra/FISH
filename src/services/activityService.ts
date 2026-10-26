import { addDoc, collection, doc, getDocs, onSnapshot, orderBy, query, runTransaction, serverTimestamp, updateDoc, where, type Unsubscribe } from 'firebase/firestore'
import { getHouseProgress } from '../domain/house'
import { validateGrouping, type DraftGroup } from '../domain/grouping'
import { requireFirebase } from '../lib/firebase'
import { isLocalTestMode } from '../lib/testMode'
import { localStore } from './localStore'
import { DEFAULT_GROUP_REASONS, DEFAULT_HOUSE_THRESHOLDS, type ActivityGroup, type GroupActivity, type GroupAwardRecord, type GroupReason, type GroupingTemplate, type MembershipEvent } from '../types/domain'

const base = (uid: string, classId: string) => ['teachers', uid, 'classes', classId] as const
export const operationId = () => crypto.randomUUID()

export function watchActivities(uid: string, classId: string, next: (items: GroupActivity[]) => void, error: (e: Error) => void): Unsubscribe {
  if (isLocalTestMode()) {
    return localStore.subscribe(`activities:${uid}:${classId}`, () => {
      next(localStore.getActivities(uid, classId))
    })
  }
  const { db } = requireFirebase()
  return onSnapshot(
    query(collection(db, ...base(uid, classId), 'activities'), orderBy('startedAt', 'desc')),
    (snap) => next(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as GroupActivity)),
    (err) => {
      console.warn('Firestore watchActivities error; falling back to local store', err)
      error(err)
      return localStore.subscribe(`activities:${uid}:${classId}`, () => next(localStore.getActivities(uid, classId)))
    }
  )
}

export function watchActivityGroups(uid: string, classId: string, activityId: string, next: (items: ActivityGroup[]) => void, error: (e: Error) => void): Unsubscribe {
  if (isLocalTestMode()) {
    return localStore.subscribe(`activityGroups:${uid}:${classId}:${activityId}`, () => {
      next(localStore.getActivityGroups(uid, classId, activityId))
    })
  }
  const { db } = requireFirebase()
  return onSnapshot(
    query(collection(db, ...base(uid, classId), 'activities', activityId, 'groups'), orderBy('createdAt')),
    (snap) => next(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ActivityGroup)),
    (err) => {
      console.warn('Firestore watchActivityGroups error; falling back to local store', err)
      error(err)
      return localStore.subscribe(`activityGroups:${uid}:${classId}:${activityId}`, () => next(localStore.getActivityGroups(uid, classId, activityId)))
    }
  )
}

export function watchGroupAwards(uid: string, classId: string, activityId: string, next: (items: GroupAwardRecord[]) => void, error: (e: Error) => void): Unsubscribe {
  if (isLocalTestMode()) {
    return localStore.subscribe(`groupAwards:${uid}:${classId}:${activityId}`, () => {
      next(localStore.getGroupAwards(uid, classId, activityId))
    })
  }
  const { db } = requireFirebase()
  return onSnapshot(
    query(collection(db, ...base(uid, classId), 'activities', activityId, 'groupAwards'), orderBy('createdAt', 'desc')),
    (snap) => next(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as GroupAwardRecord)),
    (err) => {
      console.warn('Firestore watchGroupAwards error; falling back to local store', err)
      error(err)
      return localStore.subscribe(`groupAwards:${uid}:${classId}:${activityId}`, () => next(localStore.getGroupAwards(uid, classId, activityId)))
    }
  )
}

export function watchMembershipEvents(uid: string, classId: string, activityId: string, next: (items: MembershipEvent[]) => void, error: (e: Error) => void): Unsubscribe {
  if (isLocalTestMode()) {
    return localStore.subscribe(`membershipEvents:${uid}:${classId}:${activityId}`, () => {
      next(localStore.getMembershipEvents(uid, classId, activityId))
    })
  }
  const { db } = requireFirebase()
  return onSnapshot(
    query(collection(db, ...base(uid, classId), 'activities', activityId, 'membershipEvents'), orderBy('createdAt', 'desc')),
    (snap) => next(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as MembershipEvent)),
    (err) => {
      console.warn('Firestore watchMembershipEvents error; falling back to local store', err)
      error(err)
      return localStore.subscribe(`membershipEvents:${uid}:${classId}:${activityId}`, () => next(localStore.getMembershipEvents(uid, classId, activityId)))
    }
  )
}

export function watchTemplates(uid: string, classId: string, next: (items: GroupingTemplate[]) => void, error: (e: Error) => void): Unsubscribe {
  if (isLocalTestMode()) {
    return localStore.subscribe(`templates:${uid}:${classId}`, () => {
      next(localStore.getTemplates(uid, classId))
    })
  }
  const { db } = requireFirebase()
  return onSnapshot(
    query(collection(db, ...base(uid, classId), 'groupingTemplates'), orderBy('createdAt', 'desc')),
    (snap) => next(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as GroupingTemplate)),
    (err) => {
      console.warn('Firestore watchTemplates error; falling back to local store', err)
      error(err)
      return localStore.subscribe(`templates:${uid}:${classId}`, () => next(localStore.getTemplates(uid, classId)))
    }
  )
}

export async function startActivity(uid: string, classId: string, title: string, participantIds: string[], excludedIds: string[], groups: DraftGroup[], requestId: string) {
  if (isLocalTestMode()) {
    return localStore.startActivity(uid, classId, title, participantIds, excludedIds, groups, requestId)
  }
  validateGrouping(participantIds, groups); if (!title.trim()) throw new Error('Activity name is required.')
  const { db } = requireFirebase(); const activityRef = doc(collection(db, ...base(uid, classId), 'activities')); const classRef = doc(db, ...base(uid, classId))
  await runTransaction(db, async (tx) => {
    const classSnap = await tx.get(classRef); if (!classSnap.exists() || classSnap.data().ownerId !== uid) throw new Error('Class not found.'); if (classSnap.data().archivedAt) throw new Error('Restore this class before starting an activity.'); if (classSnap.data().activeActivityId) throw new Error('This class already has an active group activity.')
    const studentRefs = participantIds.map((id) => doc(db, ...base(uid, classId), 'students', id)); const studentSnaps = await Promise.all(studentRefs.map((ref) => tx.get(ref))); if (studentSnaps.some((s) => !s.exists() || s.data().classId !== classId || s.data().ownerId !== uid)) throw new Error('The roster changed. Review participants before starting.')
    tx.set(activityRef, { ownerId: uid, classId, title: title.trim(), status: 'active', participantIds, excludedIds, groupIds: groups.map((g) => g.id), houseThresholds: DEFAULT_HOUSE_THRESHOLDS, groupReasons: DEFAULT_GROUP_REASONS, startedAt: serverTimestamp(), completedAt: null, completionRequestId: null, startRequestId: requestId })
    groups.forEach((group) => tx.set(doc(db, ...base(uid, classId), 'activities', activityRef.id, 'groups', group.id), { ownerId: uid, classId, activityId: activityRef.id, name: group.name.trim() || 'Group', memberIds: group.memberIds, initialMemberIds: group.memberIds, finalMemberIds: [], points: 0, lastMutationId: '', decorationSelections: [], createdAt: serverTimestamp(), updatedAt: serverTimestamp() }))
    tx.update(classRef, { activeActivityId: activityRef.id, updatedAt: serverTimestamp() })
  }); return activityRef.id
}

export async function moveMember(uid: string, classId: string, activityId: string, studentId: string, studentName: string, fromGroup: ActivityGroup, toGroup: ActivityGroup, requestId: string) {
  if (isLocalTestMode()) {
    localStore.moveMember(uid, classId, activityId, studentId, studentName, fromGroup, toGroup, requestId)
    return
  }
  if (fromGroup.id === toGroup.id) return
  const { db } = requireFirebase()
  await runTransaction(db, async (tx) => {
    const activityRef = doc(db, ...base(uid, classId), 'activities', activityId), fromRef = doc(db, ...base(uid, classId), 'activities', activityId, 'groups', fromGroup.id), toRef = doc(db, ...base(uid, classId), 'activities', activityId, 'groups', toGroup.id), eventRef = doc(db, ...base(uid, classId), 'activities', activityId, 'membershipEvents', requestId)
    const [a, f, t, e] = await Promise.all([tx.get(activityRef), tx.get(fromRef), tx.get(toRef), tx.get(eventRef)])
    if (e.exists()) return
    if (!a.exists() || a.data().status !== 'active') throw new Error('This activity is no longer active.')
    if (!f.data()?.memberIds.includes(studentId) || t.data()?.memberIds.includes(studentId)) throw new Error('Membership changed. Refresh and try again.')
    tx.update(fromRef, { memberIds: f.data()!.memberIds.filter((id: string) => id !== studentId), updatedAt: serverTimestamp() })
    tx.update(toRef, { memberIds: [...t.data()!.memberIds, studentId], updatedAt: serverTimestamp() })
    tx.set(eventRef, { ownerId: uid, classId, activityId, studentId, studentName, fromGroupId: fromGroup.id, fromGroupName: fromGroup.name, toGroupId: toGroup.id, toGroupName: toGroup.name, requestKey: requestId, createdAt: serverTimestamp() })
  })
}

export async function renameGroup(uid: string, classId: string, activityId: string, groupId: string, name: string) {
  if (isLocalTestMode()) {
    localStore.renameGroup(uid, classId, activityId, groupId, name)
    return
  }
  if (!name.trim()) throw new Error('Group name is required.')
  const { db } = requireFirebase()
  await updateDoc(doc(db, ...base(uid, classId), 'activities', activityId, 'groups', groupId), { name: name.trim(), updatedAt: serverTimestamp() })
}

export async function awardGroup(uid: string, classId: string, activityId: string, group: ActivityGroup, reason: GroupReason, requestId: string) {
  if (isLocalTestMode()) {
    localStore.awardGroup(uid, classId, activityId, group, reason, requestId)
    return
  }
  const { db } = requireFirebase()
  const groupRef = doc(db, ...base(uid, classId), 'activities', activityId, 'groups', group.id), awardRef = doc(db, ...base(uid, classId), 'activities', activityId, 'groupAwards', requestId)
  await runTransaction(db, async (tx) => {
    const [g, a] = await Promise.all([tx.get(groupRef), tx.get(awardRef)])
    if (a.exists()) return
    if (!g.exists()) throw new Error('Group not found.')
    const points = g.data().points + reason.points
    tx.update(groupRef, { points, lastMutationId: requestId, updatedAt: serverTimestamp() })
    tx.set(awardRef, { ownerId: uid, classId, activityId, groupId: group.id, groupName: g.data().name, amount: reason.points, reasonId: reason.id, reasonLabel: reason.label, requestKey: requestId, reversedBy: null, createdAt: serverTimestamp() })
  })
}

export async function reverseGroupAward(uid: string, classId: string, activityId: string, awardId: string) {
  if (isLocalTestMode()) {
    localStore.reverseGroupAward(uid, classId, activityId, awardId)
    return
  }
  const { db } = requireFirebase(); const reversalId = `reversal_${awardId}`
  await runTransaction(db, async (tx) => {
    const awardRef = doc(db, ...base(uid, classId), 'activities', activityId, 'groupAwards', awardId), reversalRef = doc(db, ...base(uid, classId), 'activities', activityId, 'groupReversals', reversalId)
    const [a, r] = await Promise.all([tx.get(awardRef), tx.get(reversalRef)])
    if (r.exists()) return
    if (!a.exists() || a.data().reversedBy) throw new Error('This award was already corrected.')
    const groupRef = doc(db, ...base(uid, classId), 'activities', activityId, 'groups', a.data().groupId), g = await tx.get(groupRef)
    if (!g.exists() || g.data().points < a.data().amount) throw new Error('Group total is inconsistent.')
    tx.update(groupRef, { points: g.data().points - a.data().amount, lastMutationId: reversalId, updatedAt: serverTimestamp() })
    tx.update(awardRef, { reversedBy: reversalId })
    tx.set(reversalRef, { ownerId: uid, classId, activityId, groupId: a.data().groupId, awardId, amount: a.data().amount, createdAt: serverTimestamp() })
  })
}

export async function selectDecoration(uid: string, classId: string, activityId: string, group: ActivityGroup, decoration: string) {
  if (isLocalTestMode()) {
    localStore.selectDecoration(uid, classId, activityId, group, decoration)
    return
  }
  const { db } = requireFirebase(); const ref = doc(db, ...base(uid, classId), 'activities', activityId, 'groups', group.id)
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref); if (!snap.exists()) throw new Error('Group not found.')
    const entitlements = getHouseProgress(snap.data().points, DEFAULT_HOUSE_THRESHOLDS).decorationEntitlements
    const selections: string[] = snap.data().decorationSelections || []
    if (selections.includes(decoration)) return
    if (selections.length >= entitlements) throw new Error('This group has no unused decoration entitlement.')
    tx.update(ref, { decorationSelections: [...selections, decoration], updatedAt: serverTimestamp() })
  })
}

export async function endActivity(uid: string, classId: string, activityId: string, requestId: string) {
  if (isLocalTestMode()) {
    localStore.endActivity(uid, classId, activityId, requestId)
    return
  }
  const { db } = requireFirebase(); const classRef = doc(db, ...base(uid, classId)), activityRef = doc(db, ...base(uid, classId), 'activities', activityId)
  await runTransaction(db, async (tx) => {
    const [c, a] = await Promise.all([tx.get(classRef), tx.get(activityRef)])
    if (!a.exists()) throw new Error('Activity not found.')
    if (a.data().status === 'completed') {
      if (a.data().completionRequestId === requestId) return
      throw new Error('This activity has already ended.')
    }
    if (c.data()?.activeActivityId !== activityId) throw new Error('This activity is not the active class activity.')
    const groupSnaps = await Promise.all((a.data().groupIds as string[]).map((id) => tx.get(doc(db, ...base(uid, classId), 'activities', activityId, 'groups', id))))
    groupSnaps.forEach((s) => tx.update(s.ref, { finalMemberIds: s.data()!.memberIds, updatedAt: serverTimestamp() }))
    tx.update(activityRef, { status: 'completed', completedAt: serverTimestamp(), completionRequestId: requestId })
    tx.update(classRef, { activeActivityId: null, updatedAt: serverTimestamp() })
  })
}

export async function saveTemplate(uid: string, classId: string, name: string, groups: ActivityGroup[] | DraftGroup[]) {
  if (isLocalTestMode()) {
    return localStore.saveTemplate(uid, classId, name, groups)
  }
  if (!name.trim()) throw new Error('Template name is required.')
  const { db } = requireFirebase()
  return addDoc(collection(db, ...base(uid, classId), 'groupingTemplates'), { ownerId: uid, classId, name: name.trim(), groups: groups.map((g) => ({ name: g.name, memberIds: g.memberIds })), createdAt: serverTimestamp() })
}

export async function loadActivityGroups(uid: string, classId: string, activityId: string) {
  if (isLocalTestMode()) {
    return localStore.getActivityGroups(uid, classId, activityId)
  }
  const { db } = requireFirebase()
  const snap = await getDocs(query(collection(db, ...base(uid, classId), 'activities', activityId, 'groups'), where('ownerId', '==', uid)))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ActivityGroup)
}
