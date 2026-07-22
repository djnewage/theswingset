import {
  addDoc,
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
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { db, storage } from '../../lib/firebase'
import { processImageForUpload } from '../../lib/images'

// ---------- profile ----------

export async function updateUserProfile(uid, patch) {
  await updateDoc(doc(db, 'users', uid), patch)
}

/** Strips EXIF/GPS via canvas re-encode, uploads, returns the download URL. */
export async function uploadProfilePhoto(uid, file) {
  const blob = await processImageForUpload(file, 1200)
  const storageRef = ref(storage, `users/${uid}/profile/avatar.jpg`)
  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' })
  return getDownloadURL(storageRef)
}

// ---------- couples ----------

function generateInviteCode() {
  // 8 chars, no ambiguous 0/O/1/I — unguessable enough to act as a capability.
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')
}

export async function fetchCouple(coupleId) {
  const snap = await getDoc(doc(db, 'couples', coupleId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function fetchUser(uid) {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

/** Creates a pending couple with just the current user, plus an invite code. */
export async function createCouple(uid, coupleName, location) {
  const coupleRef = await addDoc(collection(db, 'couples'), {
    partnerUids: [uid],
    coupleName,
    bio: '',
    coverPhotoURL: null,
    location: location ?? null,
    lookingFor: [],
    verified: false,
    boundaries: null,
    messagePolicy: 'connections',
    prompts: [],
    dualConsent: { connections: false, albums: false },
    createdAt: serverTimestamp(),
  })
  const code = await createInvite(uid, coupleRef.id)
  await updateDoc(doc(db, 'users', uid), { coupleId: coupleRef.id })
  return { coupleId: coupleRef.id, code }
}

export async function createInvite(uid, coupleId) {
  const code = generateInviteCode()
  await setDoc(doc(db, 'coupleInvites', code), {
    coupleId,
    createdBy: uid,
    createdAt: serverTimestamp(),
  })
  return code
}

/** Invite codes the current user has issued (rules require this exact filter). */
export async function fetchMyInvites(uid) {
  const snap = await getDocs(
    query(collection(db, 'coupleInvites'), where('createdBy', '==', uid)),
  )
  return snap.docs.map((d) => ({ code: d.id, ...d.data() }))
}

export async function deleteInvite(code) {
  await deleteDoc(doc(db, 'coupleInvites', code))
}

/**
 * Joins a couple using an invite code. The code is the capability: it resolves
 * to the coupleId, and security rules verify it server-side (the update must
 * carry usedInviteCode matching a live invite for this couple).
 */
export async function joinCoupleWithCode(uid, code) {
  const inviteSnap = await getDoc(doc(db, 'coupleInvites', code.trim().toUpperCase()))
  if (!inviteSnap.exists()) throw new Error('That invite code isn’t valid.')
  const { coupleId } = inviteSnap.data()

  const couple = await fetchCouple(coupleId)
  if (!couple) throw new Error('That couple no longer exists.')
  if (couple.partnerUids.includes(uid)) throw new Error('You’re already in this couple.')
  if (couple.partnerUids.length >= 2) throw new Error('That couple is already linked.')

  await updateDoc(doc(db, 'couples', coupleId), {
    partnerUids: [...couple.partnerUids, uid],
    usedInviteCode: inviteSnap.id,
    linkedAt: serverTimestamp(),
  })
  await updateDoc(doc(db, 'users', uid), { coupleId })
  await deleteDoc(inviteSnap.ref) // spend the code
  return coupleId
}

export async function updateCouple(coupleId, patch) {
  await updateDoc(doc(db, 'couples', coupleId), patch)
}

/**
 * Uploads a couple cover into the uploading partner's own space (avoids a
 * cross-service partner check in Storage rules). Only a partner can write the
 * couple doc's coverPhotoURL, so partner-only control still holds.
 */
export async function uploadCoupleCover(uid, coupleId, file) {
  const blob = await processImageForUpload(file, 2000)
  const storageRef = ref(storage, `users/${uid}/couple-cover/${coupleId}.jpg`)
  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' })
  return getDownloadURL(storageRef)
}

/** Removes the current user from the couple and clears their coupleId. */
export async function unlinkFromCouple(uid, couple) {
  const remaining = couple.partnerUids.filter((p) => p !== uid)
  if (remaining.length === 0) {
    await deleteDoc(doc(db, 'couples', couple.id))
  } else {
    await updateDoc(doc(db, 'couples', couple.id), { partnerUids: remaining })
  }
  await updateDoc(doc(db, 'users', uid), { coupleId: null })
}
