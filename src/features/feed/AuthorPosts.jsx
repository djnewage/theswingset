import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { fetchAuthorPosts } from './api'
import { useBlocks } from './useBlocks'
import { timeAgo } from '../../lib/time'

/**
 * Compact post history for a profile page — members-visible posts only, newest
 * first, each linking to the full post. Renders nothing until there's a post.
 */
export function AuthorPosts({ authorId, heading = 'Recent posts' }) {
  const { blockedIds } = useBlocks()
  const { data: posts = [], isPending } = useQuery({
    queryKey: ['authorPosts', authorId],
    queryFn: () => fetchAuthorPosts(authorId),
  })

  const visible = posts.filter((p) => !blockedIds.includes(p.authorId))
  if (isPending || visible.length === 0) return null

  return (
    <section className="mt-6">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-charcoal-400">
        {heading}
      </h2>
      <div className="flex flex-col divide-y divide-charcoal-900 rounded-2xl bg-charcoal-900/50 ring-1 ring-charcoal-800">
        {visible.map((p) => (
          <Link
            key={p.id}
            to={`/post/${p.id}`}
            className="flex items-center gap-3 p-3 transition hover:bg-charcoal-900"
          >
            {p.imageURLs?.length > 0 && (
              <img
                src={p.imageURLs[0]}
                alt=""
                loading="lazy"
                className="h-14 w-14 shrink-0 rounded-xl object-cover"
              />
            )}
            <div className="min-w-0 flex-1">
              {p.text ? (
                <p className="line-clamp-2 text-sm text-charcoal-100">{p.text}</p>
              ) : (
                <p className="text-sm italic text-charcoal-500">Photo post</p>
              )}
              <p className="mt-1 text-xs text-charcoal-500">
                {timeAgo(p.createdAt)}
                {(p.likeCount ?? 0) > 0 && ` · 💛 ${p.likeCount}`}
                {(p.commentCount ?? 0) > 0 && ` · 💬 ${p.commentCount}`}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
