import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '../../lib/firebase'

// ---------- members ----------

export async function fetchAllUsers() {
  const snap = await getDocs(
    query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(200)),
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/**
 * Ban = disable the Firebase Auth account (server-side, via callable) AND
 * flag the profile doc. If the callable isn't deployed yet, we still set the
 * profile flag so the UI reflects the ban, and report that auth-disable is
 * pending.
 */
export async function setUserBanned(uid, banned) {
  try {
    const call = httpsCallable(functions, 'adminSetUserDisabled')
    await call({ uid, disabled: banned })
    return { authDisabled: true }
  } catch (err) {
    console.warn('adminSetUserDisabled callable failed; flagging profile only', err)
    await updateDoc(doc(db, 'users', uid), { banned })
    return { authDisabled: false }
  }
}

export async function setUserVerified(uid, verified) {
  await updateDoc(doc(db, 'users', uid), { verified })
}

// ---------- reports ----------

export async function fetchReports(status = 'open') {
  const snap = await getDocs(
    query(
      collection(db, 'reports'),
      where('status', '==', status),
      orderBy('createdAt', 'asc'),
      limit(100),
    ),
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function updateReportStatus(reportId, status, reviewerUid) {
  await updateDoc(doc(db, 'reports', reportId), {
    status, // 'resolved' | 'dismissed'
    reviewedBy: reviewerUid,
    reviewedAt: serverTimestamp(),
  })
}

/** Best-effort link for a report target so admins can eyeball it. */
export function reportTargetLink(report) {
  const id = report.targetId ?? ''
  if (report.targetType === 'post' && !id.includes(':')) return `/post/${id}`
  if (report.targetType === 'user') return `/u/${id}`
  if (report.targetType === 'couple') return `/c/${id}`
  if (id.startsWith('event:')) return `/events/${id.slice(6)}`
  if (id.startsWith('group:')) return `/groups/${id.slice(6).split('/')[0]}`
  return null
}
