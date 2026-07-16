import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  startAfter,
  where,
} from 'firebase/firestore'
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage'
import { db, storage } from '../../lib/firebase'
import { processImageForUpload } from '../../lib/images'

export const PAGE_SIZE = 10
export const MAX_POST_IMAGES = 4

// ---------- posts ----------

/**
 * Creates a post. `author` is either
 *   { type: 'user', id: uid, uids: [uid], name, photoURL }
 * or { type: 'couple', id: coupleId, uids: partnerUids, name, photoURL }.
 * Counters start at 0 and are maintained by Cloud Functions.
 */
export async function createPost(author, { text, files = [], visibility, sharedFrom = null }) {
  const imageURLs = []
  for (const file of files.slice(0, MAX_POST_IMAGES)) {
    const blob = await processImageForUpload(file, 1600)
    const path = `posts/${author.uids[0]}/${crypto.randomUUID()}.jpg`
    const storageRef = ref(storage, path)
    await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' })
    imageURLs.push(await getDownloadURL(storageRef))
  }

  const postRef = await addDoc(collection(db, 'posts'), {
    authorType: author.type,
    authorId: author.id,
    authorUids: author.uids,
    authorName: author.name,
    authorPhotoURL: author.photoURL ?? null,
    text,
    imageURLs,
    visibility,
    sharedFrom, // { postId, authorName } when this is a repost
    likeCount: 0,
    commentCount: 0,
    shareCount: 0,
    createdAt: serverTimestamp(),
  })
  return postRef.id
}

export async function fetchFeedPage(cursor) {
  // Members-wide feed; connections-only posts merge in via
  // fetchConnectionsFeedPosts (rules require per-author queries for those).
  const parts = [
    collection(db, 'posts'),
    where('visibility', '==', 'members'),
    orderBy('createdAt', 'desc'),
    limit(PAGE_SIZE),
  ]
  const q = cursor
    ? query(parts[0], parts[1], parts[2], startAfter(cursor), parts[3])
    : query(...parts)
  const snap = await getDocs(q)
  return {
    posts: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
    cursor: snap.docs.length === PAGE_SIZE ? snap.docs[snap.docs.length - 1] : null,
  }
}

/**
 * Connections-only posts from the entities I'm connected to. Security rules
 * can only prove the connection per-author, so this runs one small query per
 * connected entity and merges newest-first.
 */
export async function fetchConnectionsFeedPosts(entityIds) {
  const pages = await Promise.all(
    entityIds.map((id) =>
      getDocs(
        query(
          collection(db, 'posts'),
          where('visibility', '==', 'connections'),
          where('authorId', '==', id),
          orderBy('createdAt', 'desc'),
          limit(25),
        ),
      ).catch(() => null), // stale connection or race: skip quietly
    ),
  )
  return pages
    .filter(Boolean)
    .flatMap((snap) => snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    .sort((a, b) => (b.createdAt?.toMillis() ?? 0) - (a.createdAt?.toMillis() ?? 0))
}

/**
 * My own recent non-members posts (connections/private), so authors see
 * their posts in their own feed. Rules allow this via the authorUids filter.
 */
export async function fetchMyAudiencePosts(uid) {
  const snap = await getDocs(
    query(
      collection(db, 'posts'),
      where('authorUids', 'array-contains', uid),
      orderBy('createdAt', 'desc'),
      limit(25),
    ),
  )
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((p) => p.visibility !== 'members')
}

export async function fetchPost(postId) {
  const snap = await getDoc(doc(db, 'posts', postId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function deletePost(postId) {
  await deleteDoc(doc(db, 'posts', postId))
}

// ---------- likes ----------

export async function likePost(postId, uid) {
  await setDoc(doc(db, 'posts', postId, 'likes', uid), {
    createdAt: serverTimestamp(),
  })
}

export async function unlikePost(postId, uid) {
  await deleteDoc(doc(db, 'posts', postId, 'likes', uid))
}

export async function hasLiked(postId, uid) {
  const snap = await getDoc(doc(db, 'posts', postId, 'likes', uid))
  return snap.exists()
}

// ---------- comments ----------

export async function addComment(postId, { authorId, authorName, authorPhotoURL, text }) {
  await addDoc(collection(db, 'posts', postId, 'comments'), {
    authorId,
    authorName,
    authorPhotoURL: authorPhotoURL ?? null,
    text,
    createdAt: serverTimestamp(),
  })
}

export async function fetchComments(postId) {
  const snap = await getDocs(
    query(collection(db, 'posts', postId, 'comments'), orderBy('createdAt', 'asc')),
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function deleteComment(postId, commentId) {
  await deleteDoc(doc(db, 'posts', postId, 'comments', commentId))
}

// ---------- reports ----------

export async function submitReport(reporterId, { targetType, targetId, reason, details }) {
  await addDoc(collection(db, 'reports'), {
    reporterId,
    targetType, // 'post' | 'comment' | 'user' | 'couple'
    targetId,
    reason,
    details: details ?? '',
    status: 'open',
    createdAt: serverTimestamp(),
  })
}

// ---------- blocks ----------

export async function blockAuthor(blockerId, blockedId) {
  await setDoc(doc(db, 'blocks', `${blockerId}_${blockedId}`), {
    blockerId,
    blockedId,
    createdAt: serverTimestamp(),
  })
}

export async function unblock(blockerId, blockedId) {
  await deleteDoc(doc(db, 'blocks', `${blockerId}_${blockedId}`))
}

export async function fetchMyBlocks(blockerId) {
  const snap = await getDocs(
    query(collection(db, 'blocks'), where('blockerId', '==', blockerId)),
  )
  return snap.docs.map((d) => d.data().blockedId)
}
