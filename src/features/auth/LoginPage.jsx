import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '../../lib/firebase'
import { AuthLayout, Field, GoogleButton, SubmitButton } from './AuthLayout'

const FRIENDLY_ERRORS = {
  'auth/invalid-credential': 'Wrong email or password.',
  'auth/user-not-found': 'Wrong email or password.',
  'auth/wrong-password': 'Wrong email or password.',
  'auth/too-many-requests': 'Too many attempts — try again in a few minutes.',
}

export function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const finish = () => navigate('/', { replace: true })

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      finish()
    } catch (err) {
      setError(FRIENDLY_ERRORS[err.code] ?? 'Sign-in failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const google = async () => {
    setError('')
    setBusy(true)
    try {
      await signInWithPopup(auth, googleProvider)
      finish() // first-time Google users are routed to /welcome by RequireProfile
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Google sign-in failed. Please try again.')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout title="Welcome back">
      <form onSubmit={submit} className="flex flex-col gap-4">
        <Field
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <Field
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <SubmitButton busy={busy}>Sign in</SubmitButton>
      </form>
      <div className="my-4 flex items-center gap-3 text-xs text-charcoal-400">
        <span className="h-px flex-1 bg-charcoal-700" /> or{' '}
        <span className="h-px flex-1 bg-charcoal-700" />
      </div>
      <GoogleButton onClick={google} busy={busy} />
      <p className="mt-5 text-center text-sm text-charcoal-300">
        New here?{' '}
        <Link to="/signup" className="font-medium text-gold-400 hover:text-gold-300">
          Create an account
        </Link>
      </p>
    </AuthLayout>
  )
}
