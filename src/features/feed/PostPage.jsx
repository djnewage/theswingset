import { useRef, useState } from 'react'
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
  const [replyTo, setReplyTo] = useState(null) // { commentId, authorId, authorName }
  const [reportingComment, setReportingComment] = useState(null)
  const inputRef = useRef(null)

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
        replyTo,
      }),
    onSuccess: () => {
      setText('')
      setReplyTo(null)
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
    },
  })

  const removeComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return
    await deleteComment(postId, commentId)
    queryClient.invalidateQueries({ queryKey: ['comments', postId] })
  }

  const startReply = (comment) => {
    // Replies always thread under the ROOT comment (one level deep).
    setReplyTo({
      commentId: comment.replyTo?.commentId ?? comment.id,
      authorId: comment.authorId,
      authorName: comment.authorName,
    })
    inputRef.current?.focus()
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

  // Thread the flat list: roots in order, replies grouped under their root.
  // Replies whose root was deleted surface as top-level so they stay visible.
  const visible = comments.filter((c) => !blockedIds.includes(c.authorId))
  const rootIds = new Set(visible.filter((c) => !c.replyTo).map((c) => c.id))
  const replies = new Map()
  for (const c of visible) {
    if (c.replyTo && rootIds.has(c.replyTo.commentId)) {
      const list = replies.get(c.replyTo.commentId) ?? []
      list.push(c)
      replies.set(c.replyTo.commentId, list)
    }
  }
  const roots = visible.filter((c) => !c.replyTo || !rootIds.has(c.replyTo.commentId))

  const Comment = ({ comment, isReply }) => (
    <div className={`flex gap-3 py-3 ${isReply ? 'ml-11 border-l-2 border-charcoal-800 pl-3' : 'border-b border-charcoal-900'}`}>
      <Avatar src={comment.authorPhotoURL} name={comment.authorName} className={isReply ? 'h-7 w-7 text-xs' : 'h-8 w-8 text-sm'} />
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <span className="font-semibold text-charcoal-100">{comment.authorName}</span>{' '}
          {isReply && comment.replyTo?.authorName && (
            <span className="text-xs text-gold-500">▸ {comment.replyTo.authorName} </span>
          )}
          <span className="text-xs text-charcoal-500">{timeAgo(comment.createdAt)}</span>
        </p>
        <p className="mt-0.5 whitespace-pre-wrap text-sm text-charcoal-200">{comment.text}</p>
        <button
          onClick={() => startReply(comment)}
          className="mt-1 text-xs font-medium text-charcoal-500 hover:text-gold-400"
        >
          Reply
        </button>
      </div>
      {comment.authorId === user.uid || post.authorUids?.includes(user.uid) ? (
        <button
          onClick={() => removeComment(comment.id)}
          className="self-start text-xs text-charcoal-500 hover:text-red-400"
        >
          Delete
        </button>
      ) : (
        <button
          onClick={() => setReportingComment(comment.id)}
          className="self-start text-xs text-charcoal-500 hover:text-charcoal-300"
        >
          Report
        </button>
      )}
    </div>
  )

  return (
    <div className="pb-32">
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
        {roots.length === 0 && (
          <p className="py-6 text-center text-sm text-charcoal-500">
            No comments yet — say something nice.
          </p>
        )}
        {roots.map((c) => (
          <div key={c.id}>
            <Comment comment={c} isReply={false} />
            {(replies.get(c.id) ?? []).map((r) => (
              <Comment key={r.id} comment={r} isReply />
            ))}
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
        <div className="mx-auto max-w-xl">
          {replyTo && (
            <div className="mb-2 flex items-center justify-between rounded-xl bg-charcoal-900 px-3 py-1.5 text-xs text-charcoal-300">
              <span>
                Replying to <span className="font-semibold text-gold-400">{replyTo.authorName}</span>
              </span>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="ml-3 text-charcoal-500 hover:text-charcoal-200"
                aria-label="Cancel reply"
              >
                ✕
              </button>
            </div>
          )}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={replyTo ? `Reply to ${replyTo.authorName}…` : 'Add a comment…'}
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
