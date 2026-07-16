# The Swingset

A private, mobile-first social network for the adult (18+) ENM/swinger community.
Privacy-first: members-only by default, nothing publicly indexable, couples as
the core account unit. Pineapple-themed. 🍍

## Stack

- React 18 + Vite, React Router v6
- Tailwind CSS v4 (+ Headless UI)
- TanStack Query for Firestore reads
- Firebase: Auth, Cloud Firestore, Storage, Cloud Functions, Hosting

## Local setup

```bash
npm install
cp .env.example .env    # fill in your Firebase web app config
npm run dev             # http://localhost:5173
```

## Firebase project setup

1. Create a project at https://console.firebase.google.com (disable Analytics if unwanted).
2. **Auth:** Build → Authentication → Sign-in method → enable **Email/Password** and **Google**.
3. **Firestore:** Build → Firestore Database → create (production mode). Rules deploy from `firestore.rules`.
4. **Storage:** Build → Storage → get started (production mode). Rules deploy from `storage.rules`.
5. Project settings → Your apps → add a **Web** app → copy the config values into `.env`.
6. Deploy rules: `firebase deploy --only firestore:rules,storage`.

Composite indexes will be added to `firestore.indexes.json` as feed/discover
queries land (Phases 3–5); deploy with `firebase deploy --only firestore:indexes`.

## Emulator suite (recommended for dev)

```bash
npm install -g firebase-tools   # once
firebase login                  # once
npm run emulators               # auth :9099, firestore :8080, storage :9199, UI :4000
```

Set `VITE_USE_EMULATORS=true` in `.env` and restart `npm run dev` to point the
app at the emulators.

## Deploy

```bash
npm run build
firebase deploy --only hosting
```

Hosting sends `X-Robots-Tag: noindex` on every response — the app must never
be search-indexable.

## Deploying Cloud Functions

Counters, notification fan-out, account wipe, and the moderation hook live in
`functions/`:

```bash
cd functions && npm install && cd ..
firebase deploy --only functions
```

The image-moderation function is a stub — wire it to Cloud Vision SafeSearch
(see the TODO in `functions/index.js`) before opening signups.

## Security model (enforced in `firestore.rules` / `storage.rules`)

- Deny-by-default; every collection lists exactly what's allowed.
- 18+ DOB enforced server-side on signup and immutable afterward.
- Profiles honor `members` / `connections` / `private` visibility; the
  connections check runs inside rules via the connection graph.
- Couple linking uses unguessable invite codes verified in rules; membership
  changes are restricted to self-join (with code) and self-leave.
- Posts/events: authors are validated (incl. couple membership); counters are
  writable only by Cloud Functions; feed/list queries must match visibility.
- Albums gate their *photos*, with grants (request → approve) enforced
  server-side. Caveat: a tokenized image URL someone already fetched keeps
  working until the file is deleted — revocation gates the docs, not old URLs.
- Reports are write-only for members; notifications are function-written only.
- Storage mirrors ownership per path and caps uploads to 10 MB images.

## Testing

Work through `SMOKE-TEST.md` against the emulator suite before each deploy.

## Project structure

```
src/
  lib/            firebase init, age validation
  components/     AppShell (tabs/sidebar), Logo, shared UI
  features/
    auth/         AgeGate, login/signup, Google DOB completion, route guards
    profiles/     (Phase 2)
    feed/         (Phase 3)
    events/       (Phase 4)
    discover/     (Phase 5)
```
