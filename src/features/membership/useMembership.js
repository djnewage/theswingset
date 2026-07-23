import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import { fetchCouple } from '../profiles/api'
import { fetchActiveSubscription, fetchBillingConfig, resolveMembership } from './api'

/** Resolves the viewer's membership: config + own sub + partner's sub. */
export function useMembership() {
  const { user, profile } = useAuth()

  const { data: config, isPending: configPending } = useQuery({
    queryKey: ['billingConfig'],
    queryFn: fetchBillingConfig,
    staleTime: 5 * 60_000,
  })
  const charging = !!config?.chargingEnabled

  const { data: subscription } = useQuery({
    queryKey: ['subscription', user.uid],
    queryFn: () => fetchActiveSubscription(user.uid),
    enabled: charging,
  })

  const { data: couple } = useQuery({
    queryKey: ['couple', profile?.coupleId],
    queryFn: () => fetchCouple(profile.coupleId),
    enabled: charging && !!profile?.coupleId,
  })
  const partnerUid = couple?.partnerUids?.find((p) => p !== user.uid)
  const { data: partnerSubscription } = useQuery({
    queryKey: ['subscription', partnerUid],
    queryFn: () => fetchActiveSubscription(partnerUid),
    enabled: charging && !!partnerUid,
  })

  return {
    loading: configPending,
    config: config ?? { chargingEnabled: false },
    membership: resolveMembership({
      config,
      profile,
      subscription,
      partnerSubscription,
    }),
  }
}
