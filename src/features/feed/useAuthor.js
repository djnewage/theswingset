import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import { fetchCouple } from '../profiles/api'

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
