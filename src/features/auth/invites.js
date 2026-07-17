import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'

// Unambiguous alphabet (no 0/O/1/I) for codes people read off a screen.
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function normalizeInviteCode(raw) {
  return (raw ?? '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
}

/**
 * Checks a typed code before we create an account. A code doc's ID *is* the
 * code; `get` is public (rules) so this works pre-signup. Returns
 * { ok, code } or { ok: false, reason }.
 */
export async function validateInvite(rawCode) {
  const code = normalizeInviteCode(rawCode)
  if (!code) return { ok: false, reason: 'Enter your invite code to continue.' }

  let snap
  try {
    snap = await getDoc(doc(db, 'invites', code))
  } catch {
    return { ok: false, reason: 'Couldn’t check that code — please try again.' }
  }
  if (!snap.exists() || snap.data().active !== true) {
    return { ok: false, reason: 'That invite code isn’t valid.' }
  }
  const data = snap.data()
  if (data.maxUses != null && (data.useCount ?? 0) >= data.maxUses) {
    return { ok: false, reason: 'That invite code has already been used up.' }
  }
  return { ok: true, code }
}

/**
 * Burns one use after a successful signup. Best-effort: the account already
 * exists, and validateInvite() re-reads useCount so the cap still holds even
 * if this write is lost.
 */
export async function consumeInvite(code) {
  try {
    await updateDoc(doc(db, 'invites', code), { useCount: increment(1) })
  } catch {
    // Soft cap — ignore.
  }
}

// ---------- admin ----------

export async function createInvite(adminUid, { note = '', maxUses = null }) {
  const code = Array.from(
    crypto.getRandomValues(new Uint8Array(8)),
    (b) => CODE_ALPHABET[b % CODE_ALPHABET.length],
  ).join('')
  await setDoc(doc(db, 'invites', code), {
    active: true,
    useCount: 0,
    maxUses: maxUses ? Number(maxUses) : null,
    note: note.slice(0, 80),
    createdBy: adminUid,
    createdAt: serverTimestamp(),
  })
  return code
}

export async function listInvites() {
  const snap = await getDocs(query(collection(db, 'invites'), orderBy('createdAt', 'desc')))
  return snap.docs.map((d) => ({ code: d.id, ...d.data() }))
}

export async function setInviteActive(code, active) {
  await updateDoc(doc(db, 'invites', code), { active })
}
