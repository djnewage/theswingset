import { useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { createPost, MAX_POST_IMAGES } from './api'
import { usePostableAuthors } from './useAuthor'
import { VISIBILITY_OPTIONS } from '../profiles/constants'
import { Avatar } from '../../components/Avatar'

export function ComposePage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const authors = usePostableAuthors()
  const fileInput = useRef(null)

  // When sharing, location.state.shareOf carries the original post.
  const shareOf = useLocation().state?.shareOf ?? null

  const [authorIdx, setAuthorIdx] = useState(0)
  const [text, setText] = useState('')
  const [files, setFiles] = useState([])
  const [visibility, setVisibility] = useState('members')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const author = authors[Math.min(authorIdx, authors.length - 1)]
  const previews = files.map((f) => URL.createObjectURL(f))

  const addFiles = (e) => {
    const picked = Array.from(e.target.files ?? [])
    setFiles((cur) => [...cur, ...picked].slice(0, MAX_POST_IMAGES))
    e.target.value = ''
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!text.trim() && files.length === 0 && !shareOf) return
    setError('')
    setBusy(true)
    try {
      await createPost(author, {
        text: text.trim(),
        files,
        visibility,
        sharedFrom: shareOf
          ? { postId: shareOf.id, authorName: shareOf.authorName }
          : null,
      })
      queryClient.invalidateQueries({ queryKey: ['feed'] })
      navigate('/')
    } catch (err) {
      console.error(err)
      setError('Couldn’t publish your post. Please try again.')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="px-4 pt-6 pb-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-charcoal-50">
          {shareOf ? 'Share post' : 'New post'}
        </h1>
        <button
          type="submit"
          disabled={busy || (!text.trim() && files.length === 0 && !shareOf)}
          className="h-10 rounded-2xl bg-gold-500 px-5 font-semibold text-charcoal-950 hover:bg-gold-400 disabled:opacity-40"
        >
          {busy ? 'Posting…' : 'Post'}
        </button>
      </div>

      {authors.length > 1 && (
        <div className="mb-4 flex gap-2">
          {authors.map((a, i) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAuthorIdx(i)}
              className={`flex h-10 items-center gap-2 rounded-2xl px-3 text-sm font-medium transition ${
                i === authorIdx
                  ? 'bg-gold-500 text-charcoal-950'
                  : 'bg-charcoal-800 text-charcoal-300 ring-1 ring-charcoal-600'
              }`}
            >
              <Avatar src={a.photoURL} name={a.name} className="h-6 w-6 text-xs" />
              {a.type === 'couple' ? `${a.name} (couple)` : a.name}
            </button>
          ))}
        </div>
      )}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={shareOf ? 'Add a comment (optional)…' : 'What’s going on?'}
        rows={5}
        maxLength={2000}
        autoFocus
        className="w-full rounded-2xl border border-charcoal-600 bg-charcoal-800 px-4 py-3 text-[15px] text-charcoal-50 placeholder-charcoal-400 outline-none transition focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
      />

      {shareOf && (
        <div className="mt-3 rounded-2xl bg-charcoal-900 p-4 ring-1 ring-charcoal-700">
          <p className="text-xs font-medium text-charcoal-400">↻ Sharing from {shareOf.authorName}</p>
          <p className="mt-1 line-clamp-3 text-sm text-charcoal-200">{shareOf.text}</p>
        </div>
      )}

      {previews.length > 0 && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {previews.map((src, i) => (
            <div key={src} className="relative">
              <img src={src} alt="" className="aspect-square w-full rounded-xl object-cover" />
              <button
                type="button"
                onClick={() => setFiles((cur) => cur.filter((_, j) => j !== i))}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white"
                aria-label="Remove image"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={files.length >= MAX_POST_IMAGES || !!shareOf}
          className="flex h-11 items-center gap-2 rounded-2xl bg-charcoal-800 px-4 text-sm font-medium text-charcoal-200 ring-1 ring-charcoal-600 hover:bg-charcoal-700 disabled:opacity-40"
        >
          📷 Add photos ({files.length}/{MAX_POST_IMAGES})
        </button>
        <input ref={fileInput} type="file" accept="image/*" multiple className="hidden" onChange={addFiles} />

        <select
          value={visibility}
          onChange={(e) => setVisibility(e.target.value)}
          className="h-11 rounded-2xl border border-charcoal-600 bg-charcoal-800 px-3 text-sm text-charcoal-100 outline-none focus:border-gold-500"
        >
          {VISIBILITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <p className="mt-2 text-xs text-charcoal-500">
        No explicit imagery in feed posts — keep that to private albums.
        Photo location data is removed automatically.
      </p>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </form>
  )
}
