import { doc, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore'
import { db } from '../../lib/firebase'

/**
 * Creates the users/{uid} document after signup or first Google sign-in.
 * dob is a "YYYY-MM-DD" string; caller must have already validated 18+.
 * inviteCode is a validated, active invite code — required by security rules
 * (invite-only community); it's stored for audit and is immutable afterward.
 */
export async function createUserProfile(uid, { displayName, dob, inviteCode, agreedToTerms = false }) {
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
    inviteCode: inviteCode ?? null,
    // Records acceptance of ToS/Privacy/Guidelines at signup (immutable —
    // not in the rules' allowed update keys).
    termsAcceptedAt: agreedToTerms ? serverTimestamp() : null,
    createdAt: serverTimestamp(),
  })
}
