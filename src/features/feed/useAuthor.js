import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import { fetchCouple, fetchUser } from '../profiles/api'

/**
 * Returns the identities the current user can post/comment as:
 * always themself, plus their couple when fully linked.
 */
export function usePostableAuthors() {
  const { user, profile } = useAuth()

  const { data: couple } = useQuery({
    queryKey: ['couple', profile?.coupleId],
    queryFn: () => fetchCouple(profile.coupleId),
    enabled: !!profile?.coupleId,
  })

  const authors = [
    {
      type: 'user',
      id: user.uid,
      uids: [user.uid],
      name: profile.displayName,
      photoURL: profile.photoURL ?? null,
    },
  ]
  if (couple && couple.partnerUids.length === 2) {
    authors.push({
      type: 'couple',
      id: couple.id,
      uids: couple.partnerUids,
      name: couple.coupleName,
      photoURL: couple.coverPhotoURL ?? null,
    })
  }
  return authors
}

/**
 * Resolves an author's CURRENT avatar rather than trusting the value
 * denormalized onto the post at write time (which is null for older posts and
 * stale after someone changes their photo). Cached per author, so a feed full
 * of one author's posts costs a single read. Falls back to the denormalized
 * value if the live read is unavailable (e.g. a profile hidden from the viewer).
 */
export function useAuthorPhoto({ authorType, authorId, authorPhotoURL }) {
  const { data } = useQuery({
    queryKey: ['authorPhoto', authorType, authorId],
    enabled: !!authorId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      try {
        if (authorType === 'couple') {
          return (await fetchCouple(authorId))?.coverPhotoURL ?? null
        }
        return (await fetchUser(authorId))?.photoURL ?? null
      } catch {
        return null // hidden/denied — fall back below
      }
    },
  })
  return data ?? authorPhotoURL ?? null
}
