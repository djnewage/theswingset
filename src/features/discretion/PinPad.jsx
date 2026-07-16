import { useState } from 'react'
import { hashPin } from './store'

/** Neutral-styled PIN entry. Calls onSuccess when the entered PIN matches. */
export function PinPad({ pinHash, onSuccess, title = 'Enter PIN' }) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)

  const press = async (digit) => {
    const next = pin + digit
    setPin(next)
    setError(false)
    if (next.length >= 4) {
      if ((await hashPin(next)) === pinHash) {
        onSuccess()
      } else if (next.length >= 6) {
        setPin('')
        setError(true)
      }
    }
  }

  return (
    <div className="flex w-full max-w-xs flex-col items-center">
      <p className="text-sm font-medium text-neutral-500">{title}</p>
      <div className="mt-3 flex gap-2">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <span
            key={i}
            className={`h-3 w-3 rounded-full ${
              i < pin.length ? 'bg-neutral-500' : 'bg-neutral-300'
            }`}
          />
        ))}
      </div>
      {error && <p className="mt-2 text-xs text-red-500">Try again</p>}
      <div className="mt-5 grid grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'].map((key, i) =>
          key === null ? (
            <span key={i} />
          ) : key === 'del' ? (
            <button
              key={i}
              onClick={() => setPin((p) => p.slice(0, -1))}
              className="h-14 w-14 rounded-full text-lg text-neutral-500 hover:bg-neutral-200"
            >
              ⌫
            </button>
          ) : (
            <button
              key={i}
              onClick={() => press(String(key))}
              className="h-14 w-14 rounded-full bg-neutral-100 text-lg font-medium text-neutral-700 hover:bg-neutral-200"
            >
              {key}
            </button>
          ),
        )}
      </div>
    </div>
  )
}
