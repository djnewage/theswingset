import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { openBillingPortal, startCheckout } from './api'
import { useMembership } from './useMembership'

const daysLeft = (ms) => Math.max(0, Math.ceil((ms - Date.now()) / 86_400_000))

export function MembershipPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { loading, membership, config } = useMembership()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const act = async (fn) => {
    setError('')
    setBusy(true)
    try {
      await fn()
    } catch (err) {
      console.error(err)
      setError('Something went wrong — please try again.')
      setBusy(false)
    }
  }

  if (loading) {
    return <p className="px-4 pt-16 text-center text-sm text-charcoal-400">Loading…</p>
  }

  return (
    <div className="px-4 pt-6 pb-10">
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full text-charcoal-300 hover:bg-charcoal-800"
          aria-label="Back"
        >
          ←
        </button>
        <h1 className="text-xl font-semibold text-charcoal-50">Membership</h1>
      </div>

      {membership.status === 'free-preview' && (
        <Card
          emoji="🌱"
          title="Early member"
          body="The Swingset is free while the community grows. Members who are here before paid membership launches become Founding Members — free for life, as thanks for being early."
        />
      )}

      {membership.status === 'founding' && (
        <Card
          emoji="🏆"
          title="Founding Member"
          body="You were here before paid membership launched, so yours is free — for life. Thank you for taking a chance on this community early."
        />
      )}

      {membership.status === 'trial' && (
        <>
          <Card
            emoji="⏳"
            title={`Trial — ${daysLeft(membership.trialEndsMs)} day${daysLeft(membership.trialEndsMs) === 1 ? '' : 's'} left`}
            body={`After your trial, membership is $${config.priceMonthly ?? '12.99'}/month. One membership covers you and your linked partner. Cancel anytime.`}
          />
          <button
            onClick={() => act(() => startCheckout(user.uid, config.stripePriceId))}
            disabled={busy || !config.stripePriceId}
            className="mt-4 h-11 w-full rounded-2xl bg-gold-500 font-semibold text-charcoal-950 hover:bg-gold-400 disabled:opacity-50"
          >
            {busy ? 'Opening checkout…' : 'Subscribe now'}
          </button>
        </>
      )}

      {membership.status === 'active' && (
        <>
          <Card
            emoji="💛"
            title="Membership active"
            body={
              membership.via === 'partner'
                ? 'Covered by your partner’s subscription — one membership covers the couple.'
                : 'Thanks for funding a private, ad-free community. Manage your plan, payment method, or cancellation below.'
            }
          />
          {membership.via === 'self' && (
            <button
              onClick={() => act(openBillingPortal)}
              disabled={busy}
              className="mt-4 h-11 w-full rounded-2xl bg-charcoal-800 text-sm font-medium text-charcoal-200 ring-1 ring-charcoal-600 hover:bg-charcoal-700 disabled:opacity-50"
            >
              {busy ? 'Opening…' : 'Manage billing'}
            </button>
          )}
        </>
      )}

      {membership.status === 'lapsed' && (
        <>
          <Card
            emoji="🔒"
            title="Membership needed"
            body={`Your trial has ended. Membership is $${config.priceMonthly ?? '12.99'}/month, covers a linked couple, and keeps The Swingset ad-free and members-only.`}
          />
          <button
            onClick={() => act(() => startCheckout(user.uid, config.stripePriceId))}
            disabled={busy || !config.stripePriceId}
            className="mt-4 h-11 w-full rounded-2xl bg-gold-500 font-semibold text-charcoal-950 hover:bg-gold-400 disabled:opacity-50"
          >
            {busy ? 'Opening checkout…' : 'Continue membership'}
          </button>
        </>
      )}

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      <p className="mt-6 text-center text-xs text-charcoal-500">
        Payments are processed by Stripe. Statements show a discreet
        business name — never “The Swingset.”
      </p>
    </div>
  )
}

function Card({ emoji, title, body }) {
  return (
    <div className="rounded-2xl bg-charcoal-900 p-5 ring-1 ring-charcoal-800">
      <p className="text-3xl">{emoji}</p>
      <p className="mt-2 text-base font-semibold text-charcoal-50">{title}</p>
      <p className="mt-1 text-sm leading-6 text-charcoal-300">{body}</p>
    </div>
  )
}
