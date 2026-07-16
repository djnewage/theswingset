/**
 * Seeds fake members for local testing: 3 linked couples + 2 singles, with
 * bios, interests, boundaries, and icebreaker prompts — created through the
 * same client-SDK path (and security rules) as real signups.
 *
 * Usage:  node scripts/seed-test-users.mjs
 *
 * Respects VITE_USE_EMULATORS in .env. Re-runnable: existing accounts are
 * signed into instead of recreated. All accounts share TEST_PASSWORD.
 */
import { readFileSync } from 'node:fs'
import { initializeApp } from 'firebase/app'
import {
  connectAuthEmulator,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import {
  addDoc,
  collection,
  connectFirestoreEmulator,
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore'

const TEST_PASSWORD = 'SwingsetTest!23'

// ---------- config from .env ----------

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    }),
)

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
})
const auth = getAuth(app)
const db = getFirestore(app)

if (env.VITE_USE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
  console.log('→ using emulators')
} else {
  console.log(`→ using LIVE project: ${env.VITE_FIREBASE_PROJECT_ID}`)
}

// ---------- fake members ----------
// interests/boundaries/prompts use only values that exist in
// src/features/profiles/{constants,boundaries}.js and prompts/promptList.js

const USERS = [
  {
    email: 'test.alex@example.com',
    displayName: 'Alex R',
    dob: '1990-04-12',
    bio: 'Half of A&J. Cocktail nerd, terrible at pool, great at karaoke.',
    location: 'Milwaukee, WI',
    interests: ['Dinner dates', 'Cocktails', 'New friends first', 'Same-room'],
    boundaries: { playStyle: 'soft', roomPreference: 'same-room', openTo: 'couples-only', smoking: 'no', drinking: 'socially', boundariesText: 'Friends first, always. We move slow.' },
    prompts: [
      { prompt: 'Our perfect first meet is…', answer: 'Cocktails somewhere dim in the Third Ward.' },
      { prompt: 'Ask us about…', answer: 'The karaoke incident of 2024.' },
    ],
    messagePolicy: 'connections',
    couple: 'aj',
  },
  {
    email: 'test.jordan@example.com',
    displayName: 'Jordan R',
    dob: '1991-09-30',
    bio: 'The other half of A&J. I pick the playlist, Alex picks the bar.',
    location: 'Milwaukee, WI',
    interests: ['Dancing', 'Concerts', 'House parties'],
    boundaries: { playStyle: 'soft', roomPreference: 'same-room', openTo: 'couples-only', smoking: 'no', drinking: 'socially', boundariesText: '' },
    prompts: [{ prompt: 'Together we’re weirdly good at…', answer: 'Bar trivia. Undefeated since March.' }],
    messagePolicy: 'connections',
    couple: 'aj',
  },
  {
    email: 'test.sam@example.com',
    displayName: 'Sam T',
    dob: '1986-01-22',
    bio: 'Wauwatosa homebodies who occasionally escape for hotel takeovers.',
    location: 'Wauwatosa, WI',
    interests: ['Hotel takeovers', 'Games & game nights', 'Full swap'],
    boundaries: { playStyle: 'full', roomPreference: 'either', openTo: 'open-to-singles', smoking: 'socially', drinking: 'yes', boundariesText: 'Communication is everything. Ask us anything.' },
    prompts: [
      { prompt: 'The most fun we’ve had at a party was…', answer: 'The blackout Uno tournament. Ask Riley.' },
      { prompt: 'Our non-negotiable is…', answer: 'Both of us in every conversation from the start.' },
    ],
    messagePolicy: 'anyone',
    couple: 'sr',
  },
  {
    email: 'test.riley@example.com',
    displayName: 'Riley T',
    dob: '1988-07-04',
    bio: 'Board game shelf is alphabetized. The other shelf is not.',
    location: 'Wauwatosa, WI',
    interests: ['Games & game nights', 'Beach days', 'Travel'],
    boundaries: { playStyle: 'full', roomPreference: 'either', openTo: 'open-to-singles', smoking: 'socially', drinking: 'yes', boundariesText: '' },
    prompts: [{ prompt: 'You’ll win us over by…', answer: 'Bringing a game we haven’t played.' }],
    messagePolicy: 'anyone',
    couple: 'sr',
  },
  {
    email: 'test.casey@example.com',
    displayName: 'Casey M',
    dob: '1994-11-15',
    bio: 'Madison transplants. Testing the "connections" visibility setting.',
    location: 'Madison, WI',
    interests: ['Clubs & events', 'Voyeur / exhibition', 'Dancing'],
    boundaries: { playStyle: 'social', roomPreference: 'either', openTo: 'couples-only', smoking: 'no', drinking: 'socially', boundariesText: 'Social only while we find our footing here.' },
    prompts: [{ prompt: 'We joined this community because…', answer: 'New city, old us. Looking for our people.' }],
    messagePolicy: 'connections',
    visibility: 'connections', // ← tests the hidden-profile path
    couple: 'cm',
  },
  {
    email: 'test.morgan@example.com',
    displayName: 'Morgan M',
    dob: '1995-02-27',
    bio: 'The quieter half. Casey does the talking, I do the listening.',
    location: 'Madison, WI',
    interests: ['Concerts', 'Dinner dates'],
    boundaries: null,
    prompts: [],
    messagePolicy: 'connections',
    couple: 'cm',
  },
  {
    email: 'test.nina@example.com',
    displayName: 'Nina V',
    dob: '1992-06-08',
    bio: 'Single, social, and extremely here for the pineapple jokes. 🍍',
    location: 'Milwaukee, WI',
    interests: ['House parties', 'Cocktails', 'Dancing', 'New friends first'],
    boundaries: { playStyle: 'social', roomPreference: null, openTo: null, smoking: 'no', drinking: 'socially', boundariesText: 'Here for the community first.' },
    prompts: [
      { prompt: 'A perfect Saturday night looks like…', answer: 'Rooftop drinks, then whoever’s hosting.' },
      { prompt: 'Green flags we look for…', answer: 'Couples who like each other. You’d be surprised.' },
    ],
    messagePolicy: 'anyone',
  },
  {
    email: 'test.marcus@example.com',
    displayName: 'Marcus D',
    dob: '1984-12-03',
    bio: 'Chicago-based, in Milwaukee most weekends. Verified gentleman, pending the badge.',
    location: 'Chicago, IL',
    interests: ['Travel', 'Dinner dates', 'Clubs & events'],
    boundaries: { playStyle: 'soft', roomPreference: 'separate-room', openTo: null, smoking: 'no', drinking: 'socially', boundariesText: '' },
    prompts: [{ prompt: 'Ask us about…', answer: 'The best steakhouse in either city. I have opinions.' }],
    messagePolicy: 'connections',
  },
]

