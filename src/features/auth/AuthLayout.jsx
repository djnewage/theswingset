import { Link } from 'react-router-dom'
import { Logo } from '../../components/Logo'

export function AuthLayout({ title, children }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-charcoal-950 px-6 py-10">
      <Logo className="mb-8" />
      <div className="w-full max-w-sm rounded-2xl bg-charcoal-900 p-6 shadow-xl ring-1 ring-charcoal-700">
        <h1 className="mb-5 text-lg font-semibold text-charcoal-50">{title}</h1>
        {children}
      </div>
      <p className="mt-6 max-w-sm text-center text-xs text-charcoal-400">
        A private, members-only community for adults 18+. Your profile is never
        publicly visible or indexed.
      </p>
      <p className="mt-3 flex gap-4 text-xs text-charcoal-500">
        <Link to="/legal/terms" className="hover:text-charcoal-300">Terms</Link>
        <Link to="/legal/privacy" className="hover:text-charcoal-300">Privacy</Link>
        <Link to="/legal/guidelines" className="hover:text-charcoal-300">Guidelines</Link>
      </p>
    </div>
  )
}

/** Required agreement checkbox used by both signup paths. */
export function AgreeToTerms({ checked, onChange }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-xs leading-5 text-charcoal-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        required
        className="mt-0.5 h-4 w-4 shrink-0 accent-[#f5b700]"
      />
      <span>
        I'm 18 or older and I agree to the{' '}
        <Link to="/legal/terms" target="_blank" className="text-gold-400 hover:text-gold-300">Terms of Service</Link>,{' '}
        <Link to="/legal/privacy" target="_blank" className="text-gold-400 hover:text-gold-300">Privacy Policy</Link>, and{' '}
        <Link to="/legal/guidelines" target="_blank" className="text-gold-400 hover:text-gold-300">Community Guidelines</Link>
        {' '}— including its consent and discretion rules.
      </span>
    </label>
  )
}

export function Field({ label, error, ...inputProps }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-charcoal-200">
        {label}
      </span>
      <input
        {...inputProps}
        className="h-11 w-full rounded-2xl border border-charcoal-600 bg-charcoal-800 px-4 text-sm text-charcoal-50 placeholder-charcoal-400 outline-none transition focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
      />
      {error && <span className="mt-1 block text-xs text-red-400">{error}</span>}
    </label>
  )
}

export function SubmitButton({ children, busy }) {
  return (
    <button
      type="submit"
      disabled={busy}
      className="h-11 w-full rounded-2xl bg-gold-500 font-semibold text-charcoal-950 transition hover:bg-gold-400 disabled:opacity-50"
    >
      {busy ? 'One moment…' : children}
    </button>
  )
}

export function GoogleButton({ onClick, busy }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-charcoal-800 font-medium text-charcoal-100 ring-1 ring-charcoal-600 transition hover:bg-charcoal-700 disabled:opacity-50"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M23.5 12.3c0-.9-.1-1.5-.3-2.2H12v4.1h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.6 2.8c2.2-2 3.8-5 3.8-8.5z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.6-2.8c-1 .7-2.4 1.2-4.3 1.2-3.3 0-6.1-2.2-7.1-5.2l-3.7 2.9C3.2 21.1 7.3 24 12 24z"
        />
        <path
          fill="#FBBC05"
          d="M4.9 14.3c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.2 6.8C.4 8.4 0 10.1 0 12s.4 3.6 1.2 5.2l3.7-2.9z"
        />
        <path
          fill="#EA4335"
          d="M12 4.7c1.9 0 3.1.8 3.8 1.4l3.2-3.1C17.9 1.1 15.2 0 12 0 7.3 0 3.2 2.9 1.2 6.8l3.7 2.9c1-3 3.8-5 7.1-5z"
        />
      </svg>
      Continue with Google
    </button>
  )
}
