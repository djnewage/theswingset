import { readFileSync } from 'node:fs'
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore'

const env = Object.fromEntries(
  readFileSync(new URL('./.env', import.meta.url), 'utf8')
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
const PW = 'SwingsetTest!23'

await signInWithEmailAndPassword(auth, 'test.nina@example.com', PW)
const aj = (await getDoc(doc(db, 'users', 'BuASfKbEd6P2kOILVDvkGj1wWsA3'))).data()

for (let attempt = 1; attempt <= 10; attempt++) {
  try {
    const snap = await getDocs(
      query(
        collection(db, 'posts'),
        where('visibility', '==', 'connections'),
        where('authorId', '==', aj.coupleId),
        orderBy('createdAt', 'desc'),
        limit(25),
      ),
    )
    console.log(`✓ PASS (attempt ${attempt}): Nina read ${snap.docs.length} connections post(s):`)
    snap.docs.forEach((d) => console.log(`    "${d.data().text.slice(0, 60)}…"`))
    process.exit(0)
  } catch (err) {
    if (err.code !== 'failed-precondition') {
      console.log(`✗ FAIL: unexpected error — ${err.code}`)
      process.exit(1)
    }
    console.log(`… index still building (attempt ${attempt}), waiting 30s`)
    await new Promise((r) => setTimeout(r, 30000))
  }
}
console.log('✗ index still not ready after 5 minutes')
process.exit(1)
