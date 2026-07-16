import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'

/**
 * Connections link two entities (a user or a couple on each side).
 * Doc ID is the UNORDERED pair `${idA}_${idB}` with ids sorted, so a given
 * pair can only ever have one connection doc and security rules can look it
 * up by id from either direction.
 */
export function connectionId(aId, bId) {
  return [aId, bId].sort().join('_')
}

export async function sendConnectionRequest(from, to) {
  await setDoc(doc(db, 'connections', connectionId(from.id, to.id)), {
    fromId: from.id,
    fromType: from.type,
    fromName: from.name,
    fromPhotoURL: from.photoURL ?? null,
    fromUids: from.uids,
    toId: to.id,
    toType: to.type,
    toName: to.name,
    toPhotoURL: to.photoURL ?? null,
    toUids: to.uids,
    pairUids: [...new Set([...from.uids, ...to.uids])],
    status: 'pending',
    createdAt: serverTimestamp(),
  })
}

export async function fetchConnection(aId, bId) {
  const snap = await getDoc(doc(db, 'connections', connectionId(aId, bId)))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

/**
 * Accept or decline a request. When the receiving side is a couple with
 * dual consent enabled, each partner's accept registers an approval; the
 * connection completes only once both have approved.
 */
export async function respondToRequest(connection, { uid, myCouple }, accept) {
  if (!accept) {
    await deleteDoc(doc(db, 'connections', connection.id))
    return { done: true }
  }

  const dualConsent =
    connection.toType === 'couple' &&
    myCouple?.id === connection.toId &&
    myCouple?.dualConsent?.connections === true

  const approvals = { ...(connection.approvals ?? {}), [uid]: true }
  const bothApproved =
    !dualConsent || myCouple.partnerUids.every((p) => approvals[p])

  if (bothApproved) {
    await updateDoc(doc(db, 'connections', connection.id), {
      status: 'accepted',
      approvals,
      acceptedAt: serverTimestamp(),
    })
    return { done: true }
  }
  await updateDoc(doc(db, 'connections', connection.id), { approvals })
  return { done: false, waitingForPartner: true }
}

export async function removeConnection(id) {
  await deleteDoc(doc(db, 'connections', id))
}

/** Every connection involving me (as user or via my couple). */
export async function fetchMyConnections(uid) {
  const snap = await getDocs(
    query(collection(db, 'connections'), where('pairUids', 'array-contains', uid)),
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/** True when either of my identities has an accepted connection with entityId. */
export function isConnectedTo(connections, myIds, entityId) {
  return connections.some(
    (c) =>
      c.status === 'accepted' &&
      ((myIds.includes(c.fromId) && c.toId === entityId) ||
        (myIds.includes(c.toId) && c.fromId === entityId)),
  )
}
