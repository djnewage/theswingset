import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import { deleteReaction, fetchMyReactions } from './api'
import { Avatar } from '../../components/Avatar'
import { timeAgo } from '../../lib/time'

/** Inbox of icebreaker reactions people sent to your prompts. */
export function ReactionsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: reactions = [], isPending } = useQuery({
    queryKey: ['reactions', user.uid],
    queryFn: () => fetchMyReactions(user.uid),
  })

  return (
    <div className="px-4 pt-6 pb-8">
      <h1 className="mb-1 text-xl font-semibold text-charcoal-50">Icebreakers</h1>
      <p className="mb-5 text-sm text-charcoal-400">
        Reactions to your profile prompts. Like one? Check out their profile
        and connect.
      </p>

      {isPending && <p className="py-10 text-center text-sm text-charcoal-500">Loading…</p>}
      {!isPending && reactions.length === 0 && (
        <p className="py-10 text-center text-sm text-charcoal-400">
          No reactions yet. Add icebreaker prompts to your profile to invite them.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {reactions.map((r) => (
          <div key={r.id} className="rounded-2xl bg-charcoal-900 p-4 ring-1 ring-charcoal-800">
            <div className="flex items-center gap-3">
              <Link to={`/u/${r.fromId}`}>
                <Avatar src={r.fromPhotoURL} name={r.fromName} className="h-9 w-9 text-sm" />
              </Link>
              <p className="min-w-0 flex-1 text-sm">
                <Link to={`/u/${r.fromId}`} className="font-semibold text-charcoal-50 hover:text-gold-300">
                  {r.fromName}
                </Link>{' '}
                <span className="text-lg">{r.emoji}</span>{' '}
                <span className="text-xs text-charcoal-500">{timeAgo(r.createdAt)}</span>
              </p>
              <button
                onClick={async () => {
                  await deleteReaction(r.id)
                  queryClient.invalidateQueries({ queryKey: ['reactions', user.uid] })
                }}
                className="text-xs text-charcoal-500 hover:text-red-400"
              >
                Dismiss
              </button>
            </div>
            <p className="mt-2 text-xs text-charcoal-500">On: “{r.prompt}”</p>
            {r.text && <p className="mt-1 text-sm text-charcoal-200">{r.text}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
