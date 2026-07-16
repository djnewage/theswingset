import { useEffect, useRef, useState } from 'react'
import { PinPad } from './PinPad'

const FAKE_NOTES = [
  { title: 'Grocery list', body: 'Eggs, oat milk, coffee beans, chicken thighs, spinach, lemons', time: 'Tue' },
  { title: 'Meeting notes', body: 'Follow up with vendor re: Q3 invoice. Send deck by Friday.', time: 'Mon' },
  { title: 'Weekend', body: 'Oil change · return package · call mom', time: 'Sun' },
  { title: 'Books to read', body: 'Project Hail Mary, The Creative Act, Tomorrow x3', time: 'Jun 30' },
  { title: 'Wifi guest pw', body: 'sunflower2291', time: 'Jun 24' },
]

/**
 * Innocuous decoy: a plain light-mode notes app. Triple-tap the "Notes"
 * header (within ~1.5s) to exit — then PIN if one is set.
 */
export function DecoyScreen({ pinHash, onUnlock }) {
  const [askPin, setAskPin] = useState(false)
  const taps = useRef([])

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Notes'
    return () => {
      document.title = previousTitle
    }
  }, [])

  const tapTitle = () => {
    const now = Date.now()
    taps.current = [...taps.current.filter((t) => now - t < 1500), now]
    if (taps.current.length >= 3) {
      taps.current = []
      if (pinHash) setAskPin(true)
      else onUnlock()
    }
  }

  if (askPin) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-white px-6">
        <PinPad pinHash={pinHash} onSuccess={onUnlock} title="Notes locked" />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-neutral-50 text-neutral-900">
      <header className="sticky top-0 border-b border-neutral-200 bg-white/90 px-4 py-3 backdrop-blur">
        <h1 onClick={tapTitle} className="select-none text-lg font-semibold">
          Notes
        </h1>
      </header>
      <div className="mx-auto max-w-xl px-4 py-2">
        {FAKE_NOTES.map((note) => (
          <div key={note.title} className="border-b border-neutral-200 py-3">
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-semibold">{note.title}</p>
              <span className="text-xs text-neutral-400">{note.time}</span>
            </div>
            <p className="mt-0.5 truncate text-sm text-neutral-500">{note.body}</p>
          </div>
        ))}
      </div>
      <button
        aria-hidden="true"
        className="fixed bottom-6 right-6 flex h-[52px] w-[52px] items-center justify-center rounded-full bg-amber-400 text-2xl text-white shadow-lg"
      >
        +
      </button>
    </div>
  )
}
