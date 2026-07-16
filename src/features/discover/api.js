import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  where,
} from 'firebase/firestore'
import { db } from '../../lib/firebase'

export const DISCOVER_PAGE_SIZE = 20

/**
 * Browse couples, optionally filtered by a "looking for" tag (server-side).
 * Location/interest text filtering happens client-side on the loaded page —
 * Firestore has no substring search.
 */
export async function fetchCouplesPage({ lookingFor, verifiedOnly, cursor }) {
  const clauses = [orderBy('createdAt', 'desc'), limit(DISCOVER_PAGE_SIZE)]
  if (verifiedOnly) clauses.unshift(where('verified', '==', true))
  if (lookingFor) clauses.unshift(where('lookingFor', 'array-contains', lookingFor))
  const q = cursor
    ? query(collection(db, 'couples'), ...clauses.slice(0, -1), startAfter(cursor), clauses[clauses.length - 1])
    : query(collection(db, 'couples'), ...clauses)
  const snap = await getDocs(q)
  return {
    couples: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
    cursor: snap.docs.length === DISCOVER_PAGE_SIZE ? snap.docs[snap.docs.length - 1] : null,
  }
}
