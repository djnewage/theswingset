/**
 * Discretion settings are DEVICE-LEVEL by design (localStorage, never synced
 * to the server): the whole point is protecting this device's screen.
 */
const KEY = 'discretion'

export function loadDiscretion() {
  try {
    return {
      pinHash: null,
      lockOnOpen: false,
      discreetNotifications: false,
      ...JSON.parse(localStorage.getItem(KEY) ?? '{}'),
    }
  } catch {
    return { pinHash: null, lockOnOpen: false, discreetNotifications: false }
  }
}

export function saveDiscretion(settings) {
  localStorage.setItem(KEY, JSON.stringify(settings))
}

export async function hashPin(pin) {
  const data = new TextEncoder().encode(`swingset-pin:${pin}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}
