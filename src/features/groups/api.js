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
} from 'firebase/firestore'
import { db } from '../../lib/firebase'

export async function createGroup(creator, { name, description, region }) {
  const groupRef = await addDoc(collection(db, 'groups'), {
    name,
    description,
    region,
    coverPhotoURL: null,
    memberCount: 0, // maintained by Cloud Function
    visibility: 'members',
    createdBy: creator.uid,
    createdAt: serverTimestamp(),
  })
  // Creator joins as moderator.
  await setDoc(doc(db, 'groups', groupRef.id, 'members', creator.uid), {
    uid: creator.uid,
    name: creator.name,
    photoURL: creator.photoURL ?? null,
    role: 'moderator',
    joinedAt: serverTimestamp(),
  })
  return groupRef.id
}

export async function fetchGroups() {
  const snap = await getDocs(
    query(collection(db, 'groups'), orderBy('createdAt', 'desc'), limit(100)),
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function fetchGroup(groupId) {
  const snap = await getDoc(doc(db, 'groups', groupId))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function joinGroup(groupId, member) {
  await setDoc(doc(db, 'groups', groupId, 'members', member.uid), {
    uid: member.uid,
    name: member.name,
    photoURL: member.photoURL ?? null,
    role: 'member',
    joinedAt: serverTimestamp(),
  })
}

export async function leaveGroup(groupId, uid) {
  await deleteDoc(doc(db, 'groups', groupId, 'members', uid))
}

export async function fetchMembership(groupId, uid) {
  const snap = await getDoc(doc(db, 'groups', groupId, 'members', uid))
  return snap.exists() ? snap.data() : null
}

export async function fetchMembers(groupId) {
  const snap = await getDocs(collection(db, 'groups', groupId, 'members'))
  return snap.docs.map((d) => d.data())
}

export async function removeMember(groupId, uid) {
  await deleteDoc(doc(db, 'groups', groupId, 'members', uid))
}

// ---------- group posts ----------

export async function createGroupPost(groupId, author, text) {
  await addDoc(collection(db, 'groups', groupId, 'posts'), {
    authorId: author.uid,
    authorName: author.name,
    authorPhotoURL: author.photoURL ?? null,
    text,
    createdAt: serverTimestamp(),
  })
}

export async function fetchGroupPosts(groupId) {
  const snap = await getDocs(
    query(collection(db, 'groups', groupId, 'posts'), orderBy('createdAt', 'desc'), limit(100)),
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function deleteGroupPost(groupId, postId) {
  await deleteDoc(doc(db, 'groups', groupId, 'posts', postId))
}
