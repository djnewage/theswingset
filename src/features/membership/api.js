import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '../../lib/firebase'

/**
 * Billing switches live in config/billing:
 *   chargingEnabled  — master switch; false = everyone rides free
 *   foundingCutoff   — set the moment charging first turns on; accounts
 *                      created before it are Founding Members (free for life)
 *   priceMonthly     — display price (the real price lives in Stripe)
 *   stripePriceId    — Stripe Price id used for checkout
 *   trialDays        — app-side trial length for post-cutoff accounts
 */
export async function fetchBillingConfig() {
  const snap = await getDoc(doc(db, 'config', 'billing'))
  return snap.exists() ? snap.data() : { chargingEnabled: false }
}

/** The viewer's own active/trialing Stripe subscription, if any. */
export async function fetchActiveSubscription(uid) {
  try {
    const snap = await getDocs(
      query(
        collection(db, 'customers', uid, 'subscriptions'),
        where('status', 'in', ['active', 'trialing']),
      ),
    )
    return snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() }
  } catch {
    return null // extension not installed yet / no customer doc
  }
}

/**
 * Resolves what the viewer's membership is right now.
 * A linked partner's subscription counts (one subscription per couple).
 */
export function resolveMembership({ config, profile, subscription, partnerSubscription }) {
  if (!config?.chargingEnabled) return { status: 'free-preview' }

  const cutoff = config.foundingCutoff?.toMillis?.()
  const created = profile?.createdAt?.toMillis?.()
  if (cutoff != null && created != null && created < cutoff) {
    return { status: 'founding' }
  }
  if (subscription) return { status: 'active', via: 'self' }
  if (partnerSubscription) return { status: 'active', via: 'partner' }

  const trialEndsMs = (created ?? 0) + (config.trialDays ?? 30) * 86_400_000
  if (Date.now() < trialEndsMs) {
    return { status: 'trial', trialEndsMs }
  }
  return { status: 'lapsed' }
}

/**
 * Starts Stripe Checkout via the firestore-stripe-payments extension:
 * writing a checkout_sessions doc makes the extension attach a session URL.
 */
export function startCheckout(uid, priceId) {
  const base = window.location.origin + import.meta.env.BASE_URL
  return addDoc(collection(db, 'customers', uid, 'checkout_sessions'), {
    price: priceId,
    success_url: `${base}membership`,
    cancel_url: `${base}membership`,
    allow_promotion_codes: true,
  }).then(
    (ref) =>
      new Promise((resolve, reject) => {
        const unsub = onSnapshot(ref, (snap) => {
          const { error, url } = snap.data() ?? {}
          if (error) {
            unsub()
            reject(new Error(error.message))
          } else if (url) {
            unsub()
            window.location.assign(url)
            resolve()
          }
        })
      }),
  )
}

/** Opens Stripe's hosted billing portal (cancel, change card, invoices). */
export async function openBillingPortal() {
  const createPortalLink = httpsCallable(
    functions,
    'ext-firestore-stripe-payments-createPortalLink',
  )
  const { data } = await createPortalLink({
    return_url: window.location.origin + import.meta.env.BASE_URL + 'membership',
  })
  window.location.assign(data.url)
}
