import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import { fetchCouple, fetchUser } from './api'
import { ConnectButton } from '../connections/ConnectButton'
import { BoundariesCard } from './BoundariesCard'
import { ReferencesSection } from '../references/ReferencesSection'
import { AlbumsSection } from '../albums/AlbumsSection'
import { ReportDialog } from '../feed/ReportDialog'
import { useBlocks } from '../feed/useBlocks'
import { Avatar } from '../../components/Avatar'

export function CoupleProfileView() {
  const { coupleId } = useParams()
  const { user } = useAuth()
  const { block, isBlocked, unblock } = useBlocks()
  const [reporting, setReporting] = useState(false)

  const { data: couple, isPending } = useQuery({
    queryKey: ['couple', coupleId],
    queryFn: () => fetchCouple(coupleId),
  })

  const partnerQueries = useQuery({
    queryKey: ['couplePartners', coupleId],
    queryFn: async () => {
      const users = await Promise.all(
        couple.partnerUids.map((uid) => fetchUser(uid).catch(() => null)),
      )
      return users.filter(Boolean)
    },
    enabled: !!couple,
  })

  if (isPending) {
    return <p className="px-4 pt-16 text-center text-sm text-charcoal-400">Loading…</p>
  }
  if (!couple) {
    return (
      <p className="px-4 pt-16 text-center text-sm text-charcoal-400">
        This profile doesn’t exist or isn’t visible to you.
      </p>
    )
  }

  const isMine = couple.partnerUids.includes(user.uid)
  const blocked = isBlocked(coupleId)

  return (
    <div className="pb-10">
      {couple.coverPhotoURL ? (
        <img src={couple.coverPhotoURL} alt="" className="h-48 w-full object-cover" />
      ) : (
        <div className="h-24 w-full bg-gradient-to-r from-gold-700/40 to-charcoal-800" />
      )}

      <div className="px-4 pt-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-charcoal-50">
              {couple.coupleName}
              {couple.verified && <span className="ml-2 text-gold-400" title="Verified">✓</span>}
            </h1>
            {couple.location && (
              <p className="mt-0.5 text-sm text-charcoal-400">📍 {couple.location}</p>
            )}
          </div>
          {!isMine && (
            <div className="flex shrink-0 flex-col items-end gap-2">
              <ConnectButton
                target={{
                  type: 'couple',
                  id: couple.id,
                  uids: couple.partnerUids,
                  name: couple.coupleName,
                  photoURL: couple.coverPhotoURL,
                }}
              />
              <div className="flex gap-3 text-xs text-charcoal-500">
                <button onClick={() => setReporting(true)} className="hover:text-charcoal-300">
                  Report
                </button>
                <button
                  onClick={() => (blocked ? unblock(coupleId) : block(coupleId))}
                  className="hover:text-red-400"
                >
                  {blocked ? 'Unblock' : 'Block'}
                </button>
              </div>
            </div>
          )}
        </div>

        {partnerQueries.data?.length > 0 && (
          <div className="mt-4 flex gap-4">
            {partnerQueries.data.map((partner) => (
              <div key={partner.id} className="flex items-center gap-2">
                <Avatar src={partner.photoURL} name={partner.displayName} className="h-9 w-9 text-sm" />
                <span className="text-sm text-charcoal-200">{partner.displayName}</span>
              </div>
            ))}
          </div>
        )}

        {couple.bio && (
          <p className="mt-4 whitespace-pre-wrap text-[15px] leading-6 text-charcoal-100">
            {couple.bio}
          </p>
        )}

        {couple.lookingFor?.length > 0 && (
          <div className="mt-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-charcoal-400">
              Looking for
            </h2>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {couple.lookingFor.map((tag) => (
                <span key={tag} className="rounded-full bg-charcoal-800 px-2.5 py-1 text-xs font-medium text-gold-400">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        <BoundariesCard boundaries={couple.boundaries} />

        <AlbumsSection ownerId={coupleId} />

        <ReferencesSection
          target={{
            type: 'couple',
            id: coupleId,
            uids: couple.partnerUids,
            name: couple.coupleName,
            photoURL: couple.coverPhotoURL,
          }}
        />
      </div>

      <ReportDialog
        open={reporting}
        onClose={() => setReporting(false)}
        targetType="couple"
        targetId={coupleId}
      />
    </div>
  )
}
