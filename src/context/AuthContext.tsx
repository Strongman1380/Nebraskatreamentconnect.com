import React, { createContext, useContext, useEffect, useState } from 'react'
import { getFirebaseAuth } from '../config/firebase'

export type UserRole = 'public' | 'provider' | 'admin'

interface AuthState {
  uid: string | null
  email: string | null
  role: UserRole
  facilityId: string | null
  loading: boolean
  error: string | null
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

async function fetchWhoami(token: string): Promise<{ isAdmin: boolean; facilityId: string | null }> {
  const res = await fetch('/api/whoami', {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) return { isAdmin: false, facilityId: null }
  return res.json()
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    uid: null,
    email: null,
    role: 'public',
    facilityId: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false
    const auth = getFirebaseAuth()

    const unsubscribe = auth.onAuthStateChanged(async user => {
      if (!user) {
        if (!cancelled) setState({ uid: null, email: null, role: 'public', facilityId: null, loading: false, error: null })
        return
      }

      try {
        const token = await user.getIdToken()
        const { isAdmin, facilityId } = await fetchWhoami(token)

        if (cancelled) return

        let role: UserRole = 'public'
        if (isAdmin) role = 'admin'
        else if (facilityId) role = 'provider'

        setState({
          uid: user.uid,
          email: user.email,
          role,
          facilityId,
          loading: false,
          error: null,
        })
      } catch (err) {
        if (!cancelled) {
          setState({ uid: user.uid, email: user.email, role: 'public', facilityId: null, loading: false, error: null })
        }
      }
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    setState(s => ({ ...s, loading: true, error: null }))
    try {
      const auth = getFirebaseAuth()
      await auth.signInWithEmailAndPassword(email, password)
      // onAuthStateChanged handles the rest
    } catch (err) {
      const msg = (err as Error).message || 'Sign in failed'
      setState(s => ({ ...s, loading: false, error: msg }))
      throw err
    }
  }

  const signOut = async () => {
    const auth = getFirebaseAuth()
    await auth.signOut()
    setState({ uid: null, email: null, role: 'public', facilityId: null, loading: false, error: null })
  }

  return (
    <AuthContext.Provider value={{ ...state, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
