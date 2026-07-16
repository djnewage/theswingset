import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { deleteUser } from 'firebase/auth'
import { deleteDoc, doc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../auth/AuthContext'
import { fetchCouple } from './api'
import { Avatar } from '../../components/Avatar'
import { VISIBILITY_OPTIONS } from './constants'
import { AlbumsSection } from '../albums/AlbumsSection'
import { usePostableAuthors } from '../feed/useAuthor'
import { isAdminUser } from '../verification/api'

export function ProfilePage() {
  const { user, profile, signOut } = useAuth()
  const authors = usePostableAuthors()
  const [deleteError, setDeleteError] = useState('')

  const deleteAccount = async () => {
    if (profile.coupleId) {
      setDeleteError('Unlink from your couple profile first, then delete your account.')
      return
    }
    if (!window.confirm('Permanently delete your account? Your profile, photos, and notifications are wiped. This cannot be undone.')) return
    try {
      // Deleting the profile doc triggers the Cloud Function that wipes
      // Storage files and notifications; then remove the auth account.
      await deleteDoc(doc(db, 'users', user.uid))
      await deleteUser(user)
    } catch (err) {
      setDeleteError(
        err.code === 'auth/requires-recent-login'
          ? 'For security, sign out and sign back in, then delete your account.'
          : 'Couldn’t delete your account. Please try again.',
      )
    }
  }

  const { data: couple } = useQuery({
    queryKey: ['couple', profile.coupleId],
    queryFn: () => fetchCouple(profile.coupleId),
    enabled: !!profile.coupleId,
  })
  const { data: isAdmin } = useQuery({
    queryKey: ['isAdmin', user.uid],
    queryFn: () => isAdminUser(user.uid),
  })

  const visibility = VISIBILITY_OPTIONS.find((o) => o.value === profile.visibility)

  return (
    <div className="px-4 pt-8 pb-8">
      <div className="rounded-2xl bg-charcoal-900 p-6 ring-1 ring-charcoal-800">
        <div className="flex items-center gap-4">
          <Avatar src={profile.photoURL} name={profile.displayName} className="h-16 w-16 text-2xl" />
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-charcoal-50">
              {profile.displayName}
              {profile.verified && (
                <span className="ml-1.5 text-gold-400" title="Photo verified">✓</span>
              )}
            </h1>
            <p className="truncate text-sm text-charcoal-400">{user?.email}</p>
            {profile.location && (
              <p className="text-sm text-charcoal-400">📍 {profile.location}</p>
            )}
          </div>
        </div>

        {profile.bio && (
          <p className="mt-4 whitespace-pre-wrap text-sm text-charcoal-200">{profile.bio}</p>
        )}

        {profile.interests?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {profile.interests.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-charcoal-800 px-2.5 py-1 text-xs font-medium text-gold-400"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <p className="mt-4 text-xs text-charcoal-500">
          Visibility: <span className="text-charcoal-300">{visibility?.label ?? 'Members'}</span>
          {' — '}
          {visibility?.description}
        </p>

        <Link
          to="/profile/edit"
          className="mt-5 flex h-11 items-center justify-center rounded-2xl bg-gold-500 font-semibold text-charcoal-950 transition hover:bg-gold-400"
        >
          Edit profile
        </Link>
      </div>

      <Link
        to="/couple"
        className="mt-4 block rounded-2xl bg-charcoal-900 p-5 ring-1 ring-charcoal-800 transition hover:ring-charcoal-600"
      >
        {couple ? (
          <>
            <p className="text-sm font-medium text-gold-400">
              {couple.partnerUids.length === 2 ? 'Couple profile' : 'Couple — waiting for partner'}
            </p>
            <p className="mt-0.5 text-base font-semibold text-charcoal-50">{couple.coupleName}</p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-gold-400">Here as a couple?</p>
            <p className="mt-0.5 text-sm text-charcoal-300">
              Link with your partner to share one couple profile →
            </p>
          </>
        )}
      </Link>

      {!profile.verified && (
        <Link
          to="/verify"
          className="mt-4 block rounded-2xl bg-charcoal-900 p-5 ring-1 ring-gold-700/40 transition hover:ring-gold-600"
        >
          <p className="text-sm font-medium text-gold-400">✓ Get verified</p>
          <p className="mt-0.5 text-sm text-charcoal-300">
            A verified badge builds trust — quick selfie review, photo never shown →
          </p>
        </Link>
      )}

      <Link
        to="/connections"
        className="mt-4 block rounded-2xl bg-charcoal-900 p-5 ring-1 ring-charcoal-800 transition hover:ring-charcoal-600"
      >
        <p className="text-sm font-medium text-gold-400">Connections</p>
        <p className="mt-0.5 text-sm text-charcoal-300">Requests, your circle, and blocking →</p>
      </Link>

      <Link
        to="/reactions"
        className="mt-4 block rounded-2xl bg-charcoal-900 p-5 ring-1 ring-charcoal-800 transition hover:ring-charcoal-600"
      >
        <p className="text-sm font-medium text-gold-400">Icebreakers</p>
        <p className="mt-0.5 text-sm text-charcoal-300">Reactions to your profile prompts →</p>
      </Link>

      <Link
        to="/settings/discretion"
        className="mt-4 block rounded-2xl bg-charcoal-900 p-5 ring-1 ring-charcoal-800 transition hover:ring-charcoal-600"
      >
        <p className="text-sm font-medium text-gold-400">Discretion</p>
        <p className="mt-0.5 text-sm text-charcoal-300">Quick-hide, PIN lock, private notifications →</p>
      </Link>

      {isAdmin && (
        <Link
          to="/admin"
          className="mt-4 block rounded-2xl bg-charcoal-900 p-5 ring-1 ring-red-900/60 transition hover:ring-red-800"
        >
          <p className="text-sm font-medium text-red-400">Admin console</p>
          <p className="mt-0.5 text-sm text-charcoal-300">Members, reports, verifications →</p>
        </Link>
      )}

      {authors.map((identity) => (
        <AlbumsSection key={identity.id} ownerId={identity.id} owner={identity} />
      ))}

      <button
        onClick={signOut}
        className="mt-6 h-11 w-full rounded-2xl bg-charcoal-800 font-medium text-charcoal-200 ring-1 ring-charcoal-600 transition hover:bg-charcoal-700"
      >
        Sign out
      </button>

      {deleteError && <p className="mt-3 text-sm text-red-400">{deleteError}</p>}
      <button
        onClick={deleteAccount}
        className="mt-3 w-full text-center text-xs text-charcoal-500 underline-offset-2 hover:text-red-400 hover:underline"
      >
        Delete my account and all data
      </button>
    </div>
  )
}
