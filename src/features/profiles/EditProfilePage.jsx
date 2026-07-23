import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { updateUserProfile, uploadProfilePhoto } from './api'
import { INTERESTS, VISIBILITY_OPTIONS } from './constants'
import { BoundariesEditor } from './BoundariesEditor'
import { EMPTY_BOUNDARIES } from './boundaries'
import { MAX_PROMPTS, PROMPT_LIST } from '../prompts/promptList'
import { Field } from '../auth/AuthLayout'
import { Avatar } from '../../components/Avatar'

export function EditProfilePage() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const fileInput = useRef(null)

  const [form, setForm] = useState({
    displayName: profile.displayName ?? '',
    firstName: profile.firstName ?? '',
    lastName: profile.lastName ?? '',
    location: profile.location ?? '',
    bio: profile.bio ?? '',
    interests: profile.interests ?? [],
    visibility: profile.visibility ?? 'members',
  })
  const [boundaries, setBoundaries] = useState({
    ...EMPTY_BOUNDARIES,
    ...(profile.boundaries ?? {}),
  })
  const [prompts, setPrompts] = useState(profile.prompts ?? [])
  const [messagePolicy, setMessagePolicy] = useState(profile.messagePolicy ?? 'connections')
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const toggleInterest = (tag) =>
    setForm((f) => ({
      ...f,
      interests: f.interests.includes(tag)
        ? f.interests.filter((t) => t !== tag)
        : [...f.interests, tag],
    }))

  const pickPhoto = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const save = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const patch = {
        ...form,
        boundaries,
        prompts: prompts.filter((p) => p.prompt && p.answer.trim()),
        messagePolicy,
        location: form.location.trim() || null,
      }
      if (photoFile) {
        patch.photoURL = await uploadProfilePhoto(user.uid, photoFile)
      }
      await updateUserProfile(user.uid, patch)
      navigate('/profile')
    } catch (err) {
      console.error(err)
      setError('Couldn’t save your profile. Please try again.')
      setBusy(false)
    }
  }

  return (
    <div className="px-4 pt-6">
      <h1 className="mb-5 text-xl font-semibold text-charcoal-50">Edit profile</h1>
      <form onSubmit={save} className="flex flex-col gap-5 pb-8">
        <div className="flex items-center gap-4">
          <Avatar
            src={photoPreview ?? profile.photoURL}
            name={form.displayName}
            className="h-20 w-20 text-3xl"
          />
          <div>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="h-10 rounded-2xl bg-charcoal-800 px-4 text-sm font-medium text-charcoal-100 ring-1 ring-charcoal-600 hover:bg-charcoal-700"
            >
              Change photo
            </button>
            <p className="mt-1.5 text-xs text-charcoal-400">
              Location data (EXIF/GPS) is removed automatically.
            </p>
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={pickPhoto}
            />
          </div>
        </div>

        <Field label="Display name" value={form.displayName} onChange={set('displayName')} maxLength={40} required />
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" value={form.firstName} onChange={set('firstName')} maxLength={40} />
          <Field label="Last name" value={form.lastName} onChange={set('lastName')} maxLength={40} />
        </div>
        <p className="-mt-3 text-xs text-charcoal-500">
          If you add a name, members see it instead of your display name. Many
          members use a first name only, or leave both blank — your call.
        </p>
        <Field
          label="Location (city / region only)"
          value={form.location}
          onChange={set('location')}
          placeholder="e.g. Austin, TX"
          maxLength={80}
        />

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-charcoal-200">Bio</span>
          <textarea
            value={form.bio}
            onChange={set('bio')}
            rows={4}
            maxLength={600}
            className="w-full rounded-2xl border border-charcoal-600 bg-charcoal-800 px-4 py-3 text-sm text-charcoal-50 placeholder-charcoal-400 outline-none transition focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
            placeholder="Tell the community a bit about yourselves…"
          />
        </label>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-charcoal-200">Interests</legend>
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((tag) => {
              const active = form.interests.includes(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleInterest(tag)}
                  className={`h-9 rounded-full px-3.5 text-sm font-medium transition ${
                    active
                      ? 'bg-gold-500 text-charcoal-950'
                      : 'bg-charcoal-800 text-charcoal-300 ring-1 ring-charcoal-600 hover:bg-charcoal-700'
                  }`}
                >
                  {tag}
                </button>
              )
            })}
          </div>
        </fieldset>

        <BoundariesEditor value={boundaries} onChange={setBoundaries} />

        <fieldset className="rounded-2xl bg-charcoal-900 p-4 ring-1 ring-charcoal-800">
          <legend className="sr-only">Icebreaker prompts</legend>
          <p className="text-sm font-semibold text-charcoal-100">Icebreaker prompts</p>
          <p className="mt-0.5 text-xs text-charcoal-400">
            Up to {MAX_PROMPTS}. Members react to these instead of sending cold messages.
          </p>
          {prompts.map((p, i) => (
            <div key={i} className="mt-3 rounded-xl bg-charcoal-950 p-3">
              <div className="flex items-center gap-2">
                <select
                  value={p.prompt}
                  onChange={(e) =>
                    setPrompts((cur) => cur.map((x, j) => (j === i ? { ...x, prompt: e.target.value } : x)))
                  }
                  className="h-10 min-w-0 flex-1 rounded-xl border border-charcoal-600 bg-charcoal-800 px-3 text-sm text-charcoal-100 outline-none focus:border-gold-500"
                >
                  {PROMPT_LIST.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => setPrompts((cur) => cur.filter((_, j) => j !== i))}
                  className="text-charcoal-500 hover:text-red-400"
                  aria-label="Remove prompt"
                >
                  ✕
                </button>
              </div>
              <input
                value={p.answer}
                onChange={(e) =>
                  setPrompts((cur) => cur.map((x, j) => (j === i ? { ...x, answer: e.target.value } : x)))
                }
                maxLength={200}
                placeholder="Your answer…"
                className="mt-2 h-10 w-full rounded-xl border border-charcoal-600 bg-charcoal-800 px-3 text-sm text-charcoal-50 outline-none focus:border-gold-500"
              />
            </div>
          ))}
          {prompts.length < MAX_PROMPTS && (
            <button
              type="button"
              onClick={() =>
                setPrompts((cur) => [
                  ...cur,
                  { prompt: PROMPT_LIST.find((p) => !cur.some((c) => c.prompt === p)) ?? PROMPT_LIST[0], answer: '' },
                ])
              }
              className="mt-3 text-sm font-medium text-gold-400 hover:text-gold-300"
            >
              + Add a prompt
            </button>
          )}
        </fieldset>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-charcoal-200">
            Who can message you
          </span>
          <select
            value={messagePolicy}
            onChange={(e) => setMessagePolicy(e.target.value)}
            className="h-11 w-full rounded-2xl border border-charcoal-600 bg-charcoal-800 px-3 text-sm text-charcoal-100 outline-none focus:border-gold-500"
          >
            <option value="connections">Connections only (recommended)</option>
            <option value="couples">Couples only</option>
            <option value="verified">Verified members only</option>
            <option value="everyone">Everyone</option>
          </select>
          <span className="mt-1 block text-xs text-charcoal-500">
            Applies when direct messages launch; icebreaker reactions are always open.
          </span>
        </label>

        <fieldset>
          <legend className="mb-2 text-sm font-medium text-charcoal-200">
            Who can see your profile?
          </legend>
          <div className="flex flex-col gap-2">
            {VISIBILITY_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer items-start gap-3 rounded-2xl p-3 ring-1 transition ${
                  form.visibility === opt.value
                    ? 'bg-charcoal-800 ring-gold-500'
                    : 'ring-charcoal-700 hover:bg-charcoal-900'
                }`}
              >
                <input
                  type="radio"
                  name="visibility"
                  value={opt.value}
                  checked={form.visibility === opt.value}
                  onChange={set('visibility')}
                  className="mt-1 accent-[#f5b700]"
                />
                <span>
                  <span className="block text-sm font-medium text-charcoal-100">{opt.label}</span>
                  <span className="block text-xs text-charcoal-400">{opt.description}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="h-11 flex-1 rounded-2xl bg-charcoal-800 font-medium text-charcoal-200 ring-1 ring-charcoal-600 hover:bg-charcoal-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="h-11 flex-1 rounded-2xl bg-gold-500 font-semibold text-charcoal-950 hover:bg-gold-400 disabled:opacity-50"
          >
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  )
}
