import { deleteDoc, doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'

const PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

export function pushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from([...raw], (c) => c.charCodeAt(0))
}

/** Stable doc id per device: hash of the subscription endpoint. */
async function endpointId(endpoint) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint))
  return [...new Uint8Array(digest)].slice(0, 16).map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Asks permission, subscribes this device, and stores the subscription under
 * users/{uid}/pushSubs. `discreet` controls whether pushes to THIS device
 * show real text or just "New activity" (decided server-side per device).
 * Returns 'enabled' | 'denied' | 'unsupported' | 'error'.
 */
export async function enablePush(uid, { discreet = false } = {}) {
  if (!pushSupported() || !PUBLIC_KEY) return 'unsupported'
  try {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return 'denied'

    const reg = await navigator.serviceWorker.ready
    const subscription =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_KEY),
      }))

    const id = await endpointId(subscription.endpoint)
    await setDoc(doc(db, 'users', uid, 'pushSubs', id), {
      subscription: subscription.toJSON(),
      discreet,
      userAgent: navigator.userAgent.slice(0, 120),
      createdAt: serverTimestamp(),
    })
    return 'enabled'
  } catch (err) {
    console.error('enablePush failed', err)
    return 'error'
  }
}

/** Unsubscribes this device and removes its stored subscription. */
export async function disablePush(uid) {
  try {
    const reg = await navigator.serviceWorker.ready
    const subscription = await reg.pushManager.getSubscription()
    if (subscription) {
      await deleteDoc(doc(db, 'users', uid, 'pushSubs', await endpointId(subscription.endpoint)))
      await subscription.unsubscribe()
    }
  } catch (err) {
    console.error('disablePush failed', err)
  }
}

/** Whether THIS device currently has an active push subscription. */
export async function pushEnabledHere() {
  if (!pushSupported()) return false
  if (Notification.permission !== 'granted') return false
  const reg = await navigator.serviceWorker.ready
  return !!(await reg.pushManager.getSubscription())
}
