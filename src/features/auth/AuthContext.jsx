import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signOut as fbSignOut } from 'firebase/auth'
import { doc, onSnapshot } from 'firebase/firestore'
import { auth, db } from '../../lib/firebase'

const AuthContext = createContext(null)

/**
 * Provides { user, profile, loading } app-wide.
 * - user: Firebase Auth user (null when signed out)
 * - profile: users/{uid} doc data (null until loaded / when missing)
 * - loading: true until both auth state and profile doc have resolved
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [authReady, setAuthReady] = useState(false)
  const [profileReady, setProfileReady] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u)
      setAuthReady(true)
      if (!u) setProfile(null)
    })
  }, [])

  useEffect(() => {
    if (!user) return undefined
    setProfileReady(false)
    const unsub = onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => {
        setProfile(snap.exists() ? { id: snap.id, ...snap.data() } : null)
        setProfileReady(true)
      },
      () => setProfileReady(true),
    )
    return unsub
  }, [user])

  const value = {
    user,
    profile,
    loading: !authReady || !profileReady,
    signOut: () => fbSignOut(auth),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
