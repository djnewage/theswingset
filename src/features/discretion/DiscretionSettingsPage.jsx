import { useState } from 'react'
import { useDiscretion } from './DiscretionProvider'
import { hashPin } from './store'

export function DiscretionSettingsPage() {
  const { settings, update, hide } = useDiscretion()
  const [newPin, setNewPin] = useState('')
  const [saved, setSaved] = useState('')

  const setPin = async (e) => {
    e.preventDefault()
    if (newPin.length < 4) return
    update({ pinHash: await hashPin(newPin) })
    setNewPin('')
    setSaved('PIN saved.')
  }

  const Toggle = ({ label, description, checked, onChange, disabled }) => (
    <label
      className={`flex items-start justify-between gap-4 rounded-2xl bg-charcoal-900 p-4 ring-1 ring-charcoal-800 ${
        disabled ? 'opacity-50' : 'cursor-pointer'
      }`}
    >
      <span>
        <span className="block text-sm font-medium text-charcoal-100">{label}</span>
        <span className="mt-0.5 block text-xs text-charcoal-400">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="mt-1 h-5 w-5 accent-[#f5b700]"
      />
    </label>
  )

  return (
    <div className="px-4 pt-6 pb-10">
      <h1 className="text-xl font-semibold text-charcoal-50">Discretion</h1>
      <p className="mt-1 text-sm text-charcoal-400">
        These settings live on this device only — they're never stored on our
        servers.
      </p>

      <div className="mt-5 flex flex-col gap-3">
        <button
          onClick={hide}
          className="rounded-2xl bg-charcoal-900 p-4 text-left ring-1 ring-charcoal-800 hover:ring-charcoal-600"
        >
          <p className="text-sm font-medium text-gold-400">Try quick-hide now</p>
          <p className="mt-0.5 text-xs text-charcoal-400">
            The 👁 button (top-right) or <kbd className="rounded bg-charcoal-800 px-1">Ctrl+Shift+H</kbd> instantly
            swaps to an innocuous notes screen. Triple-tap the “Notes” title to come back.
          </p>
        </button>

        <form onSubmit={setPin} className="rounded-2xl bg-charcoal-900 p-4 ring-1 ring-charcoal-800">
          <p className="text-sm font-medium text-charcoal-100">
            {settings.pinHash ? 'Change PIN' : 'Set a PIN'}
          </p>
          <p className="mt-0.5 text-xs text-charcoal-400">
            Required to leave the decoy screen and (optionally) to open the app.
          </p>
          <div className="mt-3 flex gap-2">
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="4–6 digits"
              className="h-11 flex-1 rounded-2xl border border-charcoal-600 bg-charcoal-800 px-4 text-sm text-charcoal-50 outline-none focus:border-gold-500"
            />
            <button
              type="submit"
              disabled={newPin.length < 4}
              className="h-11 rounded-2xl bg-gold-500 px-4 text-sm font-semibold text-charcoal-950 disabled:opacity-40"
            >
              Save
            </button>
          </div>
          {settings.pinHash && (
            <button
              type="button"
              onClick={() => update({ pinHash: null, lockOnOpen: false })}
              className="mt-2 text-xs text-charcoal-400 underline-offset-2 hover:text-red-400 hover:underline"
            >
              Remove PIN
            </button>
          )}
          {saved && <p className="mt-2 text-xs text-green-400">{saved}</p>}
        </form>

        <Toggle
          label="Require PIN on open"
          description="Lock the app whenever it's opened or backgrounded."
          checked={settings.lockOnOpen}
          onChange={(v) => update({ lockOnOpen: v })}
          disabled={!settings.pinHash}
        />

        <Toggle
          label="Discreet notifications"
          description="Notification text shows only “New activity” — never names, photos, or content."
          checked={settings.discreetNotifications}
          onChange={(v) => update({ discreetNotifications: v })}
        />
      </div>
    </div>
  )
}
