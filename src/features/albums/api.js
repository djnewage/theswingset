import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { db, storage } from '../../lib/firebase'
import { processImageForUpload } from '../../lib/images'

export const ACCESS_LEVELS = [
  {
    value: 'public-to-members',
    label: 'All members',
    description: 'Any signed-in member can view.',
  },
  {
    value: 'connections',
    label: 'Connections only',
    description: 'Only accepted connections can view.',
  },
  {
    value: 'request-only',
    label: 'Request to view',
    description: 'Members must ask; you approve each one.',
  },
]

export async function createAlbum(owner, { title, accessLevel }) {
  const albumRef = await addDoc(collection(db, 'albums'), {
    ownerId: owner.id,
    ownerType: owner.type,
    ownerName: owner.name,
    ownerUids: owner.uids,
    title,
    accessLevel,
    photoCount: 0,
    createdAt: serverTimestamp(),
  })
  return albumRef.id
}

export async function fetchAlbumsByOwner(ownerId) {
  const snap = await getDocs(
    query(collection(db, 'albums'), where('ownerId', '==', ownerId)),
  )
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
}

export async function fetchAlbum(albumId) {
  const snap = await getDoc(doc(db, 'albums', albumId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function deleteAlbum(albumId) {
  await deleteDoc(doc(db, 'albums', albumId))
}

// ---------- photos ----------

export async function uploadAlbumPhoto(album, file, uploaderUid) {
  const blob = await processImageForUpload(file, 2000)
  const path = `albums/${uploaderUid}/${crypto.randomUUID()}.jpg`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' })
  const url = await getDownloadURL(storageRef)
  await addDoc(collection(db, 'albums', album.id, 'photos'), {
    url,
    path,
    uploadedBy: uploaderUid,
    createdAt: serverTimestamp(),
  })
}

/** Throws permission-denied when the viewer lacks access — callers treat that as "locked". */
export async function fetchAlbumPhotos(albumId) {
  const snap = await getDocs(
    query(collection(db, 'albums', albumId, 'photos'), orderBy('createdAt', 'desc')),
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function deleteAlbumPhoto(albumId, photoId) {
  await deleteDoc(doc(db, 'albums', albumId, 'photos', photoId))
}

// ---------- grants ----------

export async function requestAlbumAccess(albumId, requester) {
  await setDoc(doc(db, 'albums', albumId, 'grants', requester.uid), {
    uid: requester.uid,
    name: requester.name,
    photoURL: requester.photoURL ?? null,
    status: 'requested',
    createdAt: serverTimestamp(),
  })
}

export async function fetchMyGrant(albumId, uid) {
  const snap = await getDoc(doc(db, 'albums', albumId, 'grants', uid))
  return snap.exists() ? snap.data() : null
}

export async function fetchGrantRequests(albumId) {
  const snap = await getDocs(collection(db, 'albums', albumId, 'grants'))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

/**
 * Approve/deny an access request. Couple-owned albums with dual consent
 * enabled require BOTH partners to approve before access is granted.
 */
export async function respondToGrant(album, grant, approverUid, approve, ownerCouple) {
  const ref = doc(db, 'albums', album.id, 'grants', grant.uid)
  if (!approve) {
    await deleteDoc(ref)
    return { done: true }
  }

  const dualConsent =
    album.ownerType === 'couple' && ownerCouple?.dualConsent?.albums === true

  const approvals = { ...(grant.approvals ?? {}), [approverUid]: true }
  const bothApproved =
    !dualConsent || album.ownerUids.every((p) => approvals[p])

  if (bothApproved) {
    await updateDoc(ref, { status: 'granted', approvals })
    return { done: true }
  }
  await updateDoc(ref, { status: 'requested', approvals })
  return { done: false, waitingForPartner: true }
}
