import { doc, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'

/**
 * Creates the users/{uid} document after signup or first Google sign-in.
 * dob is a "YYYY-MM-DD" string; caller must have already validated 18+.
 */
export async function createUserProfile(uid, { displayName, dob }) {
  await setDoc(doc(db, 'users', uid), {
    displayName,
    firstName: '',
    lastName: '',
    dob: Timestamp.fromDate(new Date(`${dob}T00:00:00`)),
    bio: '',
    location: null, // city/region only — never exact address
    photoURL: null,
    coupleId: null,
    interests: [],
    visibility: 'members', // privacy by default
    verified: false,
    boundaries: null,
    messagePolicy: 'connections', // safest default for message gating
    prompts: [],
    createdAt: serverTimestamp(),
  })
}
