import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import { useDiscretion } from '../discretion/DiscretionProvider'
import { fetchNotifications, markAllRead } from './api'
import { disablePush, enablePush, pushEnabledHere, pushSupported } from './push'
import { timeAgo } from '../../lib/time'

const ICONS = {
  like: '💛',
  comment: '💬',
  connection_request: '🤝',
  connection_accepted: '🎉',
  rsvp: '📅',
}

/** Enable/disable device push. Discreet mode is honored per device: with it
 * on, this device's lock screen shows only "New activity". */
function PushBanner() {
  const { user } = useAuth()
  const { settings } = useDiscretion()
  const [state, setState] = useState('loading') // loading|off|on|denied|unsupported|hidden

  useEffect(() => {
    if (!pushSupported()) {
      setState('unsupported')
      return
    }
    if (Notification.permission === 'denied') {
      setState('denied')
      return
    }
    pushEnabledHere().then((on) => setState(on ? 'on' : 'off'))
  }, [])

  if (state === 'loading' || state === 'unsupported' || state === 'hidden') return null

  if (state === 'denied') {
    return (
      <p className="mb-4 rounded-2xl bg-charcoal-900 px-4 py-3 text-xs text-charcoal-400 ring-1 ring-charcoal-800">
        Notifications are blocked for this site in your browser settings — allow
        them there to get push alerts.
      </p>
    )
  }

  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-charcoal-900 px-4 py-3 ring-1 ring-charcoal-800">
      <div>
        <p className="text-sm font-medium text-charcoal-100">
          {state === 'on' ? 'Push notifications are on' : 'Get notified on this device'}
        </p>
        <p className="mt-0.5 text-xs text-charcoal-400">
          {state === 'on'
            ? settings.discreetNotifications
              ? 'Discreet mode: alerts say only “New activity.”'
              : 'Messages, requests, and replies reach your lock screen.'
            : 'DMs and connection requests, even when the app is closed.'}
        </p>
      </div>
      <button
        onClick={async () => {
          if (state === 'on') {
            await disablePush(user.uid)
            setState('off')
          } else {
            const result = await enablePush(user.uid, { discreet: settings.discreetNotifications })
            setState(result === 'enabled' ? 'on' : result === 'denied' ? 'denied' : 'off')
          }
        }}
        className={`h-9 shrink-0 rounded-xl px-3.5 text-sm font-semibold ${
          state === 'on'
            ? 'bg-charcoal-800 text-charcoal-300 ring-1 ring-charcoal-600 hover:bg-charcoal-700'
            : 'bg-gold-500 text-charcoal-950 hover:bg-gold-400'
        }`}
      >
        {state === 'on' ? 'Turn off' : 'Enable'}
      </button>
    </div>
  )
}

export function NotificationsPage() {
  const { user } = useAuth()
  const { settings } = useDiscretion()
  const queryClient = useQueryClient()
  const navigate = useNavigate()

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
      <div className="mb-4 flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="-ml-2 flex h-9 w-9 items-center justify-center rounded-full text-charcoal-300 hover:bg-charcoal-800"
          aria-label="Back"
        >
          ←
        </button>
        <h1 className="text-xl font-semibold text-charcoal-50">Notifications</h1>
      </div>

      <PushBanner />

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