const COUPLES = {
  aj: {
    coupleName: 'Alex & Jordan',
    bio: 'Married 6 years, in the lifestyle for 2. Slow burn, big laughs.',
    location: 'Milwaukee, WI',
    lookingFor: ['Couples', 'Events & parties'],
    boundaries: { playStyle: 'soft', roomPreference: 'same-room', openTo: 'couples-only', smoking: 'no', drinking: 'socially', boundariesText: 'Friends first, always.' },
    prompts: [{ prompt: 'Our love language as a couple is…', answer: 'Splitting dessert and side-eyeing the bill.' }],
  },
  sr: {
    coupleName: 'Sam & Riley',
    bio: 'Hosts of a legendary game night. Winners get bragging rights.',
    location: 'Wauwatosa, WI',
    lookingFor: ['Couples', 'Single women', 'Single men', 'Friends & social only'],
    boundaries: { playStyle: 'full', roomPreference: 'either', openTo: 'open-to-singles', smoking: 'socially', drinking: 'yes', boundariesText: '' },
    prompts: [{ prompt: 'The most fun we’ve had at a party was…', answer: 'Still the Uno tournament.' }],
  },
  cm: {
    coupleName: 'Casey & Morgan',
    bio: 'New to Madison, newer to this. Social only for now.',
    location: 'Madison, WI',
    lookingFor: ['Friends & social only', 'Events & parties'],
    boundaries: { playStyle: 'social', roomPreference: 'either', openTo: 'couples-only', smoking: 'no', drinking: 'socially', boundariesText: '' },
    prompts: [],
  },
}

