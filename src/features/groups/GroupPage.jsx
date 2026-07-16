import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import {
  createGroupPost,
  deleteGroupPost,
  fetchGroup,
  fetchGroupPosts,
  fetchMembers,
  fetchMembership,
  joinGroup,
  leaveGroup,
  removeMember,
} from './api'
import { ReportDialog } from '../feed/ReportDialog'
import { useBlocks } from '../feed/useBlocks'
import { Avatar } from '../../components/Avatar'
import { timeAgo } from '../../lib/time'

export function GroupPage() {
  const { groupId } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const queryClient = useQueryClient()
  const { blockedIds } = useBlocks()
  const [text, setText] = useState('')
  const [reportingPost, setReportingPost] = useState(null)

  const { data: group, isPending } = useQuery({
    queryKey: ['group', groupId],
    queryFn: () => fetchGroup(groupId),
  })
  const { data: membership } = useQuery({
    queryKey: ['groupMembership', groupId, user.uid],
    queryFn: () => fetchMembership(groupId, user.uid),
  })
  const { data: members = [] } = useQuery({
    queryKey: ['groupMembers', groupId],
    queryFn: () => fetchMembers(groupId),
    enabled: !!membership,
  })
  const { data: posts = [] } = useQuery({
    queryKey: ['groupPosts', groupId],
    queryFn: () => fetchGroupPosts(groupId),
    enabled: !!membership,
  })

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['group', groupId] })
    queryClient.invalidateQueries({ queryKey: ['groupMembership', groupId, user.uid] })
    queryClient.invalidateQueries({ queryKey: ['groupMembers', groupId] })
    queryClient.invalidateQueries({ queryKey: ['groupPosts', groupId] })
    queryClient.invalidateQueries({ queryKey: ['groups'] })
  }

  const join = useMutation({
    mutationFn: () =>
      joinGroup(groupId, { uid: user.uid, name: profile.displayName, photoURL: profile.photoURL }),
    onSuccess: invalidate,
  })
  const leave = useMutation({ mutationFn: () => leaveGroup(groupId, user.uid), onSuccess: invalidate })
  const post = useMutation({
    mutationFn: () =>
      createGroupPost(groupId, { uid: user.uid, name: profile.displayName, photoURL: profile.photoURL }, text.trim()),
    onSuccess: () => {
      setText('')
      invalidate()
    },
  })

  if (isPending) return <p className="px-4 pt-16 text-center text-sm text-charcoal-400">Loading…</p>
  if (!group) return <p className="px-4 pt-16 text-center text-sm text-charcoal-400">Group not found.</p>

  const isModerator = membership?.role === 'moderator'

  return (
    <div className="px-4 pt-6 pb-10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-charcoal-50">{group.name}</h1>
          <p className="mt-0.5 text-sm text-charcoal-400">
            📍 {group.region} · {group.memberCount ?? 0} members
          </p>
        </div>
        {membership ? (
          <button
            onClick={() => {
              if (window.confirm('Leave this group?')) leave.mutate()
            }}
            className="h-10 shrink-0 rounded-2xl bg-charcoal-800 px-4 text-sm text-charcoal-300 ring-1 ring-charcoal-600 hover:bg-charcoal-700"
          >
            Leave
          </button>
        ) : (
          <button
            onClick={() => join.mutate()}
            disabled={join.isPending}
            className="h-10 shrink-0 rounded-2xl bg-gold-500 px-5 text-sm font-semibold text-charcoal-950 hover:bg-gold-400 disabled:opacity-50"
          >
            Join
          </button>
        )}
      </div>

      {group.description && (
        <p className="mt-3 text-sm text-charcoal-300">{group.description}</p>
      )}

      {!membership && (
        <p className="mt-6 rounded-2xl bg-charcoal-900 p-4 text-sm text-charcoal-400 ring-1 ring-charcoal-800">
          Join to see the group feed and members.
        </p>
      )}

      {membership && (
        <>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (text.trim()) post.mutate()
            }}
            className="mt-5 flex gap-2"
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Post to ${group.name}…`}
              maxLength={1000}
              className="h-11 flex-1 rounded-2xl border border-charcoal-600 bg-charcoal-800 px-4 text-sm text-charcoal-50 placeholder-charcoal-400 outline-none focus:border-gold-500"
            />
            <button
              type="submit"
              disabled={!text.trim() || post.isPending}
              className="h-11 rounded-2xl bg-gold-500 px-4 font-semibold text-charcoal-950 hover:bg-gold-400 disabled:opacity-40"
            >
              Post
            </button>
          </form>

          <div className="mt-4 flex flex-col">
            {posts
              .filter((p) => !blockedIds.includes(p.authorId))
              .map((p) => (
                <article key={p.id} className="border-b border-charcoal-900 py-3">
                  <div className="flex items-center gap-2.5">
                    <Link to={`/u/${p.authorId}`}>
                      <Avatar src={p.authorPhotoURL} name={p.authorName} className="h-8 w-8 text-sm" />
                    </Link>
                    <p className="min-w-0 flex-1 truncate text-sm">
                      <span className="font-semibold text-charcoal-100">{p.authorName}</span>{' '}
                      <span className="text-xs text-charcoal-500">{timeAgo(p.createdAt)}</span>
                    </p>
                    {p.authorId === user.uid || isModerator ? (
                      <button
                        onClick={async () => {
                          if (!window.confirm('Delete this post?')) return
                          await deleteGroupPost(groupId, p.id)
                          invalidate()
                        }}
                        className="text-xs text-charcoal-500 hover:text-red-400"
                      >
                        Delete
                      </button>
                    ) : (
                      <button
                        onClick={() => setReportingPost(p.id)}
                        className="text-xs text-charcoal-500 hover:text-charcoal-300"
                      >
                        Report
                      </button>
                    )}
                  </div>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm text-charcoal-200">{p.text}</p>
                </article>
              ))}
            {posts.length === 0 && (
              <p className="py-8 text-center text-sm text-charcoal-500">
                No posts yet — say hi. 👋
              </p>
            )}
          </div>

          <section className="mt-6">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-charcoal-400">
              Members
            </h2>
            <div className="mt-2 flex flex-col gap-2">
              {members.map((m) => (
                <div key={m.uid} className="flex items-center gap-3">
                  <Link to={`/u/${m.uid}`} className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar src={m.photoURL} name={m.name} className="h-8 w-8 text-sm" />
                    <span className="truncate text-sm text-charcoal-100">
                      {m.name}
                      {m.role === 'moderator' && (
                        <span className="ml-1.5 rounded-full bg-charcoal-800 px-2 py-0.5 text-[10px] font-medium text-gold-400">
                          mod
                        </span>
                      )}
                    </span>
                  </Link>
                  {isModerator && m.uid !== user.uid && (
                    <button
                      onClick={async () => {
                        if (!window.confirm(`Remove ${m.name} from the group?`)) return
                        await removeMember(groupId, m.uid)
                        invalidate()
                      }}
                      className="text-xs text-charcoal-500 hover:text-red-400"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <ReportDialog
        open={!!reportingPost}
        onClose={() => setReportingPost(null)}
        targetType="post"
        targetId={`group:${groupId}/${reportingPost}`}
      />
    </div>
  )
}
