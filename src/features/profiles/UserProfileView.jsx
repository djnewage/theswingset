import { useState } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import { fetchUser } from './api'
import { ConnectButton } from '../connections/ConnectButton'
import { MessageButton } from '../messages/MessageButton'
import { BoundariesCard } from './BoundariesCard'
import { PromptsCard } from '../prompts/PromptsCard'
import { ReferencesSection } from '../references/ReferencesSection'
import { AlbumsSection } from '../albums/AlbumsSection'
import { ReportDialog } from '../feed/ReportDialog'
import { AuthorPosts } from '../feed/AuthorPosts'
import { useBlocks } from '../feed/useBlocks'
import { Avatar } from '../../components/Avatar'
import { Lightbox } from '../../components/Lightbox'
import { memberName } from '../../lib/names'
import { monthYear } from '../../lib/time'

export function UserProfileView() {
  const { uid } = useParams()
  const { user } = useAuth()
  const { block, isBlocked, unblock } = useBlocks()
  const [reporting, setReporting] = useState(false)
  const [photoOpen, setPhotoOpen] = useState(false)
  const [params] = useSearchParams()

  const { data: member, isPending, isError } = useQuery({
    queryKey: ['user', uid],
    queryFn: () => fetchUser(uid),
    retry: false, // permission-denied = profile hidden from this viewer
  })

  // "Preview how members see you" renders your own profile as a visitor
  // would see it; without the flag, your own URL bounces to the profile tab.
  const previewing = uid === user.uid && params.get('preview') === '1'
  if (uid === user.uid && !previewing) return <Navigate to="/profile" replace />

  if (isPending) {
    return <p className="px-4 pt-16 text-center text-sm text-charcoal-400">Loading…</p>
  }
  if (isError || !member) {
    return (
      <p className="px-4 pt-16 text-center text-sm text-charcoal-400">
        This profile doesn’t exist or isn’t visible to you.
      </p>
    )
  }

  const blocked = isBlocked(uid)

  return (
    <div className="px-4 pt-8 pb-10">
      {previewing && (
        <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl bg-gold-500/10 px-4 py-3 ring-1 ring-gold-600/40">
          <p className="text-xs leading-5 text-gold-300">
            👀 This is how other members see your profile. Connections-gated
            albums and posts may show less to people you're not connected with.
          </p>
          <Link to="/profile" className="shrink-0 text-xs font-semibold text-gold-400 hover:text-gold-300">
            Done
          </Link>
        </div>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-4">
          <button
            onClick={() => member.photoURL && setPhotoOpen(true)}
            className={member.photoURL ? 'cursor-zoom-in' : 'cursor-default'}
            aria-label={member.photoURL ? 'View profile photo' : undefined}
          >
            <Avatar src={member.photoURL} name={memberName(member)} className="h-16 w-16 text-2xl" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-charcoal-50">
              {memberName(member)}
              {member.verified && (
                <span className="ml-1.5 text-gold-400" title="Photo verified">✓</span>
              )}
            </h1>
            {member.location && (
              <p className="mt-0.5 text-sm text-charcoal-400">📍 {member.location}</p>
            )}
            {member.createdAt && (
              <p className="mt-0.5 text-xs text-charcoal-500">
                Member since {monthYear(member.createdAt)}
              </p>
            )}
          </div>
        </div>
      </div>

      {!previewing && (
        <div className="mt-4 flex items-center gap-3">
          <ConnectButton
            target={{
              type: 'user',
              id: member.id,
              uids: [member.id],
              name: member.displayName,
              photoURL: member.photoURL,
            }}
          />
          <MessageButton member={member} />
          <button onClick={() => setReporting(true)} className="text-xs text-charcoal-500 hover:text-charcoal-300">
            Report
          </button>
          <button
            onClick={() => (blocked ? unblock(uid) : block(uid))}
            className="text-xs text-charcoal-500 hover:text-red-400"
          >
            {blocked ? 'Unblock' : 'Block'}
          </button>
        </div>
      )}

      {member.bio && (
        <p className="mt-4 whitespace-pre-wrap text-[15px] leading-6 text-charcoal-100">
          {member.bio}
        </p>
      )}

      {member.interests?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {member.interests.map((tag) => (
            <span key={tag} className="rounded-full bg-charcoal-800 px-2.5 py-1 text-xs font-medium text-gold-400">
              {tag}
            </span>
          ))}
        </div>
      )}

      <BoundariesCard boundaries={member.boundaries} />

      <AuthorPosts authorId={uid} heading={`${member.displayName}'s posts`} />

      <PromptsCard
        prompts={member.prompts}
        target={{ type: 'user', id: uid, uids: [uid], name: member.displayName, photoURL: member.photoURL }}
      />

      <AlbumsSection ownerId={uid} />

      <ReferencesSection
        target={{ type: 'user', id: uid, uids: [uid], name: member.displayName, photoURL: member.photoURL }}
      />

      <ReportDialog
        open={reporting}
        onClose={() => setReporting(false)}
        targetType="user"
        targetId={uid}
      />

      {photoOpen && (
        <Lightbox images={[member.photoURL]} onClose={() => setPhotoOpen(false)} />
      )}
    </div>
  )
}
