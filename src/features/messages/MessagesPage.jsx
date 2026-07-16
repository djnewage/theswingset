import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { isThreadUnread, listenThreads } from './api'
import { Avatar } from '../../components/Avatar'
import { timeAgo } from '../../lib/time'

export function MessagesPage() {
  const { user } = useAuth()
  const [threads, setThreads] = useState(null) // null = loading

  useEffect(() => listenThreads(user.uid, setThreads), [user.uid])

  return (
    <div className="px-4 pt-6 pb-8">
      <h1 className="text-xl font-semibold text-charcoal-50">Messages</h1>

      {threads === null && (
        <p className="py-10 text-center text-sm text-charcoal-500">Loading…</p>
      )}

      {threads?.length === 0 && (
        <div className="flex flex-col items-center px-6 pt-16 text-center">
          <img src="/pineapple.svg" alt="" className="h-14 w-14 opacity-60" />
          <h2 className="mt-4 text-lg font-semibold text-charcoal-50">No conversations yet</h2>
          <p className="mt-2 max-w-xs text-sm text-charcoal-400">
            Open a profile and tap Message — or break the ice with a reaction
            to their prompts.
          </p>
        </div>
      )}

      <div className="mt-3 flex flex-col">
        {threads?.map((t) => {
          const otherId = t.entityIds.find((id) => !t.entities[id].uids.includes(user.uid))
          const other = t.entities[otherId]
          const unread = isThreadUnread(t, user.uid)
          return (
            <Link
              key={t.id}
              to={`/messages/${t.id}`}
              className="flex items-center gap-3 rounded-2xl px-2 py-3 transition hover:bg-charcoal-900"
            >
              <Avatar src={other.photoURL} name={other.name} className="h-12 w-12 text-lg" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className={`truncate text-sm ${unread ? 'font-bold text-charcoal-50' : 'font-medium text-charcoal-100'}`}>
                    {other.name}
                    {other.type === 'couple' && (
                      <span className="ml-1.5 rounded-full bg-charcoal-800 px-2 py-0.5 text-[10px] font-medium text-gold-400">
                        couple
                      </span>
                    )}
                  </p>
                  {t.lastMessage?.at && (
                    <span className="shrink-0 text-xs text-charcoal-500">
                      {timeAgo(t.lastMessage.at)}
                    </span>
                  )}
                </div>
                <p className={`truncate text-sm ${unread ? 'text-charcoal-200' : 'text-charcoal-500'}`}>
                  {t.lastMessage
                    ? `${t.lastMessage.senderUid === user.uid ? 'You: ' : ''}${t.lastMessage.text}`
                    : 'Say hi 🍍'}
                </p>
              </div>
              {unread && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-gold-400" />}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
