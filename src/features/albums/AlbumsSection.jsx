import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ACCESS_LEVELS, createAlbum, fetchAlbumsByOwner } from './api'
import { Field } from '../auth/AuthLayout'

/**
 * Album list for a profile page. `owner` (a postable-author object) is set
 * only when the viewer owns this profile — it enables the create flow.
 */
export function AlbumsSection({ ownerId, owner = null }) {
  const queryClient = useQueryClient()
  const [creating, setCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [accessLevel, setAccessLevel] = useState('request-only')

  const { data: albums = [] } = useQuery({
    queryKey: ['albums', ownerId],
    queryFn: () => fetchAlbumsByOwner(ownerId),
  })

  const create = useMutation({
    mutationFn: () => createAlbum(owner, { title: title.trim(), accessLevel }),
    onSuccess: () => {
      setTitle('')
      setCreating(false)
      queryClient.invalidateQueries({ queryKey: ['albums', ownerId] })
    },
  })

  if (albums.length === 0 && !owner) return null

  return (
    <section className="mt-6">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-charcoal-400">
          Albums
        </h2>
        {owner && (
          <button
            onClick={() => setCreating((v) => !v)}
            className="text-sm font-medium text-gold-400 hover:text-gold-300"
          >
            {creating ? 'Cancel' : '+ New album'}
          </button>
        )}
      </div>

      {creating && (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (title.trim()) create.mutate()
          }}
          className="mb-3 flex flex-col gap-3 rounded-2xl bg-charcoal-900 p-4 ring-1 ring-charcoal-700"
        >
          <Field
            label="Album title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={60}
            required
          />
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-charcoal-200">Who can view</span>
            <select
              value={accessLevel}
              onChange={(e) => setAccessLevel(e.target.value)}
              className="h-11 w-full rounded-2xl border border-charcoal-600 bg-charcoal-800 px-3 text-sm text-charcoal-100 outline-none focus:border-gold-500"
            >
              {ACCESS_LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label} — {l.description}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            disabled={create.isPending}
            className="h-11 rounded-2xl bg-gold-500 font-semibold text-charcoal-950 hover:bg-gold-400 disabled:opacity-50"
          >
            Create album
          </button>
        </form>
      )}

      {albums.length === 0 ? (
        owner && (
          <p className="rounded-2xl bg-charcoal-900 p-4 text-sm text-charcoal-400 ring-1 ring-charcoal-800">
            No albums yet. Private albums are where adult content belongs —
            gated to the people you choose.
          </p>
        )
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {albums.map((album) => (
            <Link
              key={album.id}
              to={`/albums/${album.id}`}
              className="rounded-2xl bg-charcoal-900 p-4 ring-1 ring-charcoal-800 transition hover:ring-charcoal-600"
            >
              <p className="text-2xl">
                {album.accessLevel === 'public-to-members' ? '📷' : '🔒'}
              </p>
              <p className="mt-1.5 truncate text-sm font-semibold text-charcoal-50">
                {album.title}
              </p>
              <p className="text-xs text-charcoal-400">
                {ACCESS_LEVELS.find((l) => l.value === album.accessLevel)?.label}
                {album.photoCount ? ` · ${album.photoCount} photos` : ''}
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
