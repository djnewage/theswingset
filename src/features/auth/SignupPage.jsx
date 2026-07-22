import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth'
import { auth, googleProvider } from '../../lib/firebase'
import { isAdult, MIN_AGE } from '../../lib/age'
import { createUserProfile } from './createUserProfile'
import { consumeInvite, validateInvite } from './invites'
import { AgreeToTerms, AuthLayout, Field, GoogleButton, SubmitButton } from './AuthLayout'

const FRIENDLY_ERRORS = {
  'auth/email-already-in-use': 'An account with that email already exists.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/invalid-email': 'That email address doesn’t look right.',
}

export function SignupPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    displayName: '',
    email: '',
    password: '',
    dob: '',
    inviteCode: '',
  })
  const [error, setError] = useState('')
  const [dobError, setDobError] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [busy, setBusy] = useState(false)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setDobError('')
    setInviteError('')
    if (!isAdult(form.dob)) {
      setDobError(`You must be at least ${MIN_AGE} to join.`)
      return
    }
    // Validate the invite before creating any account.
    const invite = await validateInvite(form.inviteCode)
    if (!invite.ok) {
      setInviteError(invite.reason)
      return
    }
    setBusy(true)
    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password,
      )
      await updateProfile(cred.user, { displayName: form.displayName })
      await createUserProfile(cred.user.uid, {
        displayName: form.displayName,
        dob: form.dob,
        inviteCode: invite.code,
        agreedToTerms: agreed,
      })
      await consumeInvite(invite.code)
      // Best-effort: the in-app gate offers resend if this doesn't arrive.
      await sendEmailVerification(cred.user).catch(() => {})
      navigate('/', { replace: true })
    } catch (err) {
      console.error('signup failed', err)
      if (err?.code === 'permission-denied') {
        // Auth account exists but the profile write was rejected — the
        // welcome screen lets them retry without re-registering.
        navigate('/welcome', { replace: true })
        return
      }
      setError(FRIENDLY_ERRORS[err.code] ?? `Signup failed (${err?.code ?? 'unknown'}). Please try again.`)
    } finally {
      setBusy(false)
    }
  }

  // Google signups still need DOB — RequireProfile routes them to /welcome.
  const google = async () => {
    setError('')
    setBusy(true)
    try {
      await signInWithPopup(auth, googleProvider)
      navigate('/', { replace: true })
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Google sign-in failed. Please try again.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout title="Create your account">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field
          label="Display name"
          type="text"
          value={form.displayName}
          onChange={set('displayName')}
          placeholder="How you'll appear to members"
          maxLength={40}
          required
        />
        <Field
          label="Email"
          type="email"
          value={form.email}
          onChange={set('email')}
          autoComplete="email"
          required
        />
        <Field
          label="Password"
          type="password"
          value={form.password}
          onChange={set('password')}
          autoComplete="new-password"
          minLength={6}
          required
        />
        <Field
          label="Date of birth"
          type="date"
          value={form.dob}
          onChange={set('dob')}
          error={dobError}
          required
        />
        <Field
          label="Invite code"
          type="text"
          value={form.inviteCode}
          onChange={set('inviteCode')}
          placeholder="The Swingset is invite-only"
          autoCapitalize="characters"
          error={inviteError}
          required
        />
        <AgreeToTerms checked={agreed} onChange={setAgreed} />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <SubmitButton busy={busy}>Join</SubmitButton>
      </form>
      <div className="my-4 flex items-center gap-3 text-xs text-charcoal-400">
        <span className="h-px flex-1 bg-charcoal-700" /> or{' '}
        <span className="h-px flex-1 bg-charcoal-700" />
      </div>
      <GoogleButton onClick={google} busy={busy} />
      <p className="mt-5 text-center text-sm text-charcoal-300">
        Already a member?{' '}
        <Link to="/login" className="font-medium text-gold-400 hover:text-gold-300">
          Sign in
        </Link>
      </p>
    </AuthLayout>
  )
}
