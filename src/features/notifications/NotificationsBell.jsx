import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, limit, onSnapshot, query, where } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../auth/AuthContext'

export function NotificationsBell() {
  const { user } = useAuth()
  const [unread, setUnread] = useState(false)

  useEffect(
    () =>
      onSnapshot(
        query(
          collection(db, 'notifications', user.uid, 'items'),
          where('read', '==', false),
          limit(1),
        ),
        (snap) => setUnread(!snap.empty),
      ),
    [user.uid],
  )

  return (
    <Link
      to="/notifications"
      aria-label="Notifications"
      className="relative flex h-10 w-10 items-center justify-center rounded-full text-charcoal-300 hover:bg-charcoal-800 hover:text-charcoal-100"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
        <path d="M18 9a6 6 0 1 0-12 0c0 6-2.5 7-2.5 7h17S18 15 18 9zM10.3 20a2 2 0 0 0 3.4 0" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {unread && (
        <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-gold-500 ring-2 ring-charcoal-950" />
      )}
    </Link>
  )
}
