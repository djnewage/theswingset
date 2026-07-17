/**
 * Signs in as each seeded test account (see seed-test-users.mjs) and accepts
 * any pending connection request addressed to it — so you can send requests
 * from your real account and immediately test the accepted state.
 *
 * Usage:  node scripts/accept-test-connections.mjs
 */
import { readFileSync } from 'node:fs'
import { initializeApp } from 'firebase/app'
import {
  connectAuthEmulator,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth'
import {
  collection,
  connectFirestoreEmulator,
  doc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from 'firebase/firestore'

const TEST_EMAILS = [
  'test.alex@example.com',
  'test.jordan@example.com',
  'test.sam@example.com',
  'test.riley@example.com',
  'test.casey@example.com',
  'test.morgan@example.com',
  'test.nina@example.com',
  'test.marcus@example.com',
]

const env = Object.fromEntries(
  readFileSync(new URL('../.env', import.meta.url), 'utf8')
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=')
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
    }),
)

const TEST_PASSWORD = env.TEST_PASSWORD
if (!TEST_PASSWORD) throw new Error('Add TEST_PASSWORD to .env (test-account password)')

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
}

let accepted = 0

for (const email of TEST_EMAILS) {
  const { user } = await signInWithEmailAndPassword(auth, email, TEST_PASSWORD)

  const snap = await getDocs(
    query(collection(db, 'connections'), where('pairUids', 'array-contains', user.uid)),
  )
  const pending = snap.docs.filter(
    (d) => d.data().status === 'pending' && d.data().toUids.includes(user.uid),
  )

  for (const conn of pending) {
    // Mirrors respondToRequest() — seeded couples have dual consent off,
    // so one partner's accept completes the connection.
    await updateDoc(doc(db, 'connections', conn.id), {
      status: 'accepted',
      approvals: { ...(conn.data().approvals ?? {}), [user.uid]: true },
      acceptedAt: serverTimestamp(),
    })
    console.log(`✓ ${conn.data().toName} accepted ${conn.data().fromName}`)
    accepted++
  }
  await signOut(auth)
}

console.log(accepted ? `\n${accepted} request(s) accepted.` : 'No pending requests found.')
process.exit(0)
