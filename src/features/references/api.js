import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'

/**
 * References are private-to-members text vouches. No star ratings — ever.
 * Rules allow them only between connected entities or people who shared an
 * event RSVP.
 */
export async function leaveReference(from, to, text, event = null) {
  await addDoc(collection(db, 'references'), {
    fromId: from.id,
    fromName: from.name,
    fromPhotoURL: from.photoURL ?? null,
    fromUids: from.uids,
    toId: to.id,
    toUids: to.uids,
    eventId: event?.id ?? null,
    eventTitle: event?.title ?? null,
    text,
    createdAt: serverTimestamp(),
  })
}

export async function fetchReferencesFor(toId) {
  const snap = await getDocs(
    query(collection(db, 'references'), where('toId', '==', toId)),
  )
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
}

export async function deleteReference(referenceId) {
  await deleteDoc(doc(db, 'references', referenceId))
}
