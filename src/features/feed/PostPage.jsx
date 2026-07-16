import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import { addComment, deleteComment, fetchComments, fetchPost } from './api'
import { useBlocks } from './useBlocks'
import { PostCard } from './PostCard'
import { ReportDialog } from './ReportDialog'
import { Avatar } from '../../components/Avatar'
import { timeAgo } from '../../lib/time'

export function PostPage() {
  const { postId } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const { blockedIds } = useBlocks()
  const queryClient = useQueryClient()
  const [text, setText] = useState('')
  const [reportingComment, setReportingComment] = useState(null)

  const { data: post, isPending } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => fetchPost(postId),
  })
  const { data: comments = [] } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => fetchComments(postId),
  })

  const send = useMutation({
    mutationFn: () =>
      addComment(postId, {
        authorId: user.uid,
        authorName: profile.displayName,
        authorPhotoURL: profile.photoURL,
        text: text.trim(),
      }),
    onSuccess: () => {
      setText('')
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
    },
  })

  const removeComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return
    await deleteComment(postId, commentId)
    queryClient.invalidateQueries({ queryKey: ['comments', postId] })
  }

  if (isPending) {
    return <p className="px-4 pt-16 text-center text-sm text-charcoal-400">Loading…</p>
  }
  if (!post) {
    return (
      <p className="px-4 pt-16 text-center text-sm text-charcoal-400">
        This post is gone or you don’t have access to it.
      </p>
    )
  }

  const visibleComments = comments.filter((c) => !blockedIds.includes(c.authorId))

  return (
    <div className="pb-28">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-charcoal-800 bg-charcoal-950/90 px-4 py-3 backdrop-blur">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full text-charcoal-300 hover:bg-charcoal-800"
          aria-label="Back"
        >
          ←
        </button>
        <h1 className="text-base font-semibold text-charcoal-50">Post</h1>
      </header>

      <PostCard post={post} onShare={(p) => navigate('/compose', { state: { shareOf: p } })} />

      <section className="px-4 pt-2">
        {visibleComments.length === 0 && (
          <p className="py-6 text-center text-sm text-charcoal-500">
            No comments yet — say something nice.
          </p>
        )}
        {visibleComments.map((c) => (
          <div key={c.id} className="flex gap-3 border-b border-charcoal-900 py-3">
            <Avatar src={c.authorPhotoURL} name={c.authorName} className="h-8 w-8 text-sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm">
                <span className="font-semibold text-charcoal-100">{c.authorName}</span>{' '}
                <span className="text-xs text-charcoal-500">{timeAgo(c.createdAt)}</span>
              </p>
              <p className="mt-0.5 whitespace-pre-wrap text-sm text-charcoal-200">{c.text}</p>
            </div>
            {c.authorId === user.uid || post.authorUids?.includes(user.uid) ? (
              <button
                onClick={() => removeComment(c.id)}
                className="self-start text-xs text-charcoal-500 hover:text-red-400"
              >
                Delete
              </button>
            ) : (
              <button
                onClick={() => setReportingComment(c.id)}
                className="self-start text-xs text-charcoal-500 hover:text-charcoal-300"
              >
                Report
              </button>
            )}
          </div>
        ))}
      </section>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (text.trim()) send.mutate()
        }}
        className="fixed inset-x-0 bottom-16 z-30 border-t border-charcoal-800 bg-charcoal-950 px-4 py-3 md:bottom-0 md:left-60"
      >
        <div className="mx-auto flex max-w-xl gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment…"
            maxLength={1000}
            className="h-11 flex-1 rounded-2xl border border-charcoal-600 bg-charcoal-800 px-4 text-sm text-charcoal-50 placeholder-charcoal-400 outline-none focus:border-gold-500"
          />
          <button
            type="submit"
            disabled={!text.trim() || send.isPending}
            className="h-11 rounded-2xl bg-gold-500 px-4 font-semibold text-charcoal-950 hover:bg-gold-400 disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </form>

      <ReportDialog
        open={!!reportingComment}
        onClose={() => setReportingComment(null)}
        targetType="comment"
        targetId={`${postId}/${reportingComment}`}
      />
    </div>
  )
}
