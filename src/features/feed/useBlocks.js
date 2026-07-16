import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import { blockAuthor, fetchMyBlocks, unblock } from './api'

export function useBlocks() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: blockedIds = [] } = useQuery({
    queryKey: ['blocks', user.uid],
    queryFn: () => fetchMyBlocks(user.uid),
  })

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['blocks', user.uid] })

  const block = useMutation({
    mutationFn: (blockedId) => blockAuthor(user.uid, blockedId),
    onSuccess: invalidate,
  })
  const remove = useMutation({
    mutationFn: (blockedId) => unblock(user.uid, blockedId),
    onSuccess: invalidate,
  })

  return {
    blockedIds,
    isBlocked: (id) => blockedIds.includes(id),
    block: block.mutate,
    unblock: remove.mutate,
  }
}
