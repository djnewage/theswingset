import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '../../components/Logo'

/** Shared shell for the public legal pages (viewable without an account). */
export function LegalLayout({ title, updated, children }) {
  const navigate = useNavigate()
  return (
    <div className="min-h-dvh bg-charcoal-950 pb-16">
      <header className="sticky top-0 z-30 border-b border-charcoal-800 bg-charcoal-950/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <button
            onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/login'))}
            className="flex h-9 w-9 items-center justify-center rounded-full text-charcoal-300 hover:bg-charcoal-800"
            aria-label="Back"
          >
            ←
          </button>
          <Logo className="h-7" />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pt-8">
        <h1 className="text-2xl font-bold text-charcoal-50">{title}</h1>
        <p className="mt-1 text-xs text-charcoal-500">Last updated: {updated}</p>
        <div className="mt-6 flex flex-col gap-6">{children}</div>

        <nav className="mt-10 border-t border-charcoal-800 pt-5 text-sm">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-charcoal-500">
            All policies
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            <Link to="/legal/terms" className="text-gold-400 hover:text-gold-300">Terms of Service</Link>
            <Link to="/legal/privacy" className="text-gold-400 hover:text-gold-300">Privacy Policy</Link>
            <Link to="/legal/guidelines" className="text-gold-400 hover:text-gold-300">Community Guidelines</Link>
          </div>
        </nav>
      </main>
    </div>
  )
}

export function Section({ heading, children }) {
  return (
    <section>
      <h2 className="mb-2 text-base font-semibold text-charcoal-50">{heading}</h2>
      <div className="flex flex-col gap-2.5 text-sm leading-6 text-charcoal-300">{children}</div>
    </section>
  )
}
