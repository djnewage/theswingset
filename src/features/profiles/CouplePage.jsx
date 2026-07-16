import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import {
  createCouple,
  createInvite,
  deleteInvite,
  fetchCouple,
  fetchMyInvites,
  fetchUser,
  joinCoupleWithCode,
  unlinkFromCouple,
  updateCouple,
  uploadCoupleCover,
} from './api'
import { LOOKING_FOR } from './constants'
import { BoundariesEditor } from './BoundariesEditor'
import { EMPTY_BOUNDARIES } from './boundaries'
import { Field } from '../auth/AuthLayout'

export function CouplePage() {
  const { user, profile } = useAuth()
  if (!profile.coupleId) return <StartCouple uid={user.uid} location={profile.location} />
  return <ManageCouple uid={user.uid} coupleId={profile.coupleId} />
}

// ---------- no couple yet: create or join ----------

function StartCouple({ uid, location }) {
  const [mode, setMode] = useState('create')
  const [coupleName, setCoupleName] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const queryClient = useQueryClient()

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'create') {
        await createCouple(uid, coupleName.trim())
      } else {
        await joinCoupleWithCode(uid, code)
      }
      queryClient.invalidateQueries()
      // AuthContext's profile listener picks up the new coupleId and re-renders.
    } catch (err) {
      setError(err.message ?? 'Something went wrong. Please try again.')
      setBusy(false)
    }
  }

  return (
    <div className="px-4 pt-6">
      <h1 className="mb-2 text-xl font-semibold text-charcoal-50">Couple profile</h1>
      <p className="mb-5 text-sm text-charcoal-400">
        Link with your partner to share one couple profile. Either of you can
        post and manage it.
      </p>

      <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-charcoal-900 p-1 ring-1 ring-charcoal-700">
        {[
          ['create', 'Start a couple'],
          ['join', 'I have a code'],
        ].map(([value, label]) => (
          <button
            key={value}
            onClick={() => setMode(value)}
            className={`h-10 rounded-xl text-sm font-medium transition ${
              mode === value
                ? 'bg-gold-500 text-charcoal-950'
                : 'text-charcoal-300 hover:text-charcoal-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="flex flex-col gap-4">
        {mode === 'create' ? (
          <Field
            label="Couple name"
            value={coupleName}
            onChange={(e) => setCoupleName(e.target.value)}
            placeholder="e.g. J & M"
            maxLength={60}
            required
          />
        ) : (
          <Field
            label="Invite code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="8-character code from your partner"
            maxLength={8}
            required
          />
        )}
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="h-11 rounded-2xl bg-gold-500 font-semibold text-charcoal-950 hover:bg-gold-400 disabled:opacity-50"
        >
          {busy ? 'One moment…' : mode === 'create' ? 'Create & get invite code' : 'Link accounts'}
        </button>
      </form>
    </div>
  )
}

// ---------- has a couple: pending invite or linked ----------

function ManageCouple({ uid, coupleId }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [error, setError] = useState('')

  const { data: couple, isPending } = useQuery({
    queryKey: ['couple', coupleId],
    queryFn: () => fetchCouple(coupleId),
  })
  const partnerUid = couple?.partnerUids.find((p) => p !== uid)
  const { data: partner } = useQuery({
    queryKey: ['user', partnerUid],
    queryFn: () => fetchUser(partnerUid),
    enabled: !!partnerUid,
  })

  if (isPending) return <p className="px-4 pt-10 text-center text-sm text-charcoal-400">Loading…</p>
  if (!couple) return <p className="px-4 pt-10 text-center text-sm text-charcoal-400">Couple not found.</p>

  const linked = couple.partnerUids.length === 2

  const unlink = async () => {
    if (!window.confirm('Unlink from this couple profile? Your personal account stays intact.')) return
    try {
      await unlinkFromCouple(uid, couple)
      queryClient.invalidateQueries()
      navigate('/profile')
    } catch {
      setError('Couldn’t unlink. Please try again.')
    }
  }

  return (
    <div className="px-4 pt-6 pb-8">
      <h1 className="mb-5 text-xl font-semibold text-charcoal-50">{couple.coupleName}</h1>

      {!linked && <PendingInvite uid={uid} coupleId={coupleId} />}

      {linked && (
        <div className="mb-5 rounded-2xl bg-charcoal-900 p-4 ring-1 ring-charcoal-800">
          <p className="text-sm text-charcoal-300">
            Linked with{' '}
            <span className="font-medium text-charcoal-100">
              {partner?.displayName ?? '…'}
            </span>{' '}
            💛
          </p>
        </div>
      )}

      <CoupleEditor couple={couple} coupleId={coupleId} />

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      <button
        onClick={unlink}
        className="mt-6 h-11 w-full rounded-2xl bg-charcoal-800 font-medium text-red-400 ring-1 ring-charcoal-600 hover:bg-charcoal-700"
      >
        Unlink couple
      </button>
    </div>
  )
}

function PendingInvite({ uid, coupleId }) {
  const queryClient = useQueryClient()
  const [busy, setBusy] = useState(false)

  const { data: invites } = useQuery({
    queryKey: ['invites', uid],
    queryFn: () => fetchMyInvites(uid),
  })
  const invite = invites?.find((i) => i.coupleId === coupleId)

  const regenerate = async () => {
    setBusy(true)
    try {
      if (invite) await deleteInvite(invite.code)
      await createInvite(uid, coupleId)
      queryClient.invalidateQueries({ queryKey: ['invites', uid] })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mb-5 rounded-2xl bg-charcoal-900 p-4 ring-1 ring-gold-700/50">
      <p className="text-sm font-medium text-gold-400">Waiting for your partner</p>
      <p className="mt-1 text-sm text-charcoal-300">
        Have them sign up, then enter this code under{' '}
        <span className="font-medium">Profile → Couple → I have a code</span>:
      </p>
      <div className="mt-3 flex items-center gap-2">
        <code className="flex-1 rounded-xl bg-charcoal-950 px-4 py-3 text-center text-lg font-bold tracking-[0.3em] text-gold-400">
          {invite?.code ?? '········'}
        </code>
        <button
          onClick={() => invite && navigator.clipboard.writeText(invite.code)}
          className="h-11 rounded-xl bg-charcoal-800 px-3 text-sm text-charcoal-200 ring-1 ring-charcoal-600 hover:bg-charcoal-700"
        >
          Copy
        </button>
      </div>
      <button
        onClick={regenerate}
        disabled={busy}
        className="mt-2 text-xs text-charcoal-400 underline-offset-2 hover:text-charcoal-200 hover:underline disabled:opacity-50"
      >
        Generate a new code
      </button>
    </div>
  )
}

function CoupleEditor({ couple, coupleId }) {
  const queryClient = useQueryClient()
  const [coupleName, setCoupleName] = useState(couple.coupleName)
  const [bio, setBio] = useState(couple.bio ?? '')
  const [location, setLocation] = useState(couple.location ?? '')
  const [lookingFor, setLookingFor] = useState(couple.lookingFor ?? [])
  const [boundaries, setBoundaries] = useState({
    ...EMPTY_BOUNDARIES,
    ...(couple.boundaries ?? {}),
  })
  const [dualConsent, setDualConsent] = useState({
    connections: couple.dualConsent?.connections ?? false,
    albums: couple.dualConsent?.albums ?? false,
  })
  const [coverFile, setCoverFile] = useState(null)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const toggle = (tag) =>
    setLookingFor((cur) =>
      cur.includes(tag) ? cur.filter((t) => t !== tag) : [...cur, tag],
    )

  const save = async (e) => {
    e.preventDefault()
    setError('')
    setSaved(false)
    setBusy(true)
    try {
      const patch = { coupleName, bio, location: location.trim() || null, lookingFor, boundaries, dualConsent }
      if (coverFile) patch.coverPhotoURL = await uploadCoupleCover(coupleId, coverFile)
      await updateCouple(coupleId, patch)
      queryClient.invalidateQueries({ queryKey: ['couple', coupleId] })
      setSaved(true)
    } catch {
      setError('Couldn’t save. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      {couple.coverPhotoURL && (
        <img
          src={couple.coverPhotoURL}
          alt=""
          className="h-40 w-full rounded-2xl object-cover"
        />
      )}
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-charcoal-200">
          Cover photo (EXIF/GPS stripped automatically)
        </span>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-charcoal-300 file:mr-3 file:h-10 file:cursor-pointer file:rounded-xl file:border-0 file:bg-charcoal-800 file:px-4 file:text-sm file:font-medium file:text-charcoal-100"
        />
      </label>
      <Field label="Couple name" value={coupleName} onChange={(e) => setCoupleName(e.target.value)} maxLength={60} required />
      <Field label="Location (city / region only)" value={location} onChange={(e) => setLocation(e.target.value)} maxLength={80} />
      <label className="block">
        <span className="mb-1.5 block text-sm font-medium text-charcoal-200">Couple bio</span>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          maxLength={600}
          className="w-full rounded-2xl border border-charcoal-600 bg-charcoal-800 px-4 py-3 text-sm text-charcoal-50 outline-none transition focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
        />
      </label>
      <fieldset>
        <legend className="mb-2 text-sm font-medium text-charcoal-200">Looking for</legend>
        <div className="flex flex-wrap gap-2">
          {LOOKING_FOR.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggle(tag)}
              className={`h-9 rounded-full px-3.5 text-sm font-medium transition ${
                lookingFor.includes(tag)
                  ? 'bg-gold-500 text-charcoal-950'
                  : 'bg-charcoal-800 text-charcoal-300 ring-1 ring-charcoal-600 hover:bg-charcoal-700'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </fieldset>
      <BoundariesEditor value={boundaries} onChange={setBoundaries} />

      <fieldset className="rounded-2xl bg-charcoal-900 p-4 ring-1 ring-charcoal-800">
        <legend className="sr-only">Dual consent</legend>
        <p className="text-sm font-semibold text-charcoal-100">Dual consent</p>
        <p className="mt-0.5 text-xs text-charcoal-400">
          When on, BOTH of you must approve before the action completes.
        </p>
        {[
          ['connections', 'Accepting connection requests'],
          ['albums', 'Granting private album access'],
        ].map(([key, label]) => (
          <label key={key} className="mt-3 flex cursor-pointer items-center justify-between gap-3">
            <span className="text-sm text-charcoal-200">{label}</span>
            <input
              type="checkbox"
              checked={dualConsent[key]}
              onChange={(e) => setDualConsent((d) => ({ ...d, [key]: e.target.checked }))}
              className="h-5 w-5 accent-[#f5b700]"
            />
          </label>
        ))}
      </fieldset>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {saved && <p className="text-sm text-green-400">Saved.</p>}
      <button
        type="submit"
        disabled={busy}
        className="h-11 rounded-2xl bg-gold-500 font-semibold text-charcoal-950 hover:bg-gold-400 disabled:opacity-50"
      >
        {busy ? 'Saving…' : 'Save couple profile'}
      </button>
    </form>
  )
}
