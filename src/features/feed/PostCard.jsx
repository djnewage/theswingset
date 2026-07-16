import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import { deletePost, hasLiked, likePost, unlikePost } from './api'
import { useBlocks } from './useBlocks'
import { ReportDialog } from './ReportDialog'
import { Avatar } from '../../components/Avatar'
import { timeAgo } from '../../lib/time'

export function PostCard({ post, onShare }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { block } = useBlocks()
  const [reporting, setReporting] = useState(false)

  const isMine = post.authorUids?.includes(user.uid)

  // ---- like state (optimistic) ----
  const { data: liked = false } = useQuery({
    queryKey: ['liked', post.id, user.uid],
    queryFn: () => hasLiked(post.id, user.uid),
  })
  const [optimistic, setOptimistic] = useState(null) // {liked, delta} | null
  const showLiked = optimistic?.liked ?? liked
  const likeCount = (post.likeCount ?? 0) + (optimistic?.delta ?? 0)

  const toggleLike = useMutation({
    mutationFn: () =>
      showLiked ? unlikePost(post.id, user.uid) : likePost(post.id, user.uid),
    onMutate: () =>
      setOptimistic({ liked: !showLiked, delta: showLiked ? (optimistic?.delta ?? 0) - 1 : (optimistic?.delta ?? 0) + 1 }),
    onError: () => setOptimistic(null),
    onSuccess: () =>
      queryClient.setQueryData(['liked', post.id, user.uid], !liked),
  })

  const remove = async () => {
    if (!window.confirm('Delete this post?')) return
    await deletePost(post.id)
    queryClient.invalidateQueries({ queryKey: ['feed'] })
  }

  const doBlock = () => {
    if (!window.confirm(`Block ${post.authorName}? You won’t see their posts or comments.`)) return
    block(post.authorId)
  }

  return (
    <article className="border-b border-charcoal-800 px-4 py-4">
      <div className="flex items-center gap-3">
        <Link to={post.authorType === 'couple' ? `/c/${post.authorId}` : `/u/${post.authorId}`}>
          <Avatar src={post.authorPhotoURL} name={post.authorName} className="h-10 w-10 text-base" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-charcoal-50">
            {post.authorName}
            {post.authorType === 'couple' && (
              <span className="ml-1.5 rounded-full bg-charcoal-800 px-2 py-0.5 text-[10px] font-medium text-gold-400">
                couple
              </span>
            )}
          </p>
          <p className="text-xs text-charcoal-400">{timeAgo(post.createdAt)}</p>
        </div>

        <Menu as="div" className="relative">
          <MenuButton className="flex h-9 w-9 items-center justify-center rounded-full text-charcoal-400 hover:bg-charcoal-800 hover:text-charcoal-200">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
              <circle cx="5" cy="12" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="19" cy="12" r="1.8" />
            </svg>
          </MenuButton>
          <MenuItems className="absolute right-0 z-30 mt-1 w-44 rounded-xl bg-charcoal-800 p-1 shadow-xl ring-1 ring-charcoal-600 focus:outline-none">
            {isMine ? (
              <MenuItem>
                <button onClick={remove} className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-400 data-[focus]:bg-charcoal-700">
                  Delete post
                </button>
              </MenuItem>
            ) : (
              <>
                <MenuItem>
                  <button onClick={() => setReporting(true)} className="w-full rounded-lg px-3 py-2 text-left text-sm text-charcoal-100 data-[focus]:bg-charcoal-700">
                    Report post
                  </button>
                </MenuItem>
                <MenuItem>
                  <button onClick={doBlock} className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-400 data-[focus]:bg-charcoal-700">
                    Block {post.authorName}
                  </button>
                </MenuItem>
              </>
            )}
          </MenuItems>
        </Menu>
      </div>

      {post.sharedFrom && (
        <p className="mt-2 text-xs text-charcoal-400">
          ↻ Shared from <span className="font-medium text-charcoal-300">{post.sharedFrom.authorName}</span>
        </p>
      )}

      {post.text && (
        <Link to={`/post/${post.id}`} className="mt-2 block whitespace-pre-wrap text-[15px] leading-6 text-charcoal-100">
          {post.text}
        </Link>
      )}

      {post.imageURLs?.length > 0 && (
        <div className={`mt-3 grid gap-1.5 overflow-hidden rounded-2xl ${post.imageURLs.length > 1 ? 'grid-cols-2' : ''}`}>
          {post.imageURLs.map((url) => (
            <img key={url} src={url} alt="" loading="lazy" className="aspect-square w-full object-cover" />
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-6 text-sm text-charcoal-400">
        <button
          onClick={() => toggleLike.mutate()}
          className={`flex min-h-[44px] items-center gap-1.5 transition ${showLiked ? 'text-gold-400' : 'hover:text-charcoal-200'}`}
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill={showLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
            <path d="M12 21S3 15.5 3 9.5C3 6.5 5.5 4.5 8 4.5c1.7 0 3.2.9 4 2.2.8-1.3 2.3-2.2 4-2.2 2.5 0 5 2 5 5C21 15.5 12 21 12 21z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {likeCount > 0 && likeCount}
        </button>
        <Link to={`/post/${post.id}`} className="flex min-h-[44px] items-center gap-1.5 hover:text-charcoal-200">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M21 12a8 8 0 0 1-8 8H4l1.5-3A8 8 0 1 1 21 12z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {post.commentCount > 0 && post.commentCount}
        </Link>
        <button onClick={() => onShare?.(post)} className="flex min-h-[44px] items-center gap-1.5 hover:text-charcoal-200">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M17 3l4 4-4 4M21 7H9a5 5 0 0 0-5 5M7 21l-4-4 4-4M3 17h12a5 5 0 0 0 5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {post.shareCount > 0 && post.shareCount}
        </button>
      </div>

      <ReportDialog
        open={reporting}
        onClose={() => setReporting(false)}
        targetType="post"
        targetId={post.id}
      />
    </article>
  )
}
