import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import { usePostableAuthors } from '../feed/useAuthor'
import { fetchMyVerifications, generateVerificationCode, submitVerification } from './api'
import { Avatar } from '../../components/Avatar'

export function VerifyPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const authors = usePostableAuthors()
  const fileInput = useRef(null)

  const code = useMemo(() => generateVerificationCode(), [])
  const [subjectIdx, setSubjectIdx] = useState(0)
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const subject = authors[Math.min(subjectIdx, authors.length - 1)]

  const { data: mine = [] } = useQuery({
    queryKey: ['myVerifications', user.uid],
    queryFn: () => fetchMyVerifications(user.uid),
  })
  const pendingForSubject = mine.find(
    (v) => v.subjectId === subject.id && v.status === 'pending',
  )

  const pick = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setPreview(URL.createObjectURL(f))
  }

  const submit = async () => {
    if (!file) return
    setError('')
    setBusy(true)
    try {
      await submitVerification(subject, user.uid, file, code)
      queryClient.invalidateQueries({ queryKey: ['myVerifications', user.uid] })
      navigate('/profile')
    } catch (err) {
      console.error(err)
      setError('Couldn’t submit. Please try again.')
      setBusy(false)
    }
  }

  return (
    <div className="px-4 pt-6 pb-10">
      <h1 className="text-xl font-semibold text-charcoal-50">Get verified</h1>
      <p className="mt-2 text-sm text-charcoal-300">
        Verified badges tell the community you're real. A moderator reviews
        your photo, then it's <span className="font-medium text-charcoal-100">permanently deleted from view</span> —
        it never appears on your profile.
      </p>

      {authors.length > 1 && (
        <div className="mt-4 flex gap-2">
          {authors.map((a, i) => (
            <button
              key={a.id}
              onClick={() => setSubjectIdx(i)}
              className={`flex h-10 items-center gap-2 rounded-2xl px-3 text-sm font-medium transition ${
                i === subjectIdx
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

      {pendingForSubject ? (
        <div className="mt-6 rounded-2xl bg-charcoal-900 p-5 ring-1 ring-gold-700/50">
          <p className="text-sm font-medium text-gold-400">Review in progress</p>
          <p className="mt-1 text-sm text-charcoal-300">
            Your submission is with the moderators. You'll get the badge as
            soon as it's approved.
          </p>
        </div>
      ) : (
        <>
          <ol className="mt-5 flex flex-col gap-3 text-sm text-charcoal-200">
            <li className="rounded-2xl bg-charcoal-900 p-4 ring-1 ring-charcoal-800">
              <span className="font-semibold text-gold-400">1.</span> Write this
              code on paper:
              <code className="mt-2 block rounded-xl bg-charcoal-950 px-4 py-3 text-center text-xl font-bold tracking-[0.3em] text-gold-400">
                {code}
              </code>
            </li>
            <li className="rounded-2xl bg-charcoal-900 p-4 ring-1 ring-charcoal-800">
              <span className="font-semibold text-gold-400">2.</span> Take a
              selfie {subject.type === 'couple' ? 'together, both of you ' : ''}
              holding the paper. Face and code clearly visible.
            </li>
            <li className="rounded-2xl bg-charcoal-900 p-4 ring-1 ring-charcoal-800">
              <span className="font-semibold text-gold-400">3.</span> Upload it —
              only moderators can ever see it.
            </li>
          </ol>

          {preview && (
            <img src={preview} alt="Verification selfie preview" className="mt-4 max-h-72 w-full rounded-2xl object-contain bg-charcoal-950" />
          )}

          <div className="mt-4 flex gap-3">
            <button
              onClick={() => fileInput.current?.click()}
              className="h-11 flex-1 rounded-2xl bg-charcoal-800 font-medium text-charcoal-100 ring-1 ring-charcoal-600 hover:bg-charcoal-700"
            >
              {file ? 'Retake / choose another' : 'Choose selfie'}
            </button>
            <button
              onClick={submit}
              disabled={!file || busy}
              className="h-11 flex-1 rounded-2xl bg-gold-500 font-semibold text-charcoal-950 hover:bg-gold-400 disabled:opacity-40"
            >
              {busy ? 'Submitting…' : 'Submit for review'}
            </button>
          </div>
          <input ref={fileInput} type="file" accept="image/*" capture="user" className="hidden" onChange={pick} />
          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        </>
      )}
    </div>
  )
}
