import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import { usePostableAuthors } from '../feed/useAuthor'
import { fetchConnection, sendConnectionRequest } from './api'

/**
 * Connect / Pending / Connected button for another entity's profile.
 * Requests are sent from the viewer's primary identity: their couple when
 * linked, otherwise themself.
 */
export function ConnectButton({ target }) {
  const { user, profile } = useAuth()
  const queryClient = useQueryClient()
  const authors = usePostableAuthors()
  const me = authors.find((a) => a.type === 'couple') ?? authors[0]
  const myIds = [user.uid, profile.coupleId].filter(Boolean)

  const { data: connection, isPending } = useQuery({
    queryKey: ['connection', me.id, target.id],
    queryFn: () => fetchConnection(me.id, target.id),
  })

  const send = useMutation({
    mutationFn: () => sendConnectionRequest(me, target),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['connection', me.id, target.id] }),
  })

  if (myIds.includes(target.id) || isPending) return null

  if (connection?.status === 'accepted') {
    return (
      <span className="flex h-11 items-center justify-center rounded-2xl bg-charcoal-800 px-5 text-sm font-semibold text-gold-400 ring-1 ring-gold-700/50">
        ✓ Connected
      </span>
    )
  }

  if (connection?.status === 'pending') {
    return myIds.includes(connection.toId) ? (
      <Link
        to="/connections"
        className="flex h-11 items-center justify-center rounded-2xl bg-gold-500 px-5 text-sm font-semibold text-charcoal-950 hover:bg-gold-400"
      >
        Respond to request
      </Link>
    ) : (
      <span className="flex h-11 items-center justify-center rounded-2xl bg-charcoal-800 px-5 text-sm font-medium text-charcoal-300 ring-1 ring-charcoal-600">
        Request pending
      </span>
    )
  }

  return (
    <button
      onClick={() => send.mutate()}
      disabled={send.isPending}
      className="h-11 rounded-2xl bg-gold-500 px-5 text-sm font-semibold text-charcoal-950 hover:bg-gold-400 disabled:opacity-50"
    >
      Connect{me.type === 'couple' ? ` as ${me.name}` : ''}
    </button>
  )
}
