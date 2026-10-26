import { NavLink, Outlet } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { isLocalTestMode } from '../lib/testMode'
import { localStore } from '../services/localStore'
import { Brand } from './Brand'

export function TeacherLayout() {
  const { user, signOutUser } = useAuth()
  const localTesting = isLocalTestMode()

  return (
    <div className="app-preview-shell private-shell">
      <aside className="app-sidebar">
        <Brand />
        <nav aria-label="Teacher application">
          <NavLink to="/app" end>
            ▦ <span>My classes</span>
          </NavLink>
        </nav>
        {localTesting && (
          <div style={{ padding: '0.75rem', margin: '0.5rem', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '6px', fontSize: '0.75rem', color: '#0284c7' }}>
            <b>🧪 Local Test Mode</b>
            <p style={{ margin: '0.25rem 0' }}>Testing locally before Firebase deploy.</p>
            <button
              type="button"
              style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem', border: '1px solid #0284c7', background: 'transparent', color: '#0284c7', borderRadius: '4px', cursor: 'pointer' }}
              onClick={() => {
                if (confirm('Reset local test data to starter class?')) {
                  localStore.resetAll()
                }
              }}
            >
              Reset Test Data
            </button>
          </div>
        )}
        <div className="sidebar-user">
          <span>{(user?.displayName || user?.email || 'T').slice(0, 2).toUpperCase()}</span>
          <p>
            <b>{user?.displayName || 'Teacher'}</b>
            <small>{user?.email}</small>
          </p>
          <button type="button" onClick={() => signOutUser()} aria-label="Sign out" title="Sign out">
            ↪
          </button>
        </div>
      </aside>
      <main id="main-content" className="dashboard-main">
        <Outlet />
      </main>
    </div>
  )
}
