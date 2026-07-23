import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import { fetchCouple, fetchUser } from './api'
import { ConnectButton } from '../connections/ConnectButton'
import { MessageButton } from '../messages/MessageButton'
import { BoundariesCard } from './BoundariesCard'
import { ReferencesSection } from '../references/ReferencesSection'
import { AlbumsSection } from '../albums/AlbumsSection'
import { ReportDialog } from '../feed/ReportDialog'
import { AuthorPosts } from '../feed/AuthorPosts'
import { useBlocks } from '../feed/useBlocks'
import { Avatar } from '../../components/Avatar'
import { Lightbox } from '../../components/Lightbox'
import { memberName } from '../../lib/names'
import { monthYear } from '../../lib/time'

export function CoupleProfileView() {
  const { coupleId } = useParams()
  const { user } = useAuth()
  const { block, isBlocked, unblock } = useBlocks()
  const [reporting, setReporting] = useState(false)
  const [coverOpen, setCoverOpen] = useState(false)

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
        <button onClick={() => setCoverOpen(true)} className="block w-full cursor-zoom-in">
          <img src={couple.coverPhotoURL} alt="" className="h-48 w-full object-cover" />
        </button>
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
            {couple.createdAt && (
              <p className="mt-0.5 text-xs text-charcoal-500">
                Members since {monthYear(couple.createdAt)}
              </p>
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
              <MessageButton couple={{ ...couple, id: couple.id }} />
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
              <Link
                key={partner.id}
                to={`/u/${partner.id}`}
                className="flex items-center gap-2 rounded-full py-1 pr-3 pl-1 ring-1 ring-charcoal-800 transition hover:bg-charcoal-900 hover:ring-charcoal-700"
              >
                <Avatar src={partner.photoURL} name={memberName(partner)} className="h-9 w-9 text-sm" />
                <span className="text-sm text-charcoal-200">{memberName(partner)}</span>
              </Link>
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

        <AuthorPosts authorId={coupleId} heading={`${couple.coupleName}'s posts`} />

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

      {coverOpen && (
        <Lightbox images={[couple.coverPhotoURL]} onClose={() => setCoverOpen(false)} />
      )}
    </div>
  )
}
