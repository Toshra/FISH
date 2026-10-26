import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from './AuthContext'

export function ProtectedRoute() {
  const { user, loading, configured } = useAuth()
  const location = useLocation()
  if (loading) return <main className="route-state" aria-live="polite"><div className="loader" /><h1>Opening your teacher space…</h1></main>
  if (!configured) return <Navigate to="/sign-in" replace state={{ configurationMissing: true }} />
  if (!user) return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />
  return <Outlet />
}
