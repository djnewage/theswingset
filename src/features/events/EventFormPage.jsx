import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { createEvent } from './api'
import { usePostableAuthors } from '../feed/useAuthor'
import { VISIBILITY_OPTIONS } from '../profiles/constants'
import { Field } from '../auth/AuthLayout'
import { Avatar } from '../../components/Avatar'

export function EventFormPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const hosts = usePostableAuthors()

  const [hostIdx, setHostIdx] = useState(0)
  const [form, setForm] = useState({
    title: '',
    description: '',
    locationText: '',
    geoArea: '',
    startsAt: '',
    endsAt: '',
    capacity: '',
    visibility: 'members',
    approvalRequired: false,
    recurrence: 'none',
    coverFile: null,
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const host = hosts[Math.min(hostIdx, hosts.length - 1)]

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    if (new Date(form.startsAt) < new Date()) {
      setError('Start time must be in the future.')
      return
    }
    if (form.endsAt && new Date(form.endsAt) <= new Date(form.startsAt)) {
      setError('End time must be after the start time.')
      return
    }
    setBusy(true)
    try {
      const eventId = await createEvent(host, form)
      queryClient.invalidateQueries({ queryKey: ['events'] })
      navigate(`/events/${eventId}`, { replace: true })
    } catch (err) {
      console.error(err)
      setError('Couldn’t create the event. Please try again.')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="px-4 pt-6 pb-8">
      <h1 className="mb-5 text-xl font-semibold text-charcoal-50">Host an event</h1>

      {hosts.length > 1 && (
        <div className="mb-4">
          <span className="mb-1.5 block text-sm font-medium text-charcoal-200">Host as</span>
          <div className="flex gap-2">
            {hosts.map((h, i) => (
              <button
                key={h.id}
                type="button"
                onClick={() => setHostIdx(i)}
                className={`flex h-10 items-center gap-2 rounded-2xl px-3 text-sm font-medium transition ${
                  i === hostIdx
                    ? 'bg-gold-500 text-charcoal-950'
                    : 'bg-charcoal-800 text-charcoal-300 ring-1 ring-charcoal-600'
                }`}
              >
                <Avatar src={h.photoURL} name={h.name} className="h-6 w-6 text-xs" />
                {h.type === 'couple' ? `${h.name} (couple)` : h.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <Field label="Title" value={form.title} onChange={set('title')} maxLength={100} placeholder="e.g. Saturday house party" required />

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-charcoal-200">Description</span>
          <textarea
            value={form.description}
            onChange={set('description')}
            rows={4}
            maxLength={2000}
            placeholder="What to expect, house rules, what to bring…"
            className="w-full rounded-2xl border border-charcoal-600 bg-charcoal-800 px-4 py-3 text-sm text-charcoal-50 placeholder-charcoal-400 outline-none transition focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
          />
        </label>

        <Field
          label="Area shown while browsing (city / neighborhood)"
          value={form.geoArea}
          onChange={set('geoArea')}
          maxLength={80}
          placeholder="e.g. North Austin"
          required
        />
        <Field
          label="Exact location details (only hosts + confirmed guests see this)"
          value={form.locationText}
          onChange={set('locationText')}
          maxLength={200}
          placeholder="Address or venue — hidden until someone RSVPs “going”"
        />

        <div className="grid grid-cols-2 gap-3">
          <Field label="Starts" type="datetime-local" value={form.startsAt} onChange={set('startsAt')} required />
          <Field label="Ends (optional)" type="datetime-local" value={form.endsAt} onChange={set('endsAt')} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Capacity (optional)" type="number" min="2" max="500" value={form.capacity} onChange={set('capacity')} placeholder="No limit" />
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-charcoal-200">Visibility</span>
            <select
              value={form.visibility}
              onChange={set('visibility')}
              className="h-11 w-full rounded-2xl border border-charcoal-600 bg-charcoal-800 px-3 text-sm text-charcoal-100 outline-none focus:border-gold-500"
            >
              {VISIBILITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center justify-between gap-3 rounded-2xl bg-charcoal-900 px-4 py-3 ring-1 ring-charcoal-700">
            <span>
              <span className="block text-sm font-medium text-charcoal-100">Approve guests</span>
              <span className="block text-xs text-charcoal-400">You confirm each “going”</span>
            </span>
            <input
              type="checkbox"
              checked={form.approvalRequired}
              onChange={(e) => setForm((f) => ({ ...f, approvalRequired: e.target.checked }))}
              className="h-5 w-5 accent-[#f5b700]"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-charcoal-200">Repeats</span>
            <select
              value={form.recurrence}
              onChange={set('recurrence')}
              className="h-11 w-full rounded-2xl border border-charcoal-600 bg-charcoal-800 px-3 text-sm text-charcoal-100 outline-none focus:border-gold-500"
            >
              <option value="none">Doesn’t repeat</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Every 2 weeks</option>
              <option value="monthly">Monthly</option>
            </select>
          </label>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-charcoal-200">
            Cover photo (optional — EXIF/GPS stripped)
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setForm((f) => ({ ...f, coverFile: e.target.files?.[0] ?? null }))}
            className="block w-full text-sm text-charcoal-300 file:mr-3 file:h-10 file:cursor-pointer file:rounded-xl file:border-0 file:bg-charcoal-800 file:px-4 file:text-sm file:font-medium file:text-charcoal-100"
          />
        </label>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/events')}
            className="h-11 flex-1 rounded-2xl bg-charcoal-800 font-medium text-charcoal-200 ring-1 ring-charcoal-600 hover:bg-charcoal-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="h-11 flex-1 rounded-2xl bg-gold-500 font-semibold text-charcoal-950 hover:bg-gold-400 disabled:opacity-50"
          >
            {busy ? 'Creating…' : 'Create event'}
          </button>
        </div>
      </div>
    </form>
  )
}
