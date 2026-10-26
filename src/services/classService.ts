import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, type Unsubscribe } from 'firebase/firestore'
import { requireFirebase } from '../lib/firebase'
import { isLocalTestMode } from '../lib/testMode'
import { localStore } from './localStore'
import { DEFAULT_REASONS, DEFAULT_THRESHOLDS, type TeacherClass } from '../types/domain'

const classesPath = (uid: string) => collection(requireFirebase().db, 'teachers', uid, 'classes')

export function watchClasses(uid: string, next: (items: TeacherClass[]) => void, error: (error: Error) => void): Unsubscribe {
  if (isLocalTestMode()) {
    return localStore.subscribe(`classes:${uid}`, () => {
      next(localStore.getClasses(uid))
    })
  }
  return onSnapshot(
    query(classesPath(uid), orderBy('createdAt', 'desc')),
    (snapshot) => next(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as TeacherClass)),
    (err) => {
      console.warn('Firestore watchClasses error; falling back to local store', err)
      error(err)
      return localStore.subscribe(`classes:${uid}`, () => next(localStore.getClasses(uid)))
    }
  )
}

export async function createClass(uid: string, input: { name: string; subject: string; grade: string }) {
  if (isLocalTestMode()) {
    return localStore.createClass(uid, input)
  }
  const cleanName = input.name.trim()
  if (!cleanName) throw new Error('Class name is required.')
  return addDoc(classesPath(uid), { ownerId: uid, name: cleanName, subject: input.subject.trim(), grade: input.grade.trim(), archivedAt: null, activeActivityId: null, activeChallengeId: null, aquariumDecorations: [], thresholds: DEFAULT_THRESHOLDS, reasons: DEFAULT_REASONS, createdAt: serverTimestamp(), updatedAt: serverTimestamp() })
}

export async function updateClass(uid: string, classId: string, input: { name: string; subject: string; grade: string }) {
  if (isLocalTestMode()) {
    localStore.updateClass(uid, classId, input)
    return
  }
  if (!input.name.trim()) throw new Error('Class name is required.')
  await updateDoc(doc(classesPath(uid), classId), { name: input.name.trim(), subject: input.subject.trim(), grade: input.grade.trim(), updatedAt: serverTimestamp() })
}

export async function setClassArchived(uid: string, classId: string, archived: boolean) {
  if (isLocalTestMode()) {
    localStore.setClassArchived(uid, classId, archived)
    return
  }
  await updateDoc(doc(classesPath(uid), classId), { archivedAt: archived ? serverTimestamp() : null, updatedAt: serverTimestamp() })
}

export async function updateClassConfiguration(uid: string, classId: string, thresholds: TeacherClass['thresholds'], reasons: TeacherClass['reasons']) {
  if (isLocalTestMode()) {
    localStore.updateClassConfiguration(uid, classId, thresholds, reasons)
    return
  }
  await updateDoc(doc(classesPath(uid), classId), { thresholds, reasons, updatedAt: serverTimestamp() })
}
