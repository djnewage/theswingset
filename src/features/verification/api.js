import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { db, storage } from '../../lib/firebase'
import { processImageForUpload } from '../../lib/images'

/** One-time code the member must hand-write/display in their selfie. */
export function generateVerificationCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(6))
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')
}

/**
 * Submits a verification selfie for a user or couple. The image goes to the
 * locked verifications/ Storage path (admin-read-only).
 */
export async function submitVerification(subject, uploaderUid, file, code) {
  const blob = await processImageForUpload(file, 1600)
  const imagePath = `verifications/${uploaderUid}/${crypto.randomUUID()}.jpg`
  await uploadBytes(ref(storage, imagePath), blob, { contentType: 'image/jpeg' })

  await addDoc(collection(db, 'verifications'), {
    subjectId: subject.id,
    subjectType: subject.type,
    subjectName: subject.name,
    subjectUids: subject.uids,
    imagePath,
    code,
    status: 'pending',
    createdAt: serverTimestamp(),
  })
}

export async function fetchMyVerifications(uid) {
  const snap = await getDocs(
    query(
      collection(db, 'verifications'),
      where('subjectUids', 'array-contains', uid),
    ),
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// ---------- admin ----------

export async function isAdminUser(uid) {
  try {
    const snap = await getDoc(doc(db, 'admins', uid))
    return snap.exists()
  } catch {
    return false
  }
}

export async function fetchPendingVerifications() {
  const snap = await getDocs(
    query(
      collection(db, 'verifications'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'asc'),
    ),
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export function verificationImageURL(imagePath) {
  return getDownloadURL(ref(storage, imagePath))
}

/** Approve/reject; approval also flips the badge on the subject profile. */
export async function reviewVerification(verification, reviewerUid, approve) {
  await updateDoc(doc(db, 'verifications', verification.id), {
    status: approve ? 'approved' : 'rejected',
    reviewedBy: reviewerUid,
    reviewedAt: serverTimestamp(),
  })
  if (approve) {
    const target =
      verification.subjectType === 'couple'
        ? doc(db, 'couples', verification.subjectId)
        : doc(db, 'users', verification.subjectId)
    await updateDoc(target, { verified: true })
  }
}
