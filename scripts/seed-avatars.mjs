/**
 * Seeds profile avatars for the test.* accounts so the feed shows real profile
 * images. Generates simple gradient-with-initial JPEGs via sharp and uploads
 * them through each account (client SDK + rules).
 *
 * (Couple cover images are seeded separately via the admin API — the couple
 * cover storage rule uses a cross-service Firestore read that doesn't grant
 * writes through the client SDK here.)
 *
 * Usage:  node scripts/seed-avatars.mjs
 */
import { readFileSync } from 'node:fs'
import sharp from 'sharp'
import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getFirestore, updateDoc } from 'firebase/firestore'
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage'

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
if (!TEST_PASSWORD) throw new Error('Add TEST_PASSWORD to .env')

const app = initializeApp({
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
})
const auth = getAuth(app)
const db = getFirestore(app)
const storage = getStorage(app)

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function avatarJpeg({ initial, c1, c2, size = 400 }) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>
    </linearGradient></defs>
    <rect width="${size}" height="${size}" fill="url(#g)"/>
    <text x="50%" y="52%" font-family="Arial, sans-serif" font-size="${size * 0.5}"
      font-weight="700" fill="#ffffff" text-anchor="middle" dominant-baseline="central">${esc(initial)}</text>
  </svg>`
  return sharp(Buffer.from(svg)).jpeg({ quality: 88 }).toBuffer()
}

const USERS = [
  { email: 'test.alex@example.com', initial: 'A', c1: '#e05a47', c2: '#a83426' },
  { email: 'test.jordan@example.com', initial: 'J', c1: '#4a90d9', c2: '#2c5f96' },
  { email: 'test.sam@example.com', initial: 'S', c1: '#7b5ea7', c2: '#4f3b73' },
  { email: 'test.riley@example.com', initial: 'R', c1: '#d98a3d', c2: '#a25f22' },
  { email: 'test.casey@example.com', initial: 'C', c1: '#3da97b', c2: '#26714f' },
  { email: 'test.morgan@example.com', initial: 'M', c1: '#c94f8f', c2: '#8f2f62' },
  { email: 'test.nina@example.com', initial: 'N', c1: '#d9b23d', c2: '#a37f1f' },
  { email: 'test.marcus@example.com', initial: 'M', c1: '#4a9d9a', c2: '#2c6866' },
]

for (const u of USERS) {
  const { user } = await signInWithEmailAndPassword(auth, u.email, TEST_PASSWORD)
  const buf = await avatarJpeg(u)
  const path = `users/${user.uid}/profile/avatar.jpg`
  await uploadBytes(ref(storage, path), buf, { contentType: 'image/jpeg' })
  const url = await getDownloadURL(ref(storage, path))
  await updateDoc(doc(db, 'users', user.uid), { photoURL: url })
  console.log(`avatar set: ${u.email}`)
  await signOut(auth)
}

console.log('\nDone.')
process.exit(0)
