import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import { fetchMyConnections } from '../connections/api'
import { fetchCouple } from '../profiles/api'
import { ensureThread, messageBlockReason } from './api'
import { useMyEntity } from './useMyEntity'

/**
 * "Message" button for profile views. Pass the raw user doc (`member`) or
 * couple doc (`couple`) being viewed. Threads always run between PRIMARY
 * entities — a linked member is messaged as their couple, so both partners
 * share the inbox (no side-channels around a partner).
 */
export function MessageButton({ member, couple }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const me = useMyEntity()
  const [busy, setBusy] = useState(false)

  // A linked member's primary entity is their couple — resolve it.
  const { data: memberCouple, isPending: coupleLoading } = useQuery({
    queryKey: ['couple', member?.coupleId],
    queryFn: () => fetchCouple(member.coupleId),
    enabled: !!member?.coupleId,
  })

  const { data: connections } = useQuery({
    queryKey: ['connections', user.uid],
    queryFn: () => fetchMyConnections(user.uid),
  })

  const targetCouple = couple ?? (member?.coupleId ? memberCouple : null)
  if (member?.coupleId && !couple && coupleLoading) return null

  const target = targetCouple
    ? {
        entity: {
          type: 'couple',
          id: targetCouple.id,
          uids: targetCouple.partnerUids,
          name: targetCouple.coupleName,
          photoURL: targetCouple.coverPhotoURL ?? null,
        },
        doc: targetCouple,
      }
    : {
        entity: {
          type: 'user',
          id: member.id,
          uids: [member.id],
          name: member.displayName,
          photoURL: member.photoURL ?? null,
        },
        doc: member,
      }

  if (!me.ready || target.entity.uids.includes(user.uid)) return null

  const reason = messageBlockReason({
    me,
    target: { ...target.doc, id: target.entity.id },
    targetType: target.entity.type,
    connections,
  })

  const open = async () => {
    if (busy) return
    setBusy(true)
    try {
      const threadId = await ensureThread(me.entity, target.entity)
      navigate(`/messages/${threadId}`)
    } catch (err) {
      console.error(err)
      setBusy(false)
    }
  }

  if (reason) {
    return (
      <span
        title={reason}
        className="flex h-10 cursor-not-allowed items-center rounded-2xl bg-charcoal-800 px-4 text-sm font-medium text-charcoal-500 ring-1 ring-charcoal-700"
      >
        Message
      </span>
    )
  }

  return (
    <button
      onClick={open}
      disabled={busy}
      className="flex h-10 items-center rounded-2xl bg-charcoal-800 px-4 text-sm font-semibold text-charcoal-100 ring-1 ring-charcoal-600 transition hover:bg-charcoal-700 disabled:opacity-50"
    >
      {busy ? 'Opening…' : 'Message'}
    </button>
  )
}
