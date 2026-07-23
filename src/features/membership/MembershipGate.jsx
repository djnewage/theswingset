import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { AuthLayout } from '../auth/AuthLayout'
import { startCheckout } from './api'
import { useMembership } from './useMembership'

/**
 * Paywall. Passes everyone through while chargingEnabled is false, and
 * forever for Founding Members; otherwise blocks lapsed accounts with a
 * subscribe screen. Trials pass through untouched.
 */
export function MembershipGate() {
  const { loading, membership, config } = useMembership()

  if (loading) return null
  if (membership.status !== 'lapsed') return <Outlet />
  return <Paywall config={config} />
}

function Paywall({ config }) {
  const { user, signOut } = useAuth()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const subscribe = async () => {
    setError('')
    setBusy(true)
    try {
      await startCheckout(user.uid, config.stripePriceId)
    } catch (err) {
      console.error(err)
      setError('Couldn’t start checkout. Please try again.')
      setBusy(false)
    }
  }

  return (
    <AuthLayout title="Your trial has ended">
      <p className="text-sm leading-6 text-charcoal-300">
        The Swingset stays private, ad-free, and members-only because members
        fund it — not advertisers, and never your data.
      </p>
      <p className="mt-4 text-center">
        <span className="text-3xl font-bold text-charcoal-50">
          ${config.priceMonthly ?? '12.99'}
        </span>
        <span className="text-sm text-charcoal-400"> / month</span>
      </p>
      <p className="mt-1 text-center text-xs text-charcoal-500">
        One membership covers you and your linked partner. Cancel anytime.
      </p>
      <button
        onClick={subscribe}
        disabled={busy || !config.stripePriceId}
        className="mt-5 h-11 w-full rounded-2xl bg-gold-500 font-semibold text-charcoal-950 transition hover:bg-gold-400 disabled:opacity-50"
      >
        {busy ? 'Opening checkout…' : 'Continue membership'}
      </button>
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
