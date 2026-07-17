/**
 * Adds image posts to the feed from test accounts. Images are flat-design
 * SVG illustrations rasterized to JPEG with sharp, uploaded through the
 * client SDK (so storage rules are exercised). Creates posts with 1, 2,
 * and 3 images to test every grid layout.
 *
 * Usage:  node scripts/seed-feed-images.mjs
 */
import { readFileSync } from 'node:fs'
import sharp from 'sharp'
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
} from 'firebase/firestore'
import {
  connectStorageEmulator,
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from 'firebase/storage'


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
const storage = getStorage(app)

if (env.VITE_USE_EMULATORS === 'true') {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8080)
  connectStorageEmulator(storage, '127.0.0.1', 9199)
}

// ---------- SVG scenes (1600×1200, warm dark palette) ----------

const defsWarm = `
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#6b5138"/><stop offset="1" stop-color="#3a2c1e"/>
  </linearGradient>
  <linearGradient id="table" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#9c6b44"/><stop offset="1" stop-color="#6e4a2e"/>
  </linearGradient>
  <radialGradient id="glow" cx="0.5" cy="0.35" r="0.7">
    <stop offset="0" stop-color="#ffd98a" stop-opacity="0.5"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/>
  </radialGradient>`

const SCENES = {
  gameTable: `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200"><defs>${defsWarm}</defs>
    <rect width="1600" height="1200" fill="url(#bg)"/><rect width="1600" height="1200" fill="url(#glow)"/>
    <ellipse cx="800" cy="880" rx="720" ry="300" fill="url(#table)"/>
    <g transform="translate(560 700) rotate(-8)"><rect width="180" height="260" rx="18" fill="#f4efe6"/><rect x="14" y="14" width="152" height="232" rx="12" fill="#c0392b"/><text x="90" y="160" font-family="Georgia" font-size="120" fill="#f4efe6" text-anchor="middle">7</text></g>
    <g transform="translate(760 680) rotate(6)"><rect width="180" height="260" rx="18" fill="#f4efe6"/><rect x="14" y="14" width="152" height="232" rx="12" fill="#2471a3"/><text x="90" y="160" font-family="Georgia" font-size="110" fill="#f4efe6" text-anchor="middle">+2</text></g>
    <g transform="translate(980 720) rotate(14)"><rect width="180" height="260" rx="18" fill="#f4efe6"/><rect x="14" y="14" width="152" height="232" rx="12" fill="#1e8449"/><text x="90" y="165" font-family="Georgia" font-size="120" fill="#f4efe6" text-anchor="middle">4</text></g>
    <g transform="translate(430 900)"><rect width="110" height="110" rx="22" fill="#f4efe6"/><circle cx="35" cy="35" r="11" fill="#2b2118"/><circle cx="75" cy="75" r="11" fill="#2b2118"/><circle cx="75" cy="35" r="11" fill="#2b2118"/><circle cx="35" cy="75" r="11" fill="#2b2118"/><circle cx="55" cy="55" r="11" fill="#2b2118"/></g>
    <g transform="translate(1080 940) rotate(-12)"><rect width="110" height="110" rx="22" fill="#e8b84b"/><circle cx="55" cy="55" r="12" fill="#2b2118"/><circle cx="30" cy="30" r="12" fill="#2b2118"/><circle cx="80" cy="80" r="12" fill="#2b2118"/></g>
    <circle cx="330" cy="300" r="90" fill="#e8b84b" opacity="0.16"/><circle cx="1290" cy="240" r="130" fill="#e8b84b" opacity="0.12"/>
  </svg>`,

  wings: `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200"><defs>${defsWarm}
    <radialGradient id="plate" cx="0.5" cy="0.5" r="0.55"><stop offset="0" stop-color="#f4efe6"/><stop offset="0.86" stop-color="#f4efe6"/><stop offset="0.88" stop-color="#d9d2c4"/><stop offset="1" stop-color="#efe9dd"/></radialGradient></defs>
    <rect width="1600" height="1200" fill="url(#bg)"/><rect width="1600" height="1200" fill="url(#glow)"/>
    <ellipse cx="800" cy="640" rx="560" ry="420" fill="url(#plate)"/>
    <g fill="#a04000"><ellipse cx="640" cy="520" rx="130" ry="80" transform="rotate(-18 640 520)"/><ellipse cx="880" cy="480" rx="135" ry="82" transform="rotate(9 880 480)"/><ellipse cx="1010" cy="640" rx="128" ry="78" transform="rotate(28 1010 640)"/><ellipse cx="590" cy="700" rx="126" ry="78" transform="rotate(-40 590 700)"/><ellipse cx="800" cy="740" rx="140" ry="84" transform="rotate(4 800 740)"/></g>
    <g fill="#c0632b" opacity="0.85"><ellipse cx="628" cy="502" rx="88" ry="46" transform="rotate(-18 628 502)"/><ellipse cx="872" cy="464" rx="90" ry="47" transform="rotate(9 872 464)"/><ellipse cx="1000" cy="622" rx="86" ry="44" transform="rotate(28 1000 622)"/><ellipse cx="582" cy="684" rx="84" ry="44" transform="rotate(-40 582 684)"/><ellipse cx="796" cy="722" rx="92" ry="48" transform="rotate(4 796 722)"/></g>
    <g fill="#f7f9f4"><circle cx="700" cy="590" r="7"/><circle cx="930" cy="560" r="7"/><circle cx="840" cy="660" r="7"/><circle cx="660" cy="640" r="6"/><circle cx="890" cy="700" r="6"/></g>
    <g fill="#5a8f3c"><rect x="705" y="575" width="26" height="7" rx="3.5" transform="rotate(24 705 575)"/><rect x="925" y="545" width="26" height="7" rx="3.5" transform="rotate(-16 925 545)"/><rect x="845" y="645" width="24" height="7" rx="3.5" transform="rotate(40 845 645)"/></g>
    <ellipse cx="1250" cy="1000" rx="150" ry="60" fill="#2e86c1" opacity="0.9"/><ellipse cx="1250" cy="985" rx="150" ry="55" fill="#5dade2"/><ellipse cx="1250" cy="982" rx="120" ry="40" fill="#eaf2f8"/>
  </svg>`,

  cocktail1: `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200"><defs>
    <linearGradient id="bar1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1c1a2e"/><stop offset="1" stop-color="#12101c"/></linearGradient>
    <linearGradient id="drink1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e8b84b"/><stop offset="1" stop-color="#c87f2f"/></linearGradient>
    <radialGradient id="haze1" cx="0.5" cy="0.3" r="0.8"><stop offset="0" stop-color="#7d6bb5" stop-opacity="0.3"/><stop offset="1" stop-opacity="0"/></radialGradient></defs>
    <rect width="1600" height="1200" fill="url(#bar1)"/><rect width="1600" height="1200" fill="url(#haze1)"/>
    <rect y="920" width="1600" height="280" fill="#241f19"/>
    <g><path d="M640 420 L960 420 L810 700 Z" fill="url(#drink1)" opacity="0.95"/><path d="M630 405 L970 405 L812 705 L788 705 Z" fill="none" stroke="#e9e4f0" stroke-width="10" stroke-linejoin="round"/><rect x="788" y="700" width="24" height="200" fill="#e9e4f0"/><ellipse cx="800" cy="915" rx="110" ry="22" fill="#e9e4f0"/></g>
    <circle cx="880" cy="470" r="34" fill="#c0392b"/><circle cx="893" cy="458" r="10" fill="#f4efe6" opacity="0.6"/><rect x="874" y="330" width="8" height="120" fill="#e9e4f0" transform="rotate(18 878 390)"/>
    <g stroke="#e8b84b" stroke-width="4" opacity="0.5"><circle cx="330" cy="260" r="5" fill="#e8b84b"/><circle cx="1310" cy="200" r="4" fill="#e8b84b"/><circle cx="1220" cy="420" r="6" fill="#e8b84b"/><circle cx="410" cy="520" r="4" fill="#e8b84b"/></g>
  </svg>`,

  cocktail2: `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200"><defs>
    <linearGradient id="bar2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#26151a"/><stop offset="1" stop-color="#140b0e"/></linearGradient>
    <linearGradient id="drink2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e74c3c"/><stop offset="1" stop-color="#922b21"/></linearGradient></defs>
    <rect width="1600" height="1200" fill="url(#bar2)"/>
    <rect y="900" width="1600" height="300" fill="#1d1712"/>
    <g><rect x="660" y="380" width="280" height="480" rx="36" fill="url(#drink2)"/><rect x="646" y="360" width="308" height="520" rx="44" fill="none" stroke="#efe6e9" stroke-width="10"/><rect x="660" y="380" width="280" height="70" rx="30" fill="#f7dc6f" opacity="0.85"/></g>
    <g fill="#f4efe6" opacity="0.8"><rect x="700" y="500" width="60" height="60" rx="12" transform="rotate(12 730 530)"/><rect x="820" y="600" width="64" height="64" rx="12" transform="rotate(-9 852 632)"/><rect x="730" y="700" width="56" height="56" rx="12" transform="rotate(20 758 728)"/></g>
    <g transform="translate(920 300) rotate(24)"><rect width="14" height="180" rx="7" fill="#e8b84b"/><path d="M-28 -10 L42 -10 L7 -66 Z" fill="#1e8449"/></g>
    <circle cx="400" cy="300" r="110" fill="#e74c3c" opacity="0.1"/><circle cx="1260" cy="260" r="140" fill="#e8b84b" opacity="0.1"/>
  </svg>`,

  cocktail3: `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200"><defs>
    <linearGradient id="bar3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#14231c"/><stop offset="1" stop-color="#0c1511"/></linearGradient>
    <linearGradient id="drink3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a9dfbf"/><stop offset="1" stop-color="#52be80"/></linearGradient></defs>
    <rect width="1600" height="1200" fill="url(#bar3)"/>
    <rect y="910" width="1600" height="290" fill="#182018"/>
    <g><path d="M690 380 Q690 340 730 340 L870 340 Q910 340 910 380 L910 700 Q910 860 800 860 Q690 860 690 700 Z" fill="url(#drink3)"/><path d="M676 366 Q676 322 726 322 L874 322 Q924 322 924 366 L924 700 Q924 878 800 878 Q676 878 676 700 Z" fill="none" stroke="#e6efe9" stroke-width="10"/><ellipse cx="800" cy="905" rx="100" ry="20" fill="#e6efe9"/></g>
    <g fill="#1e8449"><ellipse cx="760" cy="420" rx="34" ry="16" transform="rotate(-24 760 420)"/><ellipse cx="840" cy="400" rx="34" ry="16" transform="rotate(18 840 400)"/><ellipse cx="800" cy="450" rx="30" ry="14" transform="rotate(60 800 450)"/></g>
    <rect x="838" y="250" width="10" height="220" rx="5" fill="#f4efe6" transform="rotate(-8 843 360)"/>
    <circle cx="350" cy="340" r="120" fill="#52be80" opacity="0.09"/><circle cx="1280" cy="300" r="100" fill="#e8b84b" opacity="0.1"/>
  </svg>`,

  magnet: `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200"><defs>
    <linearGradient id="fridge" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#aab7b8"/><stop offset="0.5" stop-color="#d5dbdb"/><stop offset="1" stop-color="#99a3a4"/></linearGradient>
    <linearGradient id="pine" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f5c76a"/><stop offset="1" stop-color="#d68910"/></linearGradient></defs>
    <rect width="1600" height="1200" fill="url(#fridge)"/>
    <rect x="60" y="0" width="12" height="1200" fill="#7f8c8d" opacity="0.5"/><rect x="1528" y="0" width="12" height="1200" fill="#7f8c8d" opacity="0.5"/>
    <g transform="translate(800 640)">
      <g transform="translate(0 -290)"><path d="M0 -110 L34 -30 L-34 -30 Z" fill="#1e8449" transform="rotate(0)"/><path d="M0 -110 L34 -30 L-34 -30 Z" fill="#229954" transform="rotate(40)"/><path d="M0 -110 L34 -30 L-34 -30 Z" fill="#229954" transform="rotate(-40)"/></g>
      <ellipse cx="0" cy="0" rx="180" ry="250" fill="url(#pine)"/>
      <g stroke="#b9770e" stroke-width="7" opacity="0.75">
        <path d="M-170 -160 L170 90" fill="none"/><path d="M-180 -60 L160 190" fill="none"/><path d="M-160 40 L120 250" fill="none"/>
        <path d="M170 -160 L-170 90" fill="none"/><path d="M180 -60 L-160 190" fill="none"/><path d="M160 40 L-120 250" fill="none"/>
      </g>
    </g>
    <g transform="translate(360 220) rotate(-4)"><rect width="300" height="200" rx="6" fill="#fdf2d0"/><text x="30" y="70" font-family="Segoe Script, cursive" font-size="40" fill="#5d4037">buy more</text><text x="30" y="130" font-family="Segoe Script, cursive" font-size="40" fill="#5d4037">pineapple ;)</text><circle cx="150" cy="18" r="14" fill="#c0392b"/></g>
    <g transform="translate(1150 850) rotate(6)"><rect width="240" height="150" rx="6" fill="#ffffff"/><rect x="18" y="18" width="204" height="90" rx="4" fill="#5dade2"/><text x="120" y="135" font-family="Arial" font-size="24" fill="#7f8c8d" text-anchor="middle">wish you were here</text></g>
  </svg>`,

  supperClub: `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1200"><defs>${defsWarm}
    <radialGradient id="plate2" cx="0.5" cy="0.5" r="0.55"><stop offset="0" stop-color="#f4efe6"/><stop offset="0.86" stop-color="#f4efe6"/><stop offset="0.88" stop-color="#d9d2c4"/><stop offset="1" stop-color="#efe9dd"/></radialGradient></defs>
    <rect width="1600" height="1200" fill="url(#bg)"/><rect width="1600" height="1200" fill="url(#glow)"/>
    <ellipse cx="760" cy="680" rx="520" ry="380" fill="url(#plate2)"/>
    <g transform="rotate(-14 760 640)"><ellipse cx="760" cy="640" rx="270" ry="180" fill="#6e2c00"/><ellipse cx="760" cy="628" rx="262" ry="170" fill="#873600"/><path d="M560 600 Q760 520 960 610" stroke="#4a235a" stroke-width="0" fill="none"/><g stroke="#40241a" stroke-width="12" opacity="0.8"><path d="M600 560 L920 700" fill="none"/><path d="M580 640 L940 620" fill="none"/></g></g>
    <g fill="#e8b84b"><ellipse cx="1010" cy="810" rx="90" ry="52" transform="rotate(18 1010 810)"/><ellipse cx="500" cy="820" rx="86" ry="50" transform="rotate(-12 500 820)"/></g>
    <g fill="#f7f9f4" opacity="0.9"><rect x="960" y="770" width="30" height="10" rx="5" transform="rotate(18 975 775)"/><rect x="470" y="790" width="30" height="10" rx="5" transform="rotate(-12 485 795)"/></g>
    <rect x="1200" y="330" width="200" height="420" rx="18" fill="#40241a"/><rect x="1216" y="346" width="168" height="300" rx="10" fill="#7b241c"/><ellipse cx="1300" cy="322" rx="46" ry="16" fill="#28190f"/>
    <circle cx="330" cy="280" r="100" fill="#e8b84b" opacity="0.13"/>
  </svg>`,
}

