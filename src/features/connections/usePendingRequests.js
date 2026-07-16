import { useEffect, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../auth/AuthContext'

/** Live count of connection requests awaiting MY response. */
export function usePendingRequests() {
  const { user } = useAuth()
  const [count, setCount] = useState(0)

  useEffect(
    () =>
      onSnapshot(
        query(collection(db, 'connections'), where('pairUids', 'array-contains', user.uid)),
        (snap) =>
          setCount(
            snap.docs.filter((d) => {
              const c = d.data()
              return (
                c.status === 'pending' &&
                c.toUids.includes(user.uid) &&
                // Dual consent: don't re-badge a request I already approved.
                !(c.approvals ?? {})[user.uid]
              )
            }).length,
          ),
      ),
    [user.uid],
  )

  return count
}
