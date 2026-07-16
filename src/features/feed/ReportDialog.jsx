import { useState } from 'react'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react'
import { useAuth } from '../auth/AuthContext'
import { submitReport } from './api'

const REASONS = [
  'Non-consensual or exploitative content',
  'Underage person or content',
  'Harassment or abuse',
  'Explicit content outside private albums',
  'Fake profile / catfishing',
  'Spam or scam',
  'Other',
]

/** Report flow for posts, comments, users, and couples. */
export function ReportDialog({ open, onClose, targetType, targetId }) {
  const { user } = useAuth()
  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [state, setState] = useState('idle') // idle | busy | done | error

  const submit = async (e) => {
    e.preventDefault()
    setState('busy')
    try {
      await submitReport(user.uid, { targetType, targetId, reason, details })
      setState('done')
    } catch {
      setState('error')
    }
  }

  const close = () => {
    setState('idle')
    setReason('')
    setDetails('')
    onClose()
  }

  return (
    <Dialog open={open} onClose={close} className="relative z-50">
      <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
      <div className="fixed inset-0 flex items-end justify-center sm:items-center">
        <DialogPanel className="w-full max-w-md rounded-t-2xl bg-charcoal-900 p-5 ring-1 ring-charcoal-700 sm:rounded-2xl">
          {state === 'done' ? (
            <>
              <DialogTitle className="text-lg font-semibold text-charcoal-50">
                Thanks for the report
              </DialogTitle>
              <p className="mt-2 text-sm text-charcoal-300">
                Our moderators will review it. You may also want to block this
                member so you don’t see their content.
              </p>
              <button
                onClick={close}
                className="mt-5 h-11 w-full rounded-2xl bg-gold-500 font-semibold text-charcoal-950 hover:bg-gold-400"
              >
                Done
              </button>
            </>
          ) : (
            <form onSubmit={submit}>
              <DialogTitle className="text-lg font-semibold text-charcoal-50">
                Report {targetType}
              </DialogTitle>
              <div className="mt-4 flex flex-col gap-2">
                {REASONS.map((r) => (
                  <label
                    key={r}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl p-3 text-sm ring-1 transition ${
                      reason === r
                        ? 'bg-charcoal-800 text-charcoal-50 ring-gold-500'
                        : 'text-charcoal-300 ring-charcoal-700 hover:bg-charcoal-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={r}
                      checked={reason === r}
                      onChange={() => setReason(r)}
                      className="accent-[#f5b700]"
                      required
                    />
                    {r}
                  </label>
                ))}
              </div>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Anything else we should know? (optional)"
                rows={2}
                maxLength={1000}
                className="mt-3 w-full rounded-xl border border-charcoal-600 bg-charcoal-800 px-3 py-2 text-sm text-charcoal-50 outline-none focus:border-gold-500"
              />
              {state === 'error' && (
                <p className="mt-2 text-sm text-red-400">
                  Couldn’t submit the report. Please try again.
                </p>
              )}
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={close}
                  className="h-11 flex-1 rounded-2xl bg-charcoal-800 font-medium text-charcoal-200 ring-1 ring-charcoal-600 hover:bg-charcoal-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={state === 'busy'}
                  className="h-11 flex-1 rounded-2xl bg-red-500 font-semibold text-white hover:bg-red-400 disabled:opacity-50"
                >
                  {state === 'busy' ? 'Sending…' : 'Report'}
                </button>
              </div>
            </form>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  )
}
