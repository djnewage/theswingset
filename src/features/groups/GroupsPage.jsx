import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import { createGroup, fetchGroups } from './api'
import { Field } from '../auth/AuthLayout'

export function GroupsPage() {
  const { user, profile } = useAuth()
  const queryClient = useQueryClient()
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', region: '' })
  const [search, setSearch] = useState('')

  const { data: groups = [], isPending } = useQuery({
    queryKey: ['groups'],
    queryFn: fetchGroups,
  })

  const create = useMutation({
    mutationFn: () =>
      createGroup(
        { uid: user.uid, name: profile.displayName, photoURL: profile.photoURL },
        form,
      ),
    onSuccess: () => {
      setCreating(false)
      setForm({ name: '', description: '', region: '' })
      queryClient.invalidateQueries({ queryKey: ['groups'] })
    },
  })

  const needle = search.trim().toLowerCase()
  const visible = groups.filter(
    (g) =>
      !needle ||
      g.name.toLowerCase().includes(needle) ||
      g.region?.toLowerCase().includes(needle),
  )

  return (
    <div className="px-4 pt-6 pb-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-charcoal-50">Groups</h1>
        <button
          onClick={() => setCreating((v) => !v)}
          className="h-10 rounded-2xl bg-gold-500 px-4 text-sm font-semibold text-charcoal-950 hover:bg-gold-400"
        >
          {creating ? 'Cancel' : '+ New group'}
        </button>
      </div>

      {creating && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            create.mutate()
          }}
          className="mb-5 flex flex-col gap-3 rounded-2xl bg-charcoal-900 p-4 ring-1 ring-charcoal-700"
        >
          <Field
            label="Group name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            maxLength={60}
            placeholder="e.g. Austin After Dark"
            required
          />
          <Field
            label="City / region"
            value={form.region}
            onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
            maxLength={80}
            placeholder="e.g. Austin, TX"
            required
          />
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-charcoal-200">Description</span>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={2}
              maxLength={400}
              className="w-full rounded-2xl border border-charcoal-600 bg-charcoal-800 px-4 py-3 text-sm text-charcoal-50 outline-none focus:border-gold-500"
            />
          </label>
          <button
            type="submit"
            disabled={create.isPending}
            className="h-11 rounded-2xl bg-gold-500 font-semibold text-charcoal-950 hover:bg-gold-400 disabled:opacity-50"
          >
            Create group
          </button>
        </form>
      )}

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name or city…"
        className="mb-4 h-11 w-full rounded-2xl border border-charcoal-600 bg-charcoal-800 px-4 text-sm text-charcoal-50 placeholder-charcoal-400 outline-none focus:border-gold-500"
      />

      {isPending && <p className="py-10 text-center text-sm text-charcoal-500">Loading groups…</p>}
      {!isPending && visible.length === 0 && (
        <p className="py-10 text-center text-sm text-charcoal-400">
          No groups yet — start the first one for your city.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {visible.map((g) => (
          <Link
            key={g.id}
            to={`/groups/${g.id}`}
            className="rounded-2xl bg-charcoal-900 p-4 ring-1 ring-charcoal-800 transition hover:ring-charcoal-600"
          >
            <p className="text-sm font-semibold text-charcoal-50">{g.name}</p>
            <p className="mt-0.5 text-xs text-charcoal-400">
              📍 {g.region} · {g.memberCount ?? 0} member{(g.memberCount ?? 0) === 1 ? '' : 's'}
            </p>
            {g.description && (
              <p className="mt-1.5 line-clamp-2 text-sm text-charcoal-300">{g.description}</p>
            )}
          </Link>
        ))}
      </div>
    </div>
  )
}
