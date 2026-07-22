import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { sendEmailVerification } from 'firebase/auth'
import { useAuth } from './AuthContext'
import { AuthLayout } from './AuthLayout'

/**
 * Accounts created after this moment must verify their email before entering
 * the app. Earlier accounts (founder, early members, seeded test accounts)
 * are grandfathered so shipping this doesn't lock anyone out.
 */
const CUTOFF_MS = Date.parse('2026-07-22T19:29:00Z')

function isExempt(user, profile) {
  if (user.emailVerified) return true
  // Google (and any future OAuth) accounts arrive verified by the provider.
  if (user.providerData.some((p) => p.providerId !== 'password')) return true
  const createdMs = profile?.createdAt?.toMillis?.()
  return createdMs != null && createdMs < CUTOFF_MS
}

export function VerifyEmailGate() {
  const { user, profile, signOut } = useAuth()
  const [verified, setVerified] = useState(() => isExempt(user, profile))
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Poll while the user clicks the link in another tab/app.
  useEffect(() => {
    if (verified) return undefined
    const id = setInterval(async () => {
      await user.reload().catch(() => {})
      if (user.emailVerified) setVerified(true)
    }, 5000)
    return () => clearInterval(id)
  }, [verified, user])

  if (verified) return <Outlet />

  const resend = async () => {
    setError('')
    setBusy(true)
    try {
      await sendEmailVerification(user)
      setSent(true)
    } catch (err) {
      setError(
        err?.code === 'auth/too-many-requests'
          ? 'Too many attempts — wait a few minutes, then try again.'
          : 'Couldn’t send the email. Please try again.',
      )
    } finally {
      setBusy(false)
    }
  }

  const checkNow = async () => {
    setBusy(true)
    await user.reload().catch(() => {})
    if (user.emailVerified) setVerified(true)
    else setError('Not verified yet — click the link in the email first.')
    setBusy(false)
  }

  return (
    <AuthLayout title="Verify your email">
      <p className="text-sm leading-6 text-charcoal-300">
        We sent a verification link to{' '}
        <span className="font-semibold text-charcoal-100">{user.email}</span>.
        Click it, then come back here — this page updates automatically.
      </p>
      <p className="mt-2 text-xs text-charcoal-500">
        Check your spam folder if it doesn't arrive within a minute.
      </p>

      <div className="mt-5 flex flex-col gap-3">
        <button
          type="button"
          onClick={checkNow}
          disabled={busy}
          className="h-11 w-full rounded-2xl bg-gold-500 font-semibold text-charcoal-950 transition hover:bg-gold-400 disabled:opacity-50"
        >
          {busy ? 'One moment…' : "I've clicked the link"}
        </button>
        <button
          onClick={resend}
          disabled={busy || sent}
          className="h-11 w-full rounded-2xl bg-charcoal-800 text-sm font-medium text-charcoal-200 ring-1 ring-charcoal-600 hover:bg-charcoal-700 disabled:opacity-50"
        >
          {sent ? 'Sent — check your inbox' : 'Resend the email'}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      <button
        onClick={signOut}
        className="mt-4 w-full text-center text-sm text-charcoal-400 hover:text-charcoal-200"
      >
        Sign out
      </button>
    </AuthLayout>
  )
}
