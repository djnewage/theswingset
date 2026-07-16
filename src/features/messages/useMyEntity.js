import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import { fetchCouple } from '../profiles/api'

/**
 * The identity I message (and connect) as: my couple when fully linked,
 * else myself — matching the rules' myEntity(). Returns { entity, verified,
 * ready }; entity is null until profile/couple data resolves.
 */
export function useMyEntity() {
  const { user, profile } = useAuth()

  const { data: couple, isPending: coupleLoading } = useQuery({
    queryKey: ['couple', profile?.coupleId],
    queryFn: () => fetchCouple(profile.coupleId),
    enabled: !!profile?.coupleId,
  })

  if (profile?.coupleId) {
    if (coupleLoading || !couple || couple.partnerUids.length < 2) {
      // Couple still loading or not fully linked — fall back to self once loaded.
      if (coupleLoading) return { entity: null, verified: false, ready: false }
    }
    if (couple && couple.partnerUids.length === 2) {
      return {
        entity: {
          type: 'couple',
          id: couple.id,
          uids: couple.partnerUids,
          name: couple.coupleName,
          photoURL: couple.coverPhotoURL ?? null,
        },
        verified: couple.verified === true,
        ready: true,
      }
    }
  }

  return {
    entity: {
      type: 'user',
      id: user.uid,
      uids: [user.uid],
      name: profile?.displayName ?? '',
      photoURL: profile?.photoURL ?? null,
    },
    verified: profile?.verified === true,
    ready: !!profile,
  }
}