// ---------- helpers (mirror the app's signup/couple flows) ----------

async function signInOrCreate(email) {
  try {
    return (await createUserWithEmailAndPassword(auth, email, TEST_PASSWORD)).user
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') {
      return (await signInWithEmailAndPassword(auth, email, TEST_PASSWORD)).user
    }
    throw err
  }
}

async function ensureProfile(uid, u) {
  const ref = doc(db, 'users', uid)
  if (!(await getDoc(ref)).exists()) {
    // Base doc exactly as createUserProfile writes it (rules validate shape).
    await setDoc(ref, {
      displayName: u.displayName,
      firstName: '',
      lastName: '',
      dob: Timestamp.fromDate(new Date(`${u.dob}T00:00:00`)),
      bio: '',
      location: null,
      photoURL: null,
      coupleId: null,
      interests: [],
      visibility: 'members',
      verified: false,
      boundaries: null,
      messagePolicy: 'connections',
      prompts: [],
      createdAt: serverTimestamp(),
    })
  }
  await updateDoc(ref, {
    bio: u.bio,
    location: u.location,
    interests: u.interests,
    boundaries: u.boundaries,
    prompts: u.prompts,
    messagePolicy: u.messagePolicy,
    visibility: u.visibility ?? 'members',
  })
}

function inviteCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('')
}

/** Partner A creates the couple + invite; returns { coupleId, code }. */
async function createCoupleAs(uid, c) {
  const coupleRef = await addDoc(collection(db, 'couples'), {
    partnerUids: [uid],
    coupleName: c.coupleName,
    bio: c.bio,
    coverPhotoURL: null,
    location: c.location,
    lookingFor: c.lookingFor,
    verified: false,
    boundaries: c.boundaries,
    messagePolicy: 'connections',
    prompts: c.prompts,
    dualConsent: { connections: false, albums: false },
    createdAt: serverTimestamp(),
  })
  const code = inviteCode()
  await setDoc(doc(db, 'coupleInvites', code), {
    coupleId: coupleRef.id,
    createdBy: uid,
    createdAt: serverTimestamp(),
  })
  await updateDoc(doc(db, 'users', uid), { coupleId: coupleRef.id })
  return { coupleId: coupleRef.id, code }
}

/** Partner B spends the invite code (rules verify it server-side). */
async function joinCoupleAs(uid, coupleId, code, partnerAUid) {
  await updateDoc(doc(db, 'couples', coupleId), {
    partnerUids: [partnerAUid, uid],
    usedInviteCode: code,
    linkedAt: serverTimestamp(),
  })
  await updateDoc(doc(db, 'users', uid), { coupleId })
  await deleteDoc(doc(db, 'coupleInvites', code))
}

// ---------- run ----------

const uids = {}

for (const u of USERS) {
  const user = await signInOrCreate(u.email)
  uids[u.email] = user.uid
  await ensureProfile(user.uid, u)
  console.log(`✓ ${u.displayName.padEnd(12)} ${u.email}  (${user.uid})`)
  await signOut(auth)
}

for (const [key, c] of Object.entries(COUPLES)) {
  const [a, b] = USERS.filter((u) => u.couple === key)
  const aUid = uids[a.email]
  const bUid = uids[b.email]

  // Skip if already linked (re-run safety).
  await signInWithEmailAndPassword(auth, a.email, TEST_PASSWORD)
  const aDoc = (await getDoc(doc(db, 'users', aUid))).data()
  if (aDoc.coupleId) {
    console.log(`— ${c.coupleName} already linked`)
    await signOut(auth)
    continue
  }

  const { coupleId, code } = await createCoupleAs(aUid, c)
  await signOut(auth)

  await signInWithEmailAndPassword(auth, b.email, TEST_PASSWORD)
  await joinCoupleAs(bUid, coupleId, code, aUid)
  await signOut(auth)
  console.log(`✓ linked couple: ${c.coupleName}  (${coupleId})`)
}

console.log(`\nAll test accounts use password: ${TEST_PASSWORD}`)
console.log('Profiles: /u/<uid> · couples via Discover. Casey M is visibility=connections (hidden until connected).')
process.exit(0)
