import { useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import {
  ACCESS_LEVELS,
  deleteAlbum,
  deleteAlbumPhoto,
  fetchAlbum,
  fetchAlbumPhotos,
  fetchGrantRequests,
  fetchMyGrant,
  requestAlbumAccess,
  respondToGrant,
  uploadAlbumPhoto,
} from './api'
import { fetchCouple } from '../profiles/api'
import { Avatar } from '../../components/Avatar'
import { Lightbox } from '../../components/Lightbox'

export function AlbumViewPage() {
  const { albumId } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const queryClient = useQueryClient()
  const fileInput = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [viewer, setViewer] = useState(null) // index of the opened photo

  const { data: album, isPending } = useQuery({
    queryKey: ['album', albumId],
    queryFn: () => fetchAlbum(albumId),
  })

  const isOwner = album?.ownerUids?.includes(user.uid)

  // Photos query failing with permission-denied = locked for this viewer.
  const photosQuery = useQuery({
    queryKey: ['albumPhotos', albumId],
    queryFn: () => fetchAlbumPhotos(albumId),
    enabled: !!album,
    retry: false,
  })
  const locked = photosQuery.isError

  const { data: myGrant } = useQuery({
    queryKey: ['grant', albumId, user.uid],
    queryFn: () => fetchMyGrant(albumId, user.uid),
    enabled: !!album && !isOwner,
  })

  const request = useMutation({
    mutationFn: () =>
      requestAlbumAccess(albumId, {
        uid: user.uid,
        name: profile.displayName,
        photoURL: profile.photoURL,
      }),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['grant', albumId, user.uid] }),
  })

  const upload = async (e) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    try {
      for (const file of files) {
        await uploadAlbumPhoto(album, file, user.uid)
      }
      queryClient.invalidateQueries({ queryKey: ['albumPhotos', albumId] })
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const removePhoto = async (photoId) => {
    if (!window.confirm('Delete this photo?')) return
    await deleteAlbumPhoto(albumId, photoId)
    queryClient.invalidateQueries({ queryKey: ['albumPhotos', albumId] })
  }

  const removeAlbum = async () => {
    if (!window.confirm('Delete this whole album?')) return
    await deleteAlbum(albumId)
    navigate(-1)
  }

  if (isPending) {
    return <p className="px-4 pt-16 text-center text-sm text-charcoal-400">Loading…</p>
  }
  if (!album) {
    return <p className="px-4 pt-16 text-center text-sm text-charcoal-400">Album not found.</p>
  }

  return (
    <div className="px-4 pt-6 pb-10">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-charcoal-50">
            {locked && '🔒 '}
            {album.title}
          </h1>
          <p className="mt-0.5 text-sm text-charcoal-400">
            by {album.ownerName} ·{' '}
            {ACCESS_LEVELS.find((l) => l.value === album.accessLevel)?.label}
          </p>
        </div>
        {isOwner && (
          <button onClick={removeAlbum} className="shrink-0 text-sm text-red-400 hover:text-red-300">
            Delete album
          </button>
        )}
      </div>

      {isOwner && (
        <>
          <button
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            className="mt-4 h-11 w-full rounded-2xl bg-gold-500 font-semibold text-charcoal-950 hover:bg-gold-400 disabled:opacity-50"
          >
            {uploading ? 'Uploading…' : '+ Add photos (EXIF/GPS stripped)'}
          </button>
          <input ref={fileInput} type="file" accept="image/*" multiple className="hidden" onChange={upload} />
          <GrantRequests album={album} />
        </>
      )}

      {locked ? (
        <div className="mt-8 flex flex-col items-center rounded-2xl bg-charcoal-900 p-8 text-center ring-1 ring-charcoal-700">
          <p className="text-4xl">🔒</p>
          <p className="mt-3 text-sm font-medium text-charcoal-100">This album is private</p>
          <p className="mt-1 max-w-xs text-sm text-charcoal-400">
            {album.accessLevel === 'connections'
              ? 'Connect with the owner to view it.'
              : 'The owner approves each viewer.'}
          </p>
          {album.accessLevel === 'request-only' &&
            (myGrant?.status === 'requested' ? (
              <p className="mt-4 text-sm text-gold-400">Request sent — waiting for approval.</p>
            ) : (
              <button
                onClick={() => request.mutate()}
                disabled={request.isPending}
                className="mt-4 h-11 rounded-2xl bg-gold-500 px-6 font-semibold text-charcoal-950 hover:bg-gold-400 disabled:opacity-50"
              >
                Request access
              </button>
            ))}
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {(photosQuery.data ?? []).map((photo, i) => (
            <div key={photo.id} className="group relative">
              <button onClick={() => setViewer(i)} className="block w-full cursor-zoom-in">
                <img src={photo.url} alt="" loading="lazy" className="aspect-square w-full rounded-xl object-cover" />
              </button>
              {isOwner && (
                <button
                  onClick={() => removePhoto(photo.id)}
                  className="absolute right-2 top-2 hidden h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white group-hover:flex"
                  aria-label="Delete photo"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          {photosQuery.data?.length === 0 && (
            <p className="col-span-full py-8 text-center text-sm text-charcoal-500">
              No photos yet.
            </p>
          )}
        </div>
      )}

      {viewer !== null && (
        <Lightbox
          images={(photosQuery.data ?? []).map((p) => p.url)}
          initialIndex={viewer}
          onClose={() => setViewer(null)}
        />
      )}
    </div>
  )
}

function GrantRequests({ album }) {
  const albumId = album.id
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { data: grants = [] } = useQuery({
    queryKey: ['grants', albumId],
    queryFn: () => fetchGrantRequests(albumId),
  })
  const { data: ownerCouple } = useQuery({
    queryKey: ['couple', album.ownerId],
    queryFn: () => fetchCouple(album.ownerId),
    enabled: album.ownerType === 'couple',
  })

  const respond = useMutation({
    mutationFn: ({ grant, approve }) =>
      respondToGrant(album, grant, user.uid, approve, ownerCouple),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['grants', albumId] }),
  })

  const pending = grants.filter((g) => g.status === 'requested')
  const granted = grants.filter((g) => g.status === 'granted')

  if (grants.length === 0) return null

  return (
    <div className="mt-4 rounded-2xl bg-charcoal-900 p-4 ring-1 ring-charcoal-800">
      {pending.length > 0 && (
        <>
          <p className="text-sm font-semibold text-gold-400">Access requests</p>
          {pending.map((g) => (
            <div key={g.uid} className="mt-2 flex items-center gap-3">
              <Avatar src={g.photoURL} name={g.name} className="h-8 w-8 text-sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm text-charcoal-100">{g.name}</p>
                {g.approvals && Object.keys(g.approvals).length > 0 && (
                  <p className="text-xs text-charcoal-400">
                    {g.approvals[user.uid] ? 'You approved — partner pending' : 'Partner approved — your turn'}
                  </p>
                )}
              </div>
              {!g.approvals?.[user.uid] && (
                <button
                  onClick={() => respond.mutate({ grant: g, approve: true })}
                  className="h-8 rounded-lg bg-gold-500 px-3 text-xs font-semibold text-charcoal-950"
                >
                  Approve
                </button>
              )}
              <button
                onClick={() => respond.mutate({ grant: g, approve: false })}
                className="h-8 rounded-lg bg-charcoal-800 px-3 text-xs text-charcoal-300 ring-1 ring-charcoal-600"
              >
                Deny
              </button>
            </div>
          ))}
        </>
      )}
      {granted.length > 0 && (
        <>
          <p className={`text-sm font-semibold text-charcoal-300 ${pending.length ? 'mt-4' : ''}`}>
            Has access ({granted.length})
          </p>
          {granted.map((g) => (
            <div key={g.uid} className="mt-2 flex items-center gap-3">
              <Avatar src={g.photoURL} name={g.name} className="h-8 w-8 text-sm" />
              <p className="min-w-0 flex-1 truncate text-sm text-charcoal-200">{g.name}</p>
              <button
                onClick={() => respond.mutate({ grant: g, approve: false })}
                className="text-xs text-charcoal-500 hover:text-red-400"
              >
                Revoke
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
