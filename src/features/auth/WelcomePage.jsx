import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from './AuthContext'
import { isAdult, MIN_AGE } from '../../lib/age'
import { createUserProfile } from './createUserProfile'
import { AuthLayout, Field, SubmitButton } from './AuthLayout'

/**
 * Completes signup for accounts that authenticated without giving us a DOB
 * (first-time Google sign-ins). No profile doc is created — and therefore no
 * access is granted — until an 18+ DOB is provided.
 */
export function WelcomePage() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [dob, setDob] = useState('')
  const [dobError, setDobError] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Already onboarded (e.g. landed here from a redirect race): straight in.
  useEffect(() => {
    if (profile) navigate('/', { replace: true })
  }, [profile, navigate])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setDobError('')
    if (!isAdult(dob)) {
      setDobError(`You must be at least ${MIN_AGE} to join.`)
      return
    }
    setBusy(true)
    try {
      // If a previous attempt already created the profile, don't try to
      // overwrite it (rules forbid that) — just continue into the app.
      const existing = await getDoc(doc(db, 'users', user.uid))
      if (!existing.exists()) {
        await createUserProfile(user.uid, { displayName, dob })
      }
      navigate('/', { replace: true })
    } catch (err) {
      console.error('welcome: profile creation failed', err)
      setError(
        err?.code === 'permission-denied'
          ? 'Your details were rejected by our safety checks. Double-check your date of birth and try again.'
          : `Something went wrong (${err?.code ?? 'unknown'}). Please try again.`,
      )
      setBusy(false)
    }
  }

  return (
    <AuthLayout title="One last step">
      <p className="mb-4 text-sm text-charcoal-300">
        Confirm your date of birth to finish creating your account. This is a
        community for adults 18+.
      </p>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field
          label="Display name"
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={40}
          required
        />
        <Field
          label="Date of birth"
          type="date"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          error={dobError}
          required
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <SubmitButton busy={busy}>Finish</SubmitButton>
      </form>
      <button
        onClick={signOut}
        className="mt-4 w-full text-center text-sm text-charcoal-400 hover:text-charcoal-200"
      >
        Cancel and sign out
      </button>
    </AuthLayout>
  )
}
