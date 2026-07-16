import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { connectionId, fetchConnection } from '../connections/api'

/**
 * DM threads link two ENTITIES (a user or a couple on each side), mirroring
 * connections: a linked member always messages as their couple. Doc id is
 * the sorted pair `${a}_${b}`, so one thread can ever exist per pair and
 * rules can address it from either side.
 */
export const threadIdFor = connectionId

/**
 * Client-side mirror of the server-side policy check in firestore.rules —
 * used to render the Message button state; rules are the enforcement.
 * `me` is { entity: {type,id,uids,name,photoURL}, verified } for the sender's
 * primary identity; `target` is the recipient profile/couple doc (with id).
 * Returns null when allowed, else a short human reason.
 */
export function messageBlockReason({ me, target, targetType, connections }) {
  const policy = target.messagePolicy ?? 'connections'
  if (policy === 'everyone') return null
  if (policy === 'couples') {
    return me.entity.type === 'couple' ? null : 'Accepts messages from couples only'
  }
  if (policy === 'verified') {
    return me.verified ? null : 'Accepts messages from verified members only'
  }
  // 'connections'
  const connected = connections?.some(
    (c) =>
      c.status === 'accepted' &&
      ((c.fromId === me.entity.id && c.toId === target.id) ||
        (c.toId === me.entity.id && c.fromId === target.id)),
  )
  return connected ? null : 'Accepts messages from connections only'
}

/**
 * Opens (or creates) the thread between my entity and theirs; returns the
 * thread id. Thread docs carry denormalized entity cards for list rendering.
 */
export async function ensureThread(myEntity, theirEntity) {
  const id = threadIdFor(myEntity.id, theirEntity.id)
  const ref = doc(db, 'threads', id)
  if ((await getDoc(ref)).exists()) return id

  const [a, b] = [myEntity, theirEntity].sort((x, y) => (x.id < y.id ? -1 : 1))
  await setDoc(ref, {
    entityIds: [a.id, b.id],
    createdBy: myEntity.id,
    memberUids: [...new Set([...myEntity.uids, ...theirEntity.uids])],
    entities: {
      [a.id]: { type: a.type, name: a.name, photoURL: a.photoURL ?? null, uids: a.uids },
      [b.id]: { type: b.type, name: b.name, photoURL: b.photoURL ?? null, uids: b.uids },
    },
    lastMessage: null,
    lastReadAt: {},
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return id
}

/** Sends a message and bumps the thread's lastMessage/updatedAt. */
export async function sendMessage(threadId, { senderUid, senderEntityId, senderName, text }) {
  await setDoc(doc(collection(db, 'threads', threadId, 'messages')), {
    senderUid,
    senderEntityId,
    senderName,
    text,
    createdAt: serverTimestamp(),
  })
  await updateDoc(doc(db, 'threads', threadId), {
    lastMessage: { text: text.slice(0, 120), senderUid, senderName, at: serverTimestamp() },
    updatedAt: serverTimestamp(),
  })
}

/** Marks the thread read for this uid (drives unread badges). */
export async function markThreadRead(threadId, uid) {
  await updateDoc(doc(db, 'threads', threadId), {
    [`lastReadAt.${uid}`]: serverTimestamp(),
  })
}

/** Live thread list for a member, newest activity first. */
export function listenThreads(uid, onChange) {
  return onSnapshot(
    query(
      collection(db, 'threads'),
      where('memberUids', 'array-contains', uid),
      orderBy('updatedAt', 'desc'),
      limit(100),
    ),
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
  )
}

/** Live messages for a thread, oldest first. */
export function listenMessages(threadId, onChange) {
  return onSnapshot(
    query(
      collection(db, 'threads', threadId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(500),
    ),
    (snap) => onChange(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
  )
}

/** True when the thread has activity newer than my last read. */
export function isThreadUnread(thread, uid) {
  if (!thread.lastMessage || thread.lastMessage.senderUid === uid) return false
  const readAt = thread.lastReadAt?.[uid]
  if (!readAt) return true
  return (thread.lastMessage.at?.toMillis() ?? 0) > readAt.toMillis()
}

export { fetchConnection }
