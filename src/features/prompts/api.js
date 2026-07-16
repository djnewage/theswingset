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

/** React to someone's icebreaker prompt — the warm alternative to a cold DM. */
export async function sendPromptReaction(from, target, { prompt, emoji, text }) {
  await addDoc(collection(db, 'promptReactions'), {
    fromId: from.uid,
    fromName: from.name,
    fromPhotoURL: from.photoURL ?? null,
    toId: target.id,
    toUids: target.uids,
    prompt,
    emoji,
    text: text ?? '',
    createdAt: serverTimestamp(),
  })
}

export async function fetchMyReactions(uid) {
  const snap = await getDocs(
    query(collection(db, 'promptReactions'), where('toUids', 'array-contains', uid)),
  )
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
}

export async function deleteReaction(reactionId) {
  await deleteDoc(doc(db, 'promptReactions', reactionId))
}