// ---------- posts to create ----------

const POSTS = [
  {
    by: 'test.sam@example.com', as: 'couple',
    text: 'Setup is DONE. Cards stacked, wings on, bourbon located. Doors open at 7 — first-timers get first pick of seats. 🎲🔥',
    images: ['gameTable', 'wings'],
  },
  {
    by: 'test.nina@example.com', as: 'user',
    text: 'Cocktail bar research update: three stops, zero regrets, one clear winner. The thread was right about #3 and I owe someone an apology. 🍸',
    images: ['cocktail1', 'cocktail2', 'cocktail3'],
  },
  {
    by: 'test.alex@example.com', as: 'couple',
    text: 'PROOF, as promised. “Just decor.” The handwritten grocery note is Jordan’s. The defense rests. 🍍',
    images: ['magnet'],
  },
  {
    by: 'test.marcus@example.com', as: 'user',
    text: 'Friday night supper club run: prime rib, hash browns done right, and an old fashioned that would make my grandfather emotional. Wisconsin gets it.',
    images: ['supperClub'],
  },
]

// Optional filter: `node scripts/seed-feed-images.mjs sam marcus` only
// creates posts whose author email contains one of the terms.
const only = process.argv.slice(2)
const selected = only.length ? POSTS.filter((p) => only.some((o) => p.by.includes(o))) : POSTS

