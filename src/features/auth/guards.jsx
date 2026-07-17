import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

function FullScreenSpinner() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-charcoal-950">
      <img src={`${import.meta.env.BASE_URL}pineapple.svg`} alt="Loading" className="h-12 w-12 animate-bounce" />
    </div>
  )
}

/** Requires a signed-in Firebase user; otherwise redirects to /login. */
export function RequireAuth() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <FullScreenSpinner />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}

/**
 * Requires a completed users/{uid} profile (which includes the verified DOB).
 * Google first-timers land here without one and get sent to /welcome.
 */
export function RequireProfile() {
  const { profile, loading, signOut } = useAuth()
  if (loading) return <FullScreenSpinner />
  if (!profile) return <Navigate to="/welcome" replace />
  if (profile.banned) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-charcoal-950 px-6 text-center">
        <h1 className="text-xl font-semibold text-charcoal-50">Account suspended</h1>
        <p className="mt-2 max-w-xs text-sm text-charcoal-400">
          This account was suspended for violating community guidelines.
        </p>
        <button
          onClick={signOut}
          className="mt-6 h-11 rounded-2xl bg-charcoal-800 px-6 font-medium text-charcoal-200 ring-1 ring-charcoal-600"
        >
          Sign out
        </button>
      </div>
    )
  }
  return <Outlet />
}

/** Keeps signed-in users out of /login and /signup. */
export function RedirectIfAuthed() {
  const { user, loading } = useAuth()
  if (loading) return <FullScreenSpinner />
  if (user) return <Navigate to="/" replace />
  return <Outlet />
}
