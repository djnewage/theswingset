import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useAuth } from '../auth/AuthContext'
import { listenMessages, markThreadRead, sendMessage } from './api'
import { Avatar } from '../../components/Avatar'
import { timeAgo } from '../../lib/time'

export function ThreadPage() {
  const { threadId } = useParams()
  const { user, profile } = useAuth()
  const [thread, setThread] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const bottom = useRef(null)

  useEffect(() => {
    getDoc(doc(db, 'threads', threadId)).then((snap) => {
      setThread(snap.exists() ? { id: snap.id, ...snap.data() } : false)
    })
    return listenMessages(threadId, setMessages)
  }, [threadId])

  // Mark read on open and whenever a new message from the other side lands.
  useEffect(() => {
    if (!thread) return
    const last = messages[messages.length - 1]
    if (last && last.senderUid !== user.uid) {
      markThreadRead(threadId, user.uid).catch(() => {})
    } else if (messages.length === 0) {
      markThreadRead(threadId, user.uid).catch(() => {})
    }
  }, [threadId, thread, messages, user.uid])

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' })
  }, [messages.length])

  if (thread === false) {
    return (
      <p className="px-4 pt-16 text-center text-sm text-charcoal-400">
        This conversation doesn’t exist or isn’t visible to you.
      </p>
    )
  }
  if (!thread) {
    return <p className="px-4 pt-16 text-center text-sm text-charcoal-400">Loading…</p>
  }

  const otherId = thread.entityIds.find((id) => !thread.entities[id].uids.includes(user.uid))
  const other = thread.entities[otherId]
  const myEntityId = thread.entityIds.find((id) => id !== otherId)

  const submit = async (e) => {
    e.preventDefault()
    const body = text.trim()
    if (!body || busy) return
    setBusy(true)
    setError('')
    try {
      await sendMessage(threadId, {
        senderUid: user.uid,
        senderEntityId: myEntityId,
        senderName: profile.displayName,
        text: body,
      })
      setText('')
    } catch (err) {
      console.error(err)
      setError('Couldn’t send. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col md:h-dvh">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-charcoal-800 bg-charcoal-950/90 px-4 py-2.5 backdrop-blur">
        <Link to="/messages" className="-ml-1 flex h-9 w-9 items-center justify-center rounded-full text-charcoal-300 hover:bg-charcoal-800" aria-label="Back to messages">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <Link
          to={other.type === 'couple' ? `/c/${otherId}` : `/u/${otherId}`}
          className="flex min-w-0 items-center gap-2.5"
        >
          <Avatar src={other.photoURL} name={other.name} className="h-9 w-9 text-sm" />
          <span className="truncate text-sm font-semibold text-charcoal-50">{other.name}</span>
          {other.type === 'couple' && (
            <span className="rounded-full bg-charcoal-800 px-2 py-0.5 text-[10px] font-medium text-gold-400">
              couple
            </span>
          )}
        </Link>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 && (
          <p className="pt-10 text-center text-sm text-charcoal-500">
            Say hi — this is the start of your conversation. 🍍
          </p>
        )}
        <div className="flex flex-col gap-1.5">
          {messages.map((m, i) => {
            const mine = m.senderUid === user.uid
            const prev = messages[i - 1]
            const showMeta = !prev || prev.senderUid !== m.senderUid
            return (
              <div key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
                {showMeta && (
                  <p className="mt-3 mb-0.5 px-1 text-[11px] text-charcoal-500">
                    {mine ? 'You' : m.senderName}
                    {m.createdAt && ` · ${timeAgo(m.createdAt)}`}
                  </p>
                )}
                <div
                  className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-[15px] leading-5 ${
                    mine
                      ? 'rounded-br-md bg-gold-500 text-charcoal-950'
                      : 'rounded-bl-md bg-charcoal-800 text-charcoal-50'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            )
          })}
        </div>
        <div ref={bottom} />
      </div>

      <form onSubmit={submit} className="border-t border-charcoal-800 bg-charcoal-950 px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        {error && <p className="px-1 pb-1.5 text-xs text-red-400">{error}</p>}
        <div className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                submit(e)
              }
            }}
            placeholder="Message…"
            rows={1}
            maxLength={2000}
            className="max-h-32 min-h-[44px] flex-1 resize-none rounded-2xl border border-charcoal-600 bg-charcoal-800 px-4 py-2.5 text-[15px] text-charcoal-50 placeholder-charcoal-400 outline-none transition focus:border-gold-500"
          />
          <button
            type="submit"
            disabled={busy || !text.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gold-500 text-charcoal-950 transition hover:bg-gold-400 disabled:opacity-40"
            aria-label="Send"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h13M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  )
}
