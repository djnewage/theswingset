import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  where,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'

export async function createTravelPlan(owner, { city, region, startsAt, endsAt, note }) {
  await addDoc(collection(db, 'travelPlans'), {
    ownerId: owner.id,
    ownerType: owner.type,
    ownerName: owner.name,
    ownerPhotoURL: owner.photoURL ?? null,
    ownerUids: owner.uids,
    city,
    region: region || null,
    startsAt: Timestamp.fromDate(new Date(`${startsAt}T00:00:00`)),
    endsAt: Timestamp.fromDate(new Date(`${endsAt}T23:59:59`)),
    note: note ?? '',
    visibility: 'members',
    createdAt: serverTimestamp(),
  })
}

export async function fetchMyTravelPlans(uid) {
  const snap = await getDocs(
    query(collection(db, 'travelPlans'), where('ownerUids', 'array-contains', uid)),
  )
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => (a.startsAt?.seconds ?? 0) - (b.startsAt?.seconds ?? 0))
}

/** Upcoming/current trips across the community, for Discover. */
export async function fetchUpcomingTravel() {
  const snap = await getDocs(
    query(
      collection(db, 'travelPlans'),
      where('endsAt', '>=', Timestamp.now()),
      orderBy('endsAt', 'asc'),
      limit(50),
    ),
  )
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function deleteTravelPlan(planId) {
  await deleteDoc(doc(db, 'travelPlans', planId))
}

export function travelDates(plan) {
  const fmt = (t) =>
    t.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return `${fmt(plan.startsAt)}–${fmt(plan.endsAt)}`
}
