import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { isThreadUnread, listenThreads } from './api'

/** True when any thread has unread activity — drives the Messages tab dot. */
export function useUnreadMessages() {
  const { user } = useAuth()
  const [hasUnread, setHasUnread] = useState(false)

  useEffect(
    () =>
      listenThreads(user.uid, (threads) =>
        setHasUnread(threads.some((t) => isThreadUnread(t, user.uid))),
      ),
    [user.uid],
  )

  return hasUnread
}
