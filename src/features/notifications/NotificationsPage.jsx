import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import { useDiscretion } from '../discretion/DiscretionProvider'
import { fetchNotifications, markAllRead } from './api'
import { timeAgo } from '../../lib/time'

const ICONS = {
  like: '💛',
  comment: '💬',
  connection_request: '🤝',
  connection_accepted: '🎉',
  rsvp: '📅',
}

export function NotificationsPage() {
  const { user } = useAuth()
  const { settings } = useDiscretion()
  const queryClient = useQueryClient()

  const { data: notifications = [], isPending } = useQuery({
    queryKey: ['notifications', user.uid],
    queryFn: () => fetchNotifications(user.uid),
  })

  // Opening the page clears the unread state.
  useEffect(() => {
    if (notifications.some((n) => !n.read)) {
      markAllRead(notifications).then(() => {
        queryClient.invalidateQueries({ queryKey: ['unread', user.uid] })
      })
    }
  }, [notifications, queryClient, user.uid])

  return (
    <div className="px-4 pt-6 pb-8">
      <h1 className="mb-4 text-xl font-semibold text-charcoal-50">Notifications</h1>

      {isPending && <p className="py-10 text-center text-sm text-charcoal-500">Loading…</p>}

      {!isPending && notifications.length === 0 && (
        <p className="py-10 text-center text-sm text-charcoal-400">
          Nothing yet. Likes, comments, requests, and RSVPs land here.
        </p>
      )}

      <div className="flex flex-col">
        {notifications.map((n) => (
          <Link
            key={n.id}
            to={n.link ?? '/'}
            className={`flex items-start gap-3 border-b border-charcoal-900 px-1 py-3.5 ${
              n.read ? 'opacity-60' : ''
            }`}
          >
            <span className="text-xl">{settings.discreetNotifications ? '🔔' : (ICONS[n.type] ?? '🔔')}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-charcoal-100">
                {settings.discreetNotifications ? 'New activity' : n.text}
              </p>
              <p className="mt-0.5 text-xs text-charcoal-500">{timeAgo(n.createdAt)}</p>
            </div>
            {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-gold-500" />}
          </Link>
        ))}
      </div>
    </div>
  )
}
