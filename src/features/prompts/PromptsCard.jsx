import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import { sendPromptReaction } from './api'
import { REACTION_EMOJIS } from './promptList'

/** Icebreaker prompts on a profile, with a react-to-break-the-ice flow. */
export function PromptsCard({ prompts, target }) {
  const { user, profile } = useAuth()
  const [reactingTo, setReactingTo] = useState(null)
  const [emoji, setEmoji] = useState('🍍')
  const [text, setText] = useState('')
  const [sentFor, setSentFor] = useState([])

  const isMine = target.uids.includes(user.uid)

  const send = useMutation({
    mutationFn: (prompt) =>
      sendPromptReaction(
        { uid: user.uid, name: profile.displayName, photoURL: profile.photoURL },
        target,
        { prompt, emoji, text: text.trim() },
      ),
    onSuccess: (_, prompt) => {
      setSentFor((cur) => [...cur, prompt])
      setReactingTo(null)
      setText('')
    },
  })

  if (!prompts?.length) return null

  return (
    <section className="mt-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-charcoal-400">
        Icebreakers
      </h2>
      <div className="mt-2 flex flex-col gap-2">
        {prompts.map(({ prompt, answer }) => (
          <div key={prompt} className="rounded-2xl bg-charcoal-900 p-4 ring-1 ring-charcoal-800">
            <p className="text-xs font-medium text-gold-400">{prompt}</p>
            <p className="mt-1 whitespace-pre-wrap text-[15px] text-charcoal-100">{answer}</p>

            {!isMine && (
              <div className="mt-2.5">
                {sentFor.includes(prompt) ? (
                  <p className="text-xs text-gold-400">Sent ✓ — they'll see your reaction</p>
                ) : reactingTo === prompt ? (
                  <div>
                    <div className="flex gap-1.5">
                      {REACTION_EMOJIS.map((e) => (
                        <button
                          key={e}
                          onClick={() => setEmoji(e)}
                          className={`flex h-9 w-9 items-center justify-center rounded-full text-lg transition ${
                            emoji === e ? 'bg-gold-500/25 ring-1 ring-gold-500' : 'bg-charcoal-800'
                          }`}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <input
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        maxLength={140}
                        placeholder="Add a line (optional)…"
                        className="h-10 flex-1 rounded-xl border border-charcoal-600 bg-charcoal-800 px-3 text-sm text-charcoal-50 outline-none focus:border-gold-500"
                      />
                      <button
                        onClick={() => send.mutate(prompt)}
                        disabled={send.isPending}
                        className="h-10 rounded-xl bg-gold-500 px-4 text-sm font-semibold text-charcoal-950 disabled:opacity-50"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setReactingTo(prompt)}
                    className="text-sm font-medium text-gold-400 hover:text-gold-300"
                  >
                    React 🍍
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
