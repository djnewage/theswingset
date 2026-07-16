import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'

export async function fetchNotifications(uid) {
  const snap = await getDocs(
    query(
      collection(db, 'notifications', uid, 'items'),
      orderBy('createdAt', 'desc'),
      limit(50),
    ),
  )
  return snap.docs.map((d) => ({ id: d.id, ref: d.ref, ...d.data() }))
}

export async function hasUnread(uid) {
  const snap = await getDocs(
    query(
      collection(db, 'notifications', uid, 'items'),
      where('read', '==', false),
      limit(1),
    ),
  )
  return !snap.empty
}

export async function markAllRead(notifications) {
  const unread = notifications.filter((n) => !n.read)
  if (unread.length === 0) return
  const batch = writeBatch(db)
  unread.forEach((n) => batch.update(n.ref, { read: true }))
  await batch.commit()
}
