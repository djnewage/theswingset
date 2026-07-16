import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import { usePostableAuthors } from '../feed/useAuthor'
import { createTravelPlan, deleteTravelPlan, fetchMyTravelPlans, travelDates } from './api'
import { Field } from '../auth/AuthLayout'

export function TravelPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const authors = usePostableAuthors()
  const me = authors.find((a) => a.type === 'couple') ?? authors[0]

  const [form, setForm] = useState({ city: '', region: '', startsAt: '', endsAt: '', note: '' })
  const [error, setError] = useState('')

  const { data: plans = [] } = useQuery({
    queryKey: ['myTravel', user.uid],
    queryFn: () => fetchMyTravelPlans(user.uid),
  })

  const create = useMutation({
    mutationFn: () => createTravelPlan(me, form),
    onSuccess: () => {
      setForm({ city: '', region: '', startsAt: '', endsAt: '', note: '' })
      queryClient.invalidateQueries({ queryKey: ['myTravel', user.uid] })
    },
  })

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    setError('')
    if (new Date(form.endsAt) < new Date(form.startsAt)) {
      setError('End date must be after the start date.')
      return
    }
    create.mutate()
  }

  return (
    <div className="px-4 pt-6 pb-10">
      <h1 className="text-xl font-semibold text-charcoal-50">Travel mode</h1>
      <p className="mt-1 text-sm text-charcoal-400">
        Heading somewhere? Locals see a “Visiting” chip on your profile in
        Discover for the trip window (and up to 30 days before).
      </p>

      <form onSubmit={submit} className="mt-5 flex flex-col gap-3 rounded-2xl bg-charcoal-900 p-4 ring-1 ring-charcoal-700">
        <div className="grid grid-cols-2 gap-3">
          <Field label="City" value={form.city} onChange={set('city')} maxLength={80} placeholder="e.g. Miami" required />
          <Field label="Region (optional)" value={form.region} onChange={set('region')} maxLength={80} placeholder="e.g. FL" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="From" type="date" value={form.startsAt} onChange={set('startsAt')} required />
          <Field label="To" type="date" value={form.endsAt} onChange={set('endsAt')} required />
        </div>
        <Field label="Note (optional)" value={form.note} onChange={set('note')} maxLength={140} placeholder="e.g. First time in town — show us around?" />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={create.isPending}
          className="h-11 rounded-2xl bg-gold-500 font-semibold text-charcoal-950 hover:bg-gold-400 disabled:opacity-50"
        >
          Add trip{me.type === 'couple' ? ` as ${me.name}` : ''}
        </button>
      </form>

      <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide text-charcoal-400">
        Your trips
      </h2>
      {plans.length === 0 ? (
        <p className="mt-2 text-sm text-charcoal-500">No trips planned.</p>
      ) : (
        <div className="mt-2 flex flex-col gap-2">
          {plans.map((p) => (
            <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-charcoal-900 p-4 ring-1 ring-charcoal-800">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-charcoal-50">
                  ✈️ {p.city}
                  {p.region ? `, ${p.region}` : ''}
                </p>
                <p className="text-xs text-charcoal-400">{travelDates(p)}</p>
                {p.note && <p className="mt-1 text-sm text-charcoal-300">{p.note}</p>}
              </div>
              <button
                onClick={async () => {
                  if (!window.confirm('Delete this trip?')) return
                  await deleteTravelPlan(p.id)
                  queryClient.invalidateQueries({ queryKey: ['myTravel', user.uid] })
                }}
                className="text-xs text-charcoal-500 hover:text-red-400"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
