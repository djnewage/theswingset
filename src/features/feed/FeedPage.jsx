import { useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchFeedPage } from './api'
import { useBlocks } from './useBlocks'
import { PostCard } from './PostCard'
import { Logo } from '../../components/Logo'
import { NotificationsBell } from '../notifications/NotificationsBell'

export function FeedPage() {
  const navigate = useNavigate()
  const { blockedIds } = useBlocks()
  const sentinel = useRef(null)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending, isError } =
    useInfiniteQuery({
      queryKey: ['feed'],
      queryFn: ({ pageParam }) => fetchFeedPage(pageParam),
      initialPageParam: null,
      getNextPageParam: (lastPage) => lastPage.cursor,
    })

  // Infinite scroll: load more when the sentinel enters the viewport.
  useEffect(() => {
    const el = sentinel.current
    if (!el) return undefined
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { rootMargin: '600px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const posts = (data?.pages.flatMap((p) => p.posts) ?? []).filter(
    (post) => !blockedIds.includes(post.authorId),
  )

  return (
    <div>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-charcoal-800 bg-charcoal-950/90 px-4 py-2.5 backdrop-blur md:hidden">
        <Logo />
        <NotificationsBell />
      </header>
      <div className="hidden justify-end px-4 pt-3 md:flex">
        <NotificationsBell />
      </div>

      {isPending && <FeedSkeleton />}

      {isError && (
        <p className="px-6 pt-16 text-center text-sm text-charcoal-400">
          Couldn’t load the feed. Check your connection and try again.
        </p>
      )}

      {!isPending && !isError && posts.length === 0 && (
        <div className="flex flex-col items-center px-6 pt-20 text-center">
          <img src="/pineapple.svg" alt="" className="h-14 w-14 opacity-60" />
          <h2 className="mt-4 text-lg font-semibold text-charcoal-50">It’s quiet here…</h2>
          <p className="mt-2 max-w-xs text-sm text-charcoal-400">
            Be the first to break the ice — share something with the community.
          </p>
          <Link
            to="/compose"
            className="mt-5 flex h-11 items-center rounded-2xl bg-gold-500 px-6 font-semibold text-charcoal-950 hover:bg-gold-400"
          >
            Write a post
          </Link>
        </div>
      )}

      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onShare={(p) => navigate('/compose', { state: { shareOf: p } })}
        />
      ))}

      <div ref={sentinel} />
      {isFetchingNextPage && (
        <p className="py-6 text-center text-sm text-charcoal-500">Loading more…</p>
      )}
    </div>
  )
}

function FeedSkeleton() {
  return (
    <div className="animate-pulse">
      {[0, 1, 2].map((i) => (
        <div key={i} className="border-b border-charcoal-800 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-charcoal-800" />
            <div className="flex-1">
              <div className="h-3 w-32 rounded bg-charcoal-800" />
              <div className="mt-2 h-2.5 w-16 rounded bg-charcoal-800" />
            </div>
          </div>
          <div className="mt-4 h-3 w-full rounded bg-charcoal-800" />
          <div className="mt-2 h-3 w-2/3 rounded bg-charcoal-800" />
        </div>
      ))}
    </div>
  )
}
