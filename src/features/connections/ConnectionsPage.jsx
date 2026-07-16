import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import { fetchMyConnections, removeConnection, respondToRequest } from './api'
import { useBlocks } from '../feed/useBlocks'
import { fetchCouple, fetchUser } from '../profiles/api'
import { Avatar } from '../../components/Avatar'

export function ConnectionsPage() {
  const { user, profile } = useAuth()
  const queryClient = useQueryClient()
  const myIds = [user.uid, profile.coupleId].filter(Boolean)

  const { data: connections = [], isPending } = useQuery({
    queryKey: ['connections', user.uid],
    queryFn: () => fetchMyConnections(user.uid),
  })
  const { data: myCouple } = useQuery({
    queryKey: ['couple', profile.coupleId],
    queryFn: () => fetchCouple(profile.coupleId),
    enabled: !!profile.coupleId,
  })

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['connections', user.uid] })

  const respond = useMutation({
    mutationFn: ({ connection, accept }) =>
      respondToRequest(connection, { uid: user.uid, myCouple }, accept),
    onSuccess: invalidate,
  })
  const remove = useMutation({
    mutationFn: (id) => removeConnection(id),
    onSuccess: invalidate,
  })

  if (isPending) {
    return <p className="px-4 pt-16 text-center text-sm text-charcoal-400">Loading…</p>
  }

  const incoming = connections.filter(
    (c) => c.status === 'pending' && myIds.includes(c.toId),
  )
  const outgoing = connections.filter(
    (c) => c.status === 'pending' && myIds.includes(c.fromId),
  )
  const accepted = connections.filter((c) => c.status === 'accepted')

  const other = (c) =>
    myIds.includes(c.fromId)
      ? { id: c.toId, type: c.toType, name: c.toName, photoURL: c.toPhotoURL }
      : { id: c.fromId, type: c.fromType, name: c.fromName, photoURL: c.fromPhotoURL }

  const profileLink = (e) => (e.type === 'couple' ? `/c/${e.id}` : `/u/${e.id}`)

  return (
    <div className="px-4 pt-6 pb-8">
      <h1 className="mb-5 text-xl font-semibold text-charcoal-50">Connections</h1>

      {incoming.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gold-400">
            Requests ({incoming.length})
          </h2>
          <div className="flex flex-col gap-2">
            {incoming.map((c) => {
              const e = other(c)
              const iApproved = c.approvals?.[user.uid]
              const partnerApproved = myCouple?.partnerUids?.some(
                (p) => p !== user.uid && c.approvals?.[p],
              )
              return (
                <div key={c.id} className="rounded-2xl bg-charcoal-900 p-3 ring-1 ring-charcoal-800">
                  <div className="flex items-center gap-3">
                    <Link to={profileLink(e)} className="flex min-w-0 flex-1 items-center gap-3">
                      <Avatar src={e.photoURL} name={e.name} className="h-10 w-10 text-base" />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-charcoal-50">{e.name}</p>
                        <p className="text-xs text-charcoal-400">{e.type === 'couple' ? 'Couple' : 'Member'}</p>
                      </div>
                    </Link>
                    {iApproved ? (
                      <span className="text-xs font-medium text-gold-400">
                        You approved ✓
                      </span>
                    ) : (
                      <button
                        onClick={() => respond.mutate({ connection: c, accept: true })}
                        className="h-9 rounded-xl bg-gold-500 px-3.5 text-sm font-semibold text-charcoal-950 hover:bg-gold-400"
                      >
                        Accept
                      </button>
                    )}
                    <button
                      onClick={() => respond.mutate({ connection: c, accept: false })}
                      className="h-9 rounded-xl bg-charcoal-800 px-3.5 text-sm text-charcoal-300 ring-1 ring-charcoal-600 hover:bg-charcoal-700"
                    >
                      Decline
                    </button>
                  </div>
                  {(iApproved || partnerApproved) && (
                    <p className="mt-2 text-xs text-charcoal-400">
                      Dual consent is on — waiting for {iApproved ? 'your partner' : 'you'} to approve.
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      <section className="mb-6">
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-charcoal-400">
          Connected ({accepted.length})
        </h2>
        {accepted.length === 0 ? (
          <p className="rounded-2xl bg-charcoal-900 p-4 text-sm text-charcoal-400 ring-1 ring-charcoal-800">
            No connections yet.{' '}
            <Link to="/discover" className="font-medium text-gold-400">
              Browse Discover
            </Link>{' '}
            to find couples near you.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {accepted.map((c) => {
              const e = other(c)
              return (
                <div key={c.id} className="flex items-center gap-3 rounded-2xl bg-charcoal-900 p-3 ring-1 ring-charcoal-800">
                  <Link to={profileLink(e)} className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar src={e.photoURL} name={e.name} className="h-10 w-10 text-base" />
                    <p className="truncate text-sm font-semibold text-charcoal-50">{e.name}</p>
                  </Link>
                  <button
                    onClick={() => {
                      if (window.confirm(`Disconnect from ${e.name}?`)) remove.mutate(c.id)
                    }}
                    className="text-xs text-charcoal-500 hover:text-red-400"
                  >
                    Disconnect
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <BlockedSection />

      {outgoing.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-charcoal-400">
            Sent ({outgoing.length})
          </h2>
          <div className="flex flex-col gap-2">
            {outgoing.map((c) => {
              const e = other(c)
              return (
                <div key={c.id} className="flex items-center gap-3 rounded-2xl bg-charcoal-900 p-3 ring-1 ring-charcoal-800">
                  <Avatar src={e.photoURL} name={e.name} className="h-10 w-10 text-base" />
                  <p className="min-w-0 flex-1 truncate text-sm text-charcoal-200">{e.name}</p>
                  <span className="text-xs text-charcoal-500">Pending</span>
                  <button
                    onClick={() => remove.mutate(c.id)}
                    className="text-xs text-charcoal-500 hover:text-red-400"
                  >
                    Cancel
                  </button>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}

function BlockedSection() {
  const { blockedIds, unblock } = useBlocks()

  const { data: blocked = [] } = useQuery({
    queryKey: ['blockedProfiles', blockedIds],
    queryFn: async () => {
      const entries = await Promise.all(
        blockedIds.map(async (id) => {
          const asUser = await fetchUser(id).catch(() => null)
          if (asUser) return { id, name: asUser.displayName, photoURL: asUser.photoURL }
          const asCouple = await fetchCouple(id).catch(() => null)
          if (asCouple) return { id, name: asCouple.coupleName, photoURL: asCouple.coverPhotoURL }
          return { id, name: 'Member', photoURL: null }
        }),
      )
      return entries
    },
    enabled: blockedIds.length > 0,
  })

  if (blockedIds.length === 0) return null

  return (
    <section className="mb-6">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-charcoal-400">
        Blocked ({blockedIds.length})
      </h2>
      <div className="flex flex-col gap-2">
        {blocked.map((b) => (
          <div key={b.id} className="flex items-center gap-3 rounded-2xl bg-charcoal-900 p-3 ring-1 ring-charcoal-800">
            <Avatar src={b.photoURL} name={b.name} className="h-10 w-10 text-base" />
            <p className="min-w-0 flex-1 truncate text-sm text-charcoal-300">{b.name}</p>
            <button
              onClick={() => unblock(b.id)}
              className="h-9 rounded-xl bg-charcoal-800 px-3.5 text-sm text-charcoal-300 ring-1 ring-charcoal-600 hover:bg-charcoal-700"
            >
              Unblock
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
