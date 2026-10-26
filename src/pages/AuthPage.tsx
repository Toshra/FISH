import { type FormEvent, useState } from 'react'
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  browserLocalPersistence,
  browserSessionPersistence,
  updateProfile,
} from 'firebase/auth'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { getErrorMessage } from '../lib/errors'
import { requireFirebase } from '../lib/firebase'
import { isLocalTestMode } from '../lib/testMode'

type AuthMode = 'sign-in' | 'register' | 'recovery'
const copy = {
  'sign-in': { title: 'Welcome back, teacher.', subtitle: 'Sign in to open your private class aquariums.', button: 'Sign in securely' },
  register: { title: 'Create your teacher space.', subtitle: 'Set up your account, then create your first class aquarium.', button: 'Create teacher account' },
  recovery: { title: 'Reset your password.', subtitle: 'Receive a secure password-reset link by email.', button: 'Send reset instructions' },
}

export function AuthPage({ mode }: { mode: AuthMode }) {
  const { user, configured, signInLocal } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [saving, setSaving] = useState(false)
  const localTesting = isLocalTestMode()

  if (user && mode !== 'recovery') return <Navigate to="/app" replace />

  const handleQuickLogin = () => {
    signInLocal('crhain6@gmail.com', 'Teacher Rhain')
    navigate('/app', { replace: true })
  }

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    setNotice('')
    const data = new FormData(event.currentTarget)
    const email = String(data.get('email'))
    const password = String(data.get('password'))
    const name = String(data.get('name') ?? '')
    const remember = data.get('remember') === 'on'

    if (localTesting) {
      setSaving(true)
      setTimeout(() => {
        if (mode === 'recovery') {
          setNotice(`Password-reset instructions simulated for ${email} (Local Testing Mode).`)
        } else {
          signInLocal(email, name || 'Teacher Rhain')
          navigate((location.state as { from?: string } | null)?.from || '/app', { replace: true })
        }
        setSaving(false)
      }, 300)
      return
    }

    if (!configured) {
      setError('Firebase is not configured. Follow the README to start the local emulators or add your Firebase web configuration.')
      return
    }

    setSaving(true)
    try {
      const { auth } = requireFirebase()
      if (mode === 'recovery') {
        await sendPasswordResetEmail(auth, email)
        setNotice('Password-reset instructions were sent. Check your inbox and spam folder.')
      } else if (mode === 'register') {
        const result = await createUserWithEmailAndPassword(auth, email, password)
        await updateProfile(result.user, { displayName: name.trim() })
        navigate('/app', { replace: true })
      } else {
        await setPersistence(auth, remember ? browserLocalPersistence : browserSessionPersistence)
        await signInWithEmailAndPassword(auth, email, password)
        navigate((location.state as { from?: string } | null)?.from || '/app', { replace: true })
      }
    } catch (caught) {
      setError(getErrorMessage(caught))
    } finally {
      setSaving(false)
    }
  }

  const content = copy[mode]
  return (
    <section className="auth-page">
      <div className="auth-aside">
        <span className="eyebrow light">Your classroom, your pace</span>
        <h1>Small moments of effort become something learners can see.</h1>
        <blockquote>
          “A visual reminder that showing up, asking questions, and helping others all matter.”
          <small>— Fictional teacher perspective</small>
        </blockquote>
        <div className="auth-fish" aria-hidden="true">
          <span />
          <i>✦</i>
        </div>
      </div>
      <div className="auth-main">
        <div className="auth-card">
          <Link className="back-link" to="/">
            ← Back to home
          </Link>
          <span className="status-badge">
            {localTesting ? '🧪 Local Testing Mode Active' : 'Private teacher access'}
          </span>
          <h2>{content.title}</h2>
          <p>{content.subtitle}</p>

          {localTesting && mode === 'sign-in' && (
            <div style={{ margin: '1rem 0', padding: '0.875rem', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '8px' }}>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: '#0284c7', fontWeight: 600 }}>
                🧪 Safe Testing Mode Enabled (No Firebase Deploy Required)
              </p>
              <button
                type="button"
                className="button"
                style={{ width: '100%', background: '#0284c7' }}
                onClick={handleQuickLogin}
              >
                ⚡ 1-Click Sign In as Teacher Rhain (crhain6@gmail.com)
              </button>
            </div>
          )}

          {!configured && !localTesting && (
            <div className="integration-note" role="note">
              <span>ⓘ</span>
              <p>
                <b>Local setup needed.</b> Firebase credentials are absent. Start the Auth and Firestore emulators with the documented environment file to use these forms safely.
              </p>
            </div>
          )}

          <form onSubmit={submit}>
            {mode === 'register' && (
              <label>
                Display name
                <input type="text" name="name" autoComplete="name" defaultValue="Teacher Rhain" placeholder="e.g. Teacher Ana" required />
              </label>
            )}
            <label>
              Email address
              <input
                type="email"
                name="email"
                autoComplete="email"
                defaultValue={localTesting ? 'crhain6@gmail.com' : ''}
                placeholder="teacher@example.com"
                required
              />
            </label>
            {mode !== 'recovery' && (
              <label>
                Password
                <input
                  type="password"
                  name="password"
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  minLength={8}
                  defaultValue={localTesting ? 'rhain212' : ''}
                  placeholder="At least 8 characters"
                  required
                />
              </label>
            )}
            {mode === 'sign-in' && (
              <div className="form-meta">
                <label className="checkbox">
                  <input type="checkbox" name="remember" defaultChecked /> <span>Keep me signed in</span>
                </label>
                <Link to="/forgot-password">Forgot password?</Link>
              </div>
            )}
            <button className="button auth-button" type="submit" disabled={saving}>
              {saving ? 'Please wait…' : content.button} {!saving && <span>→</span>}
            </button>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            {notice && (
              <p className="form-success" role="status">
                {notice}
              </p>
            )}
          </form>

          {mode === 'sign-in' && (
            <p className="auth-switch">
              New to Grow &amp; Build? <Link to="/register">Create an account</Link>
            </p>
          )}
          {mode === 'register' && (
            <p className="auth-switch">
              Already have an account? <Link to="/sign-in">Sign in</Link>
            </p>
          )}
          {mode === 'recovery' && (
            <p className="auth-switch">
              <Link to="/sign-in">Return to sign in</Link>
            </p>
          )}
          <Link className="demo-link" to="/preview">
            View the fictional public dashboard preview →
          </Link>
        </div>
      </div>
    </section>
  )
}
