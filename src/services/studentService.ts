import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, writeBatch, type Unsubscribe } from 'firebase/firestore'
import { requireFirebase } from '../lib/firebase'
import { isLocalTestMode } from '../lib/testMode'
import { localStore } from './localStore'
import type { Enrollment } from '../types/domain'

const studentsPath = (uid: string, classId: string) => collection(requireFirebase().db, 'teachers', uid, 'classes', classId, 'students')

export function watchStudents(uid: string, classId: string, next: (items: Enrollment[]) => void, error: (error: Error) => void): Unsubscribe {
  if (isLocalTestMode()) {
    return localStore.subscribe(`students:${uid}:${classId}`, () => {
      next(localStore.getStudents(uid, classId))
    })
  }
  return onSnapshot(
    query(studentsPath(uid, classId), orderBy('createdAt')),
    (snapshot) => next(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Enrollment)),
    (err) => {
      console.warn('Firestore watchStudents error; falling back to local store', err)
      error(err)
      return localStore.subscribe(`students:${uid}:${classId}`, () => next(localStore.getStudents(uid, classId)))
    }
  )
}

function studentData(uid: string, classId: string, name: string, fishName = '', fishStyle = Math.floor(Math.random() * 5)) {
  return { ownerId: uid, classId, name: name.trim(), displayName: name.trim(), fishName: fishName.trim(), fishStyle, points: 0, status: 'active', lastMutationId: '', createdAt: serverTimestamp(), updatedAt: serverTimestamp() }
}

export async function addStudent(uid: string, classId: string, name: string, fishName = '') {
  if (isLocalTestMode()) {
    return localStore.addStudent(uid, classId, name, fishName)
  }
  if (!name.trim()) throw new Error('Student name is required.')
  return addDoc(studentsPath(uid, classId), studentData(uid, classId, name, fishName))
}

export async function addStudents(uid: string, classId: string, names: string[]) {
  if (isLocalTestMode()) {
    localStore.addStudents(uid, classId, names)
    return
  }
  const clean = names.map((name) => name.trim()).filter(Boolean)
  if (!clean.length) throw new Error('Add at least one student name.')
  if (clean.length > 100) throw new Error('Add no more than 100 students at once.')
  const { db } = requireFirebase(); const batch = writeBatch(db)
  clean.forEach((name) => batch.set(doc(studentsPath(uid, classId)), studentData(uid, classId, name)))
  await batch.commit()
}

export async function updateStudent(uid: string, classId: string, studentId: string, input: { name: string; displayName: string; fishName: string }) {
  if (isLocalTestMode()) {
    localStore.updateStudent(uid, classId, studentId, input)
    return
  }
  if (!input.name.trim()) throw new Error('Student name is required.')
  await updateDoc(doc(studentsPath(uid, classId), studentId), { name: input.name.trim(), displayName: input.displayName.trim() || input.name.trim(), fishName: input.fishName.trim(), updatedAt: serverTimestamp() })
}

export async function updateStudentEvolutions(
  uid: string,
  classId: string,
  updates: Array<{ studentId: string; evolutionHistory: Record<string, string> }>
) {
  if (isLocalTestMode()) {
    localStore.updateStudentEvolutions(uid, classId, updates)
    return
  }
  const { db } = requireFirebase()
  const batch = writeBatch(db)
  updates.forEach(({ studentId, evolutionHistory }) => {
    const ref = doc(studentsPath(uid, classId), studentId)
    batch.update(ref, {
      evolutionHistory,
      updatedAt: serverTimestamp(),
    })
  })
  await batch.commit()
}

