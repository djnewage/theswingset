import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import {
  fetchPendingVerifications,
  isAdminUser,
  reviewVerification,
  verificationImageURL,
} from './api'
import { timeAgo } from '../../lib/time'

/** The queue itself — embeddable in the admin console. Caller gates access. */
export function VerificationQueue() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const { data: pending = [], isPending } = useQuery({
    queryKey: ['pendingVerifications'],
    queryFn: fetchPendingVerifications,
  })

  const review = useMutation({
    mutationFn: ({ verification, approve }) =>
      reviewVerification(verification, user.uid, approve),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['pendingVerifications'] }),
  })

  return (
    <div>
      <p className="mb-4 text-sm text-charcoal-400">
        Approve only when the face matches profile photos and the handwritten
        code matches the one shown below the image.
      </p>

      {!isPending && pending.length === 0 && (
        <p className="py-10 text-center text-sm text-charcoal-400">Queue is empty. 🎉</p>
      )}

      <div className="flex flex-col gap-4">
        {pending.map((v) => (
          <VerificationCard
            key={v.id}
            verification={v}
            onReview={(approve) => review.mutate({ verification: v, approve })}
            busy={review.isPending}
          />
        ))}
      </div>
    </div>
  )
}

/** Standalone page kept for the /admin/verifications route. */
export function AdminVerificationsPage() {
  const { user } = useAuth()
  const { data: isAdmin, isPending: checkingAdmin } = useQuery({
    queryKey: ['isAdmin', user.uid],
    queryFn: () => isAdminUser(user.uid),
  })

  if (checkingAdmin) {
    return <p className="px-4 pt-16 text-center text-sm text-charcoal-400">Loading…</p>
  }
  if (!isAdmin) {
    return (
      <p className="px-4 pt-16 text-center text-sm text-charcoal-400">
        This page is for moderators.
      </p>
    )
  }

  return (
    <div className="px-4 pt-6 pb-10">
      <h1 className="mb-4 text-xl font-semibold text-charcoal-50">Verification queue</h1>
      <VerificationQueue />
    </div>
  )
}

function VerificationCard({ verification, onReview, busy }) {
  const { data: imageURL } = useQuery({
    queryKey: ['verificationImage', verification.id],
    queryFn: () => verificationImageURL(verification.imagePath),
  })

  return (
    <div className="overflow-hidden rounded-2xl bg-charcoal-900 ring-1 ring-charcoal-800">
      {imageURL ? (
        <img src={imageURL} alt="Verification selfie" className="max-h-96 w-full object-contain bg-charcoal-950" />
      ) : (
        <div className="flex h-48 items-center justify-center text-sm text-charcoal-500">
          Loading image…
        </div>
      )}
      <div className="p-4">
        <p className="text-sm font-semibold text-charcoal-50">
          {verification.subjectName}
          <span className="ml-2 text-xs font-normal text-charcoal-400">
            {verification.subjectType} · {timeAgo(verification.createdAt)}
          </span>
        </p>
        <p className="mt-1 text-sm text-charcoal-300">
          Expected code:{' '}
          <code className="rounded bg-charcoal-950 px-2 py-0.5 font-bold tracking-widest text-gold-400">
            {verification.code}
          </code>
        </p>
        <div className="mt-3 flex gap-3">
          <button
            onClick={() => onReview(true)}
            disabled={busy}
            className="h-10 flex-1 rounded-xl bg-gold-500 text-sm font-semibold text-charcoal-950 hover:bg-gold-400 disabled:opacity-50"
          >
            Approve ✓
          </button>
          <button
            onClick={() => onReview(false)}
            disabled={busy}
            className="h-10 flex-1 rounded-xl bg-charcoal-800 text-sm font-medium text-red-400 ring-1 ring-charcoal-600 hover:bg-charcoal-700 disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      </div>
    </div>
  )
}
