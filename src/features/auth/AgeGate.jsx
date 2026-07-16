import { useState } from 'react'
import { Logo } from '../../components/Logo'

const STORAGE_KEY = 'ageGateAccepted'

/**
 * 18+ interstitial shown before ANY content loads for visitors who haven't
 * confirmed. Acceptance is remembered per-browser in localStorage.
 */
export function AgeGate({ children }) {
  const [accepted, setAccepted] = useState(
    () => localStorage.getItem(STORAGE_KEY) === 'true',
  )

  if (accepted) return children

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setAccepted(true)
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-charcoal-950 px-6 text-center">
      <Logo className="mb-8" />
      <div className="w-full max-w-sm rounded-2xl bg-charcoal-900 p-6 shadow-xl ring-1 ring-charcoal-700">
        <h1 className="text-xl font-semibold text-gold-400">Adults only</h1>
        <p className="mt-3 text-sm leading-6 text-charcoal-200">
          This is a private community for adults. You must be 18 years of age
          or older to enter. By continuing, you confirm that you are at least
          18 and agree to view content intended for adults.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={accept}
            className="h-11 rounded-2xl bg-gold-500 font-semibold text-charcoal-950 transition hover:bg-gold-400"
          >
            I&apos;m 18 or older — enter
          </button>
          <a
            href="https://www.google.com"
            className="flex h-11 items-center justify-center rounded-2xl bg-charcoal-800 font-medium text-charcoal-200 transition hover:bg-charcoal-700"
          >
            Leave
          </a>
        </div>
      </div>
    </div>
  )
}
