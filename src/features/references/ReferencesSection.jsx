import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import { usePostableAuthors } from '../feed/useAuthor'
import { fetchConnection } from '../connections/api'
import { ReportDialog } from '../feed/ReportDialog'
import { deleteReference, fetchReferencesFor, leaveReference } from './api'
import { Avatar } from '../../components/Avatar'
import { timeAgo } from '../../lib/time'

/**
 * References shown on a profile (`target` is a postable-author-style object).
 * Writing requires an accepted connection (shared-event vouches are also
 * allowed by rules; the composer appears for connections).
 */
export function ReferencesSection({ target }) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const authors = usePostableAuthors()
  const me = authors.find((a) => a.type === 'couple') ?? authors[0]
  const isMine = target.uids.includes(user.uid)

  const [text, setText] = useState('')
  const [reporting, setReporting] = useState(null)

  const { data: references = [] } = useQuery({
    queryKey: ['references', target.id],
    queryFn: () => fetchReferencesFor(target.id),
  })
  const { data: connection } = useQuery({
    queryKey: ['connection', me.id, target.id],
    queryFn: () => fetchConnection(me.id, target.id),
    enabled: !isMine,
  })

  const submit = useMutation({
    mutationFn: () => leaveReference(me, target, text.trim()),
    onSuccess: () => {
      setText('')
      queryClient.invalidateQueries({ queryKey: ['references', target.id] })
    },
  })

  const canWrite =
    !isMine &&
    connection?.status === 'accepted' &&
    !references.some((r) => r.fromId === me.id)

  if (references.length === 0 && !canWrite) return null

  return (
    <section className="mt-6">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-charcoal-400">
        References
      </h2>

      {references.length === 0 && (
        <p className="mt-2 text-sm text-charcoal-500">No references yet.</p>
      )}

      <div className="mt-2 flex flex-col gap-2">
        {references.map((r) => (
          <div key={r.id} className="rounded-2xl bg-charcoal-900 p-3.5 ring-1 ring-charcoal-800">
            <div className="flex items-center gap-2.5">
              <Avatar src={r.fromPhotoURL} name={r.fromName} className="h-7 w-7 text-xs" />
              <p className="min-w-0 flex-1 truncate text-sm">
                <span className="font-semibold text-charcoal-100">{r.fromName}</span>{' '}
                <span className="text-xs text-charcoal-500">{timeAgo(r.createdAt)}</span>
              </p>
              {r.fromUids.includes(user.uid) || isMine ? (
                <button
                  onClick={async () => {
                    if (!window.confirm('Remove this reference?')) return
                    await deleteReference(r.id)
                    queryClient.invalidateQueries({ queryKey: ['references', target.id] })
                  }}
                  className="text-xs text-charcoal-500 hover:text-red-400"
                >
                  Remove
                </button>
              ) : (
                <button
                  onClick={() => setReporting(r.id)}
                  className="text-xs text-charcoal-500 hover:text-charcoal-300"
                >
                  Report
                </button>
              )}
            </div>
            {r.eventTitle && (
              <p className="mt-1 text-xs text-gold-400">Met at {r.eventTitle}</p>
            )}
            <p className="mt-1.5 whitespace-pre-wrap text-sm text-charcoal-200">{r.text}</p>
          </div>
        ))}
      </div>

      {canWrite && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (text.trim()) submit.mutate()
          }}
          className="mt-3"
        >
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            maxLength={300}
            placeholder="Leave a reference — how do you know them? (visible to members)"
            className="w-full rounded-2xl border border-charcoal-600 bg-charcoal-800 px-4 py-3 text-sm text-charcoal-50 placeholder-charcoal-400 outline-none focus:border-gold-500"
          />
          <button
            type="submit"
            disabled={!text.trim() || submit.isPending}
            className="mt-2 h-10 rounded-2xl bg-gold-500 px-5 text-sm font-semibold text-charcoal-950 hover:bg-gold-400 disabled:opacity-40"
          >
            Post reference
          </button>
        </form>
      )}

      <ReportDialog
        open={!!reporting}
        onClose={() => setReporting(null)}
        targetType="post"
        targetId={`reference:${reporting}`}
      />
    </section>
  )
}
