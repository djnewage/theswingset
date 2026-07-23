import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import { fetchCouple, fetchUser } from '../profiles/api'
import { memberName } from '../../lib/names'

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
 * Resolves an author's CURRENT avatar and name rather than trusting the
 * values denormalized onto the post at write time (null/stale after profile
 * edits). Cached per author, so a feed full of one author's posts costs a
 * single read. Falls back to the denormalized values if the live read is
 * unavailable (e.g. a profile hidden from the viewer).
 */
export function useAuthorInfo({ authorType, authorId, authorPhotoURL, authorName }) {
  const { data } = useQuery({
    queryKey: ['authorInfo', authorType, authorId],
    enabled: !!authorId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      try {
        if (authorType === 'couple') {
          const couple = await fetchCouple(authorId)
          return couple
            ? { photoURL: couple.coverPhotoURL ?? null, name: couple.coupleName ?? null }
            : null
        }
        const member = await fetchUser(authorId)
        return member
          ? { photoURL: member.photoURL ?? null, name: memberName(member) || null }
          : null
      } catch {
        return null // hidden/denied — fall back below
      }
    },
  })
  return {
    photoURL: data?.photoURL ?? authorPhotoURL ?? null,
    name: data?.name ?? authorName ?? '',
  }
}

/** Live display name for a single member (comments, attendee rows, …). */
export function useMemberName(uid, fallback) {
  const { data } = useQuery({
    queryKey: ['authorInfo', 'user', uid],
    enabled: !!uid,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      try {
        const member = await fetchUser(uid)
        return member
          ? { photoURL: member.photoURL ?? null, name: memberName(member) || null }
          : null
      } catch {
        return null
      }
    },
  })
  return data?.name ?? fallback ?? ''
}
