import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { onAuthStateChanged, signOut, type User } from 'firebase/auth'
import { auth, firebaseConfigured } from '../lib/firebase'
import { isLocalTestMode } from '../lib/testMode'

export interface AppUser {
  uid: string
  email: string | null
  displayName: string | null
}

interface AuthState {
  user: AppUser | null
  loading: boolean
  configured: boolean
  signInLocal: (email: string, displayName?: string) => void
  signOutUser: () => Promise<void>
}

const LOCAL_USER_KEY = 'grow_build_local_user'

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  configured: firebaseConfigured,
  signInLocal: () => undefined,
  signOutUser: async () => undefined,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(() => {
    if (typeof window !== 'undefined' && isLocalTestMode()) {
      const stored = localStorage.getItem(LOCAL_USER_KEY)
      if (stored) {
        try {
          return JSON.parse(stored) as AppUser
        } catch {
          // Ignore parse errors
        }
      }
    }
    return null
  })

  const [loading, setLoading] = useState(() => !isLocalTestMode() && Boolean(auth))

  useEffect(() => {
    if (!auth || isLocalTestMode()) return
    return onAuthStateChanged(auth, (next: User | null) => {
      setUser(next ? { uid: next.uid, email: next.email, displayName: next.displayName } : null)
      setLoading(false)
    })
  }, [])

  const signInLocal = (email: string, displayName = 'Teacher Rhain') => {
    const localUser: AppUser = {
      uid: 'teacher-rhain',
      email: email.trim() || 'crhain6@gmail.com',
      displayName: displayName.trim() || 'Teacher Rhain',
    }
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(localUser))
    }
    setUser(localUser)
    setLoading(false)
  }

  const signOutUser = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_USER_KEY)
    }
    setUser(null)
    if (auth) {
      try {
        await signOut(auth)
      } catch {
        // Ignore signout error if offline
      }
    }
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      configured: firebaseConfigured || isLocalTestMode(),
      signInLocal,
      signOutUser,
    }),
    [user, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)