for (const p of selected) {
  const { user } = await signInWithEmailAndPassword(auth, p.by, TEST_PASSWORD)
  const me = (await getDoc(doc(db, 'users', user.uid))).data()

  let author
  if (p.as === 'couple') {
    const couple = (await getDoc(doc(db, 'couples', me.coupleId))).data()
    author = { type: 'couple', id: me.coupleId, uids: couple.partnerUids, name: couple.coupleName }
    if (couple.partnerUids[0] !== user.uid) {
      throw new Error(`sign in as ${couple.partnerUids[0]} (first partner) to upload couple post images`)
    }
  } else {
    author = { type: 'user', id: user.uid, uids: [user.uid], name: me.displayName }
  }

  const imageURLs = []
  for (const scene of p.images) {
    const jpeg = await sharp(Buffer.from(SCENES[scene])).jpeg({ quality: 88 }).toBuffer()
    const storageRef = ref(storage, `posts/${user.uid}/${crypto.randomUUID()}.jpg`)
    await uploadBytes(storageRef, new Uint8Array(jpeg), { contentType: 'image/jpeg' })
    imageURLs.push(await getDownloadURL(storageRef))
  }

  await addDoc(collection(db, 'posts'), {
    authorType: author.type,
    authorId: author.id,
    authorUids: author.uids,
    authorName: author.name,
    authorPhotoURL: null,
    text: p.text,
    imageURLs,
    visibility: 'members',
    sharedFrom: null,
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
    createdAt: serverTimestamp(),
  })
  await signOut(auth)
  console.log(`✓ ${author.name}: ${p.images.length} image(s) — ${p.text.slice(0, 40)}…`)
  await new Promise((r) => setTimeout(r, 400))
}

console.log('\nImage posts created.')
process.exit(0)
