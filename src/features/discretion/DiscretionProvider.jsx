import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { DecoyScreen } from './DecoyScreen'
import { PinPad } from './PinPad'
import { loadDiscretion, saveDiscretion } from './store'

const DiscretionContext = createContext(null)

/**
 * Wraps the entire app. Provides:
 * - quick-hide (subtle button + Ctrl/Cmd+Shift+H) → decoy notes screen
 * - optional PIN lock on open / when the tab is backgrounded
 * - device-level settings (incl. discreet notification text)
 */
export function DiscretionProvider({ children }) {
  const [settings, setSettings] = useState(loadDiscretion)
  const [hidden, setHidden] = useState(false)
  const [locked, setLocked] = useState(() => {
    const s = loadDiscretion()
    return !!(s.lockOnOpen && s.pinHash)
  })

  const update = useCallback((patch) => {
    setSettings((cur) => {
      const next = { ...cur, ...patch }
      saveDiscretion(next)
      return next
    })
  }, [])

  const hide = useCallback(() => setHidden(true), [])

  // Keyboard shortcut: Ctrl/Cmd + Shift + H
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'h') {
        e.preventDefault()
        setHidden(true)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Re-lock when the tab is hidden (if lock-on-open is enabled).
  useEffect(() => {
    if (!settings.lockOnOpen || !settings.pinHash) return undefined
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') setLocked(true)
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [settings.lockOnOpen, settings.pinHash])

  const value = { settings, update, hide }

  if (hidden) {
    return (
      <DecoyScreen pinHash={settings.pinHash} onUnlock={() => setHidden(false)} />
    )
  }

  if (locked && settings.pinHash) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-white px-6">
        <PinPad pinHash={settings.pinHash} onSuccess={() => setLocked(false)} title="Enter PIN" />
      </div>
    )
  }

  return (
    <DiscretionContext.Provider value={value}>
      {children}
      <QuickHideButton onHide={hide} />
    </DiscretionContext.Provider>
  )
}

/** Subtle, always-present quick-hide control. */
function QuickHideButton({ onHide }) {
  return (
    <button
      onClick={onHide}
      aria-label="Quick hide"
      title="Quick hide (Ctrl+Shift+H)"
      className="fixed right-2 top-2 z-50 flex h-8 w-8 items-center justify-center rounded-full text-charcoal-600 opacity-40 transition hover:bg-charcoal-800 hover:opacity-90"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
        <path d="M3 3l18 18M10.5 5.2A9.8 9.8 0 0 1 12 5c5.5 0 9 5.5 9 7 0 .8-1 2.5-2.7 4M6.2 6.8C3.8 8.5 3 10.5 3 12c0 1.5 3.5 7 9 7 1.3 0 2.5-.3 3.6-.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

export function useDiscretion() {
  const ctx = useContext(DiscretionContext)
  if (!ctx) throw new Error('useDiscretion must be used inside <DiscretionProvider>')
  return ctx
}
