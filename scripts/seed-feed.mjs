/**
 * Seeds feed content from the test accounts (see seed-test-users.mjs):
 * a dozen posts — couple-authored and personal, plus one repost — and
 * likes/comments between accounts, all through the client SDK + rules.
 *
 * NOTE: likeCount/commentCount badges stay 0 until Cloud Functions are
 * deployed (counters are function-maintained). Comments still render on
 * post pages; likes still track per-user heart state.
 *
 * Usage:  node scripts/seed-feed.mjs
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
  addDoc,
  collection,
  connectFirestoreEmulator,
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from 'firebase/firestore'

const TEST_PASSWORD = 'SwingsetTest!23'

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
}

const EMAILS = {
  alex: 'test.alex@example.com',
  jordan: 'test.jordan@example.com',
  sam: 'test.sam@example.com',
  riley: 'test.riley@example.com',
  casey: 'test.casey@example.com',
  morgan: 'test.morgan@example.com',
  nina: 'test.nina@example.com',
  marcus: 'test.marcus@example.com',
}

// ---------- gather identities ----------

const who = {} // key → { uid, name, coupleId, coupleName, partnerUids }

for (const [key, email] of Object.entries(EMAILS)) {
  const { user } = await signInWithEmailAndPassword(auth, email, TEST_PASSWORD)
  const me = (await getDoc(doc(db, 'users', user.uid))).data()
  who[key] = { uid: user.uid, name: me.displayName, coupleId: me.coupleId }
  if (me.coupleId) {
    const couple = (await getDoc(doc(db, 'couples', me.coupleId))).data()
    who[key].coupleName = couple.coupleName
    who[key].partnerUids = couple.partnerUids
  }
  await signOut(auth)
}

function authorFor(key, as) {
  const w = who[key]
  return as === 'couple'
    ? { type: 'couple', id: w.coupleId, uids: w.partnerUids, name: w.coupleName, photoURL: null }
    : { type: 'user', id: w.uid, uids: [w.uid], name: w.name, photoURL: null }
}

// ---------- posts (oldest → newest; feed shows newest first) ----------

const POSTS = [
  { key: 'sr1', by: 'sam', as: 'couple', text: 'Game night is BACK this Saturday. Uno, Codenames, and something Riley won’t tell me about until guests arrive. Winners get bragging rights and the last of the good bourbon. 🎲' },
  { key: 'nina1', by: 'nina', as: 'user', text: 'New here! Single, Milwaukee-based, and my icebreaker answers are 100% accurate. Come say hi before I lose my nerve at my first meetup. 🍍' },
  { key: 'aj1', by: 'alex', as: 'couple', text: 'Survived our first hotel takeover last weekend. Verdict: we are extremely “friends first” people and we found our people. Thanks to everyone who made two nervous newbies feel normal. 💛' },
  { key: 'marcus1', by: 'marcus', as: 'user', text: 'Chicago → Milwaukee this weekend, as usual. If anyone’s doing anything social Saturday, my calendar (and my restaurant recommendations) are open.' },
  { key: 'jordan1', by: 'jordan', as: 'user', text: 'Reminder that whoever controls the playlist controls the party. Taking requests for Saturday now. No, Alex, not the karaoke track. 🎶' },
  { key: 'cm1', by: 'casey', as: 'couple', text: 'Madison newbies checking in. Social-only for now while we find our footing — but our couch, our snacks, and our terrible movie collection are available for low-pressure hangs.' },
  { key: 'sam1', by: 'sam', as: 'user', text: 'Hot take: the grill is the most underrated party equalizer. Nobody is awkward around a plate of smoked wings. This is why our game nights work.' },
  { key: 'nina2', by: 'nina', as: 'user', text: 'PSA: ranked list of Milwaukee cocktail bars where you can actually hear each other talk, thread below. Fight me on #3. 🍸' },
  { key: 'aj2', by: 'alex', as: 'couple', text: 'Six years married, two in the lifestyle, and Jordan still pretends the pineapple magnet on our fridge is “just decor.” Sure, babe. 🍍😂' },
  { key: 'riley1', by: 'riley', as: 'user', text: 'Definitive board game power rankings for parties: 5) Uno (chaos) 4) Codenames 3) Wavelength 2) Monikers 1) whatever makes Sam lose. Accepting challengers Saturday.' },
  { key: 'marcus2', by: 'marcus', as: 'user', text: 'Someone asked for the steakhouse opinions so, in this house: Milwaukee wins on supper clubs, Chicago wins on steak, and anyone who orders past medium is paying for their own Uber.' },
  { key: 'sr2', by: 'riley', as: 'couple', text: 'The magnet is NOT just decor and we have proof. See you both Saturday. 😂', sharedFromKey: 'aj2' },
]

const postIds = {}

for (const p of POSTS) {
  await signInWithEmailAndPassword(auth, EMAILS[p.by], TEST_PASSWORD)
  const author = authorFor(p.by, p.as)
  const ref = await addDoc(collection(db, 'posts'), {
    authorType: author.type,
    authorId: author.id,
    authorUids: author.uids,
    authorName: author.name,
    authorPhotoURL: author.photoURL,
    text: p.text,
    imageURLs: [],
    visibility: 'members',
    sharedFrom: p.sharedFromKey
      ? { postId: postIds[p.sharedFromKey], authorName: 'Alex & Jordan' }
      : null,
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
    createdAt: serverTimestamp(),
  })
  postIds[p.key] = ref.id
  await signOut(auth)
  console.log(`✓ post by ${author.name}: ${p.text.slice(0, 50)}…`)
  await new Promise((r) => setTimeout(r, 400)) // keep createdAt ordering stable
}

// ---------- likes & comments (grouped per actor: one sign-in each) ----------

const INTERACTIONS = {
  alex: { likes: ['sr1', 'nina1', 'riley1'], comments: [['sr1', 'We’re in. Jordan’s bringing the playlist, I’m bringing the competitive streak.']] },
  jordan: { likes: ['sr1', 'nina2', 'sam1'], comments: [['riley1', 'Monikers at #2 is disrespectful. It’s #1 and it isn’t close.']] },
  sam: { likes: ['aj1', 'aj2', 'jordan1', 'marcus1'], comments: [['aj2', 'The magnet knows what it is. 😂']] },
  riley: { likes: ['aj2', 'nina1', 'cm1'], comments: [['nina1', 'Welcome! Game night Saturday is extremely first-timer friendly — come through.']] },
  casey: { likes: ['nina1', 'aj1'], comments: [['aj1', 'This is really reassuring to read as fellow nervous newbies. 💛']] },
  morgan: { likes: ['cm1', 'sr1'] },
  nina: { likes: ['sr1', 'aj1', 'jordan1', 'riley1', 'marcus2'], comments: [['marcus1', 'A few of us will be at the Bay View meetup Saturday — come by!'], ['sr1', 'First game night, should I be scared of the Uno tournament stories? Be honest.']] },
  marcus: { likes: ['nina2', 'sam1', 'aj2'], comments: [['nina2', 'Your #3 is correct and the people fighting you are wrong.']] },
}

for (const [key, acts] of Object.entries(INTERACTIONS)) {
  const { user } = await signInWithEmailAndPassword(auth, EMAILS[key], TEST_PASSWORD)
  for (const target of acts.likes ?? []) {
    await setDoc(doc(db, 'posts', postIds[target], 'likes', user.uid), {
      createdAt: serverTimestamp(),
    })
  }
  for (const [target, text] of acts.comments ?? []) {
    await addDoc(collection(db, 'posts', postIds[target], 'comments'), {
      authorId: user.uid,
      authorName: who[key].name,
      authorPhotoURL: null,
      text,
      createdAt: serverTimestamp(),
    })
  }
  await signOut(auth)
  console.log(`✓ ${who[key].name}: ${(acts.likes ?? []).length} likes, ${(acts.comments ?? []).length} comments`)
}

console.log('\nFeed seeded. Note: like/comment count badges stay 0 until Cloud Functions are deployed.')
process.exit(0)
