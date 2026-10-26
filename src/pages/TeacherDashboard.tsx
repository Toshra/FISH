import { type FormEvent, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { Modal } from '../components/Modal'
import { getErrorMessage } from '../lib/errors'
import { createClass, setClassArchived, updateClass, watchClasses } from '../services/classService'
import type { TeacherClass } from '../types/domain'

export function TeacherDashboard() {
  const { user } = useAuth()
  const [classes, setClasses] = useState<TeacherClass[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showArchived, setShowArchived] = useState(false)
  const [editing, setEditing] = useState<TeacherClass | null | undefined>(undefined)
  const [saving, setSaving] = useState(false)

  useEffect(() => user ? watchClasses(user.uid, (items) => { setClasses(items); setLoading(false) }, (caught) => { setError(getErrorMessage(caught)); setLoading(false) }) : undefined, [user])
  const visible = useMemo(() => classes.filter((item) => showArchived ? Boolean(item.archivedAt) : !item.archivedAt), [classes, showArchived])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!user) return
    setSaving(true); setError('')
    const data = new FormData(event.currentTarget)
    const input = { name: String(data.get('name')), subject: String(data.get('subject')), grade: String(data.get('grade')) }
    try { if (editing) await updateClass(user.uid, editing.id, input); else await createClass(user.uid, input); setEditing(undefined) }
    catch (caught) { setError(getErrorMessage(caught)) }
    finally { setSaving(false) }
  }

  return <>
    <header className="dashboard-header"><div><span className="eyebrow">Teacher dashboard</span><h1>Your class aquariums</h1><p>Welcome, {user?.displayName || 'teacher'}. Each class keeps an independent roster and progress.</p></div><button className="button" type="button" onClick={() => setEditing(null)}>+ Create class</button></header>
    <div className="dashboard-toolbar"><div className="segmented"><button className={!showArchived ? 'active' : ''} onClick={() => setShowArchived(false)}>Active</button><button className={showArchived ? 'active' : ''} onClick={() => setShowArchived(true)}>Archived</button></div><span>{visible.length} {visible.length === 1 ? 'class' : 'classes'}</span></div>
    {error && <div className="state error-state" role="alert"><b>We couldn’t complete that request.</b><p>{error}</p><button onClick={() => location.reload()}>Retry</button></div>}
    {loading ? <div className="state"><div className="loader" /><p>Loading your private classes…</p></div> : visible.length === 0 ? <div className="state empty-state"><span>◌</span><h2>{showArchived ? 'No archived classes' : 'Create your first aquarium'}</h2><p>{showArchived ? 'Archived classes will appear here and can be restored.' : 'Add a class to begin building a private roster and individual fish.'}</p>{!showArchived && <button className="button" onClick={() => setEditing(null)}>Create a class</button>}</div> :
      <section className="class-grid private-class-grid">{visible.map((item) => <article className="class-card" key={item.id}><div className="class-aquarium teal"><span className="class-fish one">◀</span><span className="class-fish two">◀</span><span className="class-fish three">◀</span><i /></div><div className="class-content"><h2>{item.name}</h2><p>{[item.subject, item.grade].filter(Boolean).join(' · ') || 'Class aquarium'}</p><div className="card-actions">{!item.archivedAt && <><Link className="button" to={`/app/classes/${item.id}`}>Open aquarium →</Link><Link className="activity-link" to={`/app/classes/${item.id}/activities`}>Group activities</Link><Link className="activity-link" to={`/app/classes/${item.id}/challenges`}>Class challenges</Link></>}<button disabled={Boolean(item.archivedAt)} onClick={() => setEditing(item)}>Edit</button><button onClick={() => user && setClassArchived(user.uid, item.id, !item.archivedAt)}>{item.archivedAt ? 'Restore' : 'Archive'}</button></div></div></article>)}</section>}
    {editing !== undefined && <Modal title={editing ? 'Edit class' : 'Create a class'} onClose={() => setEditing(undefined)}><form className="stack-form" onSubmit={submit}><label>Class name<input name="name" defaultValue={editing?.name} required maxLength={80} /></label><label>Subject <span>(optional)</span><input name="subject" defaultValue={editing?.subject} maxLength={80} /></label><label>Grade or section <span>(optional)</span><input name="grade" defaultValue={editing?.grade} maxLength={80} /></label><div className="modal-actions"><button type="button" onClick={() => setEditing(undefined)}>Cancel</button><button className="button" disabled={saving}>{saving ? 'Saving…' : 'Save class'}</button></div></form></Modal>}
  </>
}
