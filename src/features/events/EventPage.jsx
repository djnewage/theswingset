import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import {
  deleteEvent,
  fetchAllRsvps,
  fetchAttendees,
  fetchEvent,
  fetchEventMessages,
  fetchMyRsvp,
  goingStatusFor,
  hostSetRsvpStatus,
  sendEventMessage,
  setRsvp,
} from './api'
import { ConnectButton } from '../connections/ConnectButton'
import { ReportDialog } from '../feed/ReportDialog'
import { Avatar } from '../../components/Avatar'
import { timeAgo } from '../../lib/time'

export function EventPage() {
  const { eventId } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const queryClient = useQueryClient()
  const [reporting, setReporting] = useState(false)

  const { data: event, isPending } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => fetchEvent(eventId),
  })
  const { data: myRsvp } = useQuery({
    queryKey: ['rsvp', eventId, user.uid],
    queryFn: () => fetchMyRsvp(eventId, user.uid),
  })
  const { data: attendees = [] } = useQuery({
    queryKey: ['attendees', eventId],
    queryFn: () => fetchAttendees(eventId),
  })

  const invalidateRsvps = () => {
    queryClient.invalidateQueries({ queryKey: ['rsvp', eventId, user.uid] })
    queryClient.invalidateQueries({ queryKey: ['attendees', eventId] })
    queryClient.invalidateQueries({ queryKey: ['allRsvps', eventId] })
    queryClient.invalidateQueries({ queryKey: ['calendar', user.uid] })
  }

  const rsvp = useMutation({
    mutationFn: (status) =>
      setRsvp(
        eventId,
        event,
        { uid: user.uid, name: profile.displayName, photoURL: profile.photoURL, verified: profile.verified },
        status,
      ),
    onSuccess: invalidateRsvps,
  })

  if (isPending) {
    return <p className="px-4 pt-16 text-center text-sm text-charcoal-400">Loading…</p>
  }
  if (!event) {
    return (
      <p className="px-4 pt-16 text-center text-sm text-charcoal-400">
        This event is gone or you don’t have access to it.
      </p>
    )
  }

  const isHost = event.hostUids?.includes(user.uid)
  const starts = event.startsAt.toDate()
  const ended = (event.endsAt?.toDate() ?? starts) < new Date()
  const going = attendees.filter((a) => a.status === 'going')
  const interested = attendees.filter((a) => a.status === 'interested')
  const full = event.capacity && going.length >= event.capacity && myRsvp?.status !== 'going'

  const remove = async () => {
    if (!window.confirm('Delete this event? Attendees will lose access.')) return
    await deleteEvent(eventId)
    queryClient.invalidateQueries({ queryKey: ['events'] })
    navigate('/events')
  }

  return (
    <div className="pb-10">
      {event.coverPhotoURL && (
        <img src={event.coverPhotoURL} alt="" className="h-48 w-full object-cover" />
      )}
      <div className="px-4 pt-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gold-400">
              {starts.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
              {' · '}
              {starts.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
              {event.endsAt && <> – {event.endsAt.toDate().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}</>}
            </p>
            <h1 className="mt-1 text-2xl font-bold text-charcoal-50">{event.title}</h1>
            <p className="mt-1 text-sm text-charcoal-400">Hosted by {event.hostName}</p>
          </div>
          {isHost ? (
            <button onClick={remove} className="shrink-0 text-sm text-red-400 hover:text-red-300">
              Delete
            </button>
          ) : (
            <button onClick={() => setReporting(true)} className="shrink-0 text-sm text-charcoal-500 hover:text-charcoal-300">
              Report
            </button>
          )}
        </div>

        <p className="mt-2 text-sm text-charcoal-300">📍 {event.geoArea}</p>
        {event.locationText && (myRsvp?.status === 'going' || isHost) && (
          <p className="mt-1 rounded-xl bg-charcoal-900 px-3 py-2 text-sm text-charcoal-200 ring-1 ring-gold-700/40">
            🔑 {event.locationText}
          </p>
        )}
        {event.locationText && myRsvp?.status !== 'going' && !isHost && (
          <p className="mt-1 text-xs text-charcoal-500">Exact location is shared once you RSVP “going.”</p>
        )}

        {event.description && (
          <p className="mt-4 whitespace-pre-wrap text-[15px] leading-6 text-charcoal-100">
            {event.description}
          </p>
        )}

        <div className="mt-5 grid grid-cols-3 gap-2">
          {[
            ['going', event.approvalRequired ? 'Request to join' : full ? 'Join waitlist' : 'Going 🎉'],
            ['interested', 'Interested'],
            ['declined', 'Can’t make it'],
          ].map(([intent, label]) => {
            const actual = intent === 'going' ? goingStatusFor(event, going.length) : intent
            const active =
              intent === 'going'
                ? ['going', 'requested', 'waitlist'].includes(myRsvp?.status)
                : myRsvp?.status === intent
            return (
              <button
                key={intent}
                onClick={() => rsvp.mutate(actual)}
                disabled={rsvp.isPending}
                className={`h-11 rounded-2xl text-sm font-semibold transition disabled:opacity-40 ${
                  active
                    ? 'bg-gold-500 text-charcoal-950'
                    : 'bg-charcoal-800 text-charcoal-200 ring-1 ring-charcoal-600 hover:bg-charcoal-700'
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
        {myRsvp?.status === 'requested' && (
          <p className="mt-2 text-xs text-gold-400">Request sent — the host will confirm you.</p>
        )}
        {myRsvp?.status === 'waitlist' && (
          <p className="mt-2 text-xs text-gold-400">
            You're on the waitlist — you'll be moved up automatically when a spot opens.
          </p>
        )}
        {full && myRsvp?.status !== 'going' && (
          <p className="mt-2 text-xs text-charcoal-500">
            This event is at capacity ({event.capacity}).
          </p>
        )}

        {isHost && <HostPanel eventId={eventId} onChanged={invalidateRsvps} />}

        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-charcoal-400">
            Going ({going.length}
            {event.capacity ? ` / ${event.capacity}` : ''})
            {interested.length > 0 && ` · Interested (${interested.length})`}
          </h2>
          <div className="mt-2 flex flex-wrap gap-3">
            {[...going, ...interested].map((a) => (
              <div key={a.attendeeId} className="flex items-center gap-2">
                <Avatar src={a.attendeePhotoURL} name={a.attendeeName} className="h-8 w-8 text-sm" />
                <span className={`text-sm ${a.status === 'going' ? 'text-charcoal-100' : 'text-charcoal-400'}`}>
                  {a.attendeeName}
                  {a.attendeeVerified && (
                    <span className="ml-1 text-gold-400" title="Photo verified">✓</span>
                  )}
                </span>
              </div>
            ))}
            {attendees.length === 0 && (
              <p className="text-sm text-charcoal-500">No RSVPs yet — be the first.</p>
            )}
          </div>
        </section>

        {ended && (myRsvp?.status === 'going' || isHost) && (
          <PostEventConnect attendees={going} myUid={user.uid} />
        )}

        <EventChat eventId={eventId} canChat={!!myRsvp || isHost} />
      </div>

      <ReportDialog open={reporting} onClose={() => setReporting(false)} targetType="post" targetId={`event:${eventId}`} />
    </div>
  )
}

/** Host tools: approve requests, manage waitlist, remove attendees. */
function HostPanel({ eventId, onChanged }) {
  const { data: rsvps = [] } = useQuery({
    queryKey: ['allRsvps', eventId],
    queryFn: () => fetchAllRsvps(eventId),
  })

  const act = useMutation({
    mutationFn: ({ attendeeId, status }) => hostSetRsvpStatus(eventId, attendeeId, status),
    onSuccess: onChanged,
  })

  const requested = rsvps.filter((r) => r.status === 'requested')
  const waitlist = rsvps
    .filter((r) => r.status === 'waitlist')
    .sort((a, b) => (a.updatedAt?.seconds ?? 0) - (b.updatedAt?.seconds ?? 0))
  const going = rsvps.filter((r) => r.status === 'going')

  if (requested.length === 0 && waitlist.length === 0 && going.length === 0) return null

  const Row = ({ r, actions }) => (
    <div className="mt-2 flex items-center gap-3">
      <Avatar src={r.attendeePhotoURL} name={r.attendeeName} className="h-8 w-8 text-sm" />
      <p className="min-w-0 flex-1 truncate text-sm text-charcoal-100">
        {r.attendeeName}
        {r.attendeeVerified && <span className="ml-1 text-gold-400">✓</span>}
      </p>
      {actions.map(([label, status, danger]) => (
        <button
          key={label}
          onClick={() => act.mutate({ attendeeId: r.attendeeId, status })}
          disabled={act.isPending}
          className={`h-8 rounded-lg px-3 text-xs font-semibold disabled:opacity-50 ${
            danger
              ? 'bg-charcoal-800 text-red-400 ring-1 ring-charcoal-600'
              : 'bg-gold-500 text-charcoal-950'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )

  return (
    <section className="mt-6 rounded-2xl bg-charcoal-900 p-4 ring-1 ring-gold-700/40">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gold-400">
        Host tools
      </h2>
      {requested.length > 0 && (
        <>
          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-charcoal-400">
            Requests ({requested.length})
          </p>
          {requested.map((r) => (
            <Row key={r.attendeeId} r={r} actions={[['Approve', 'going'], ['Decline', 'declined', true]]} />
          ))}
        </>
      )}
      {waitlist.length > 0 && (
        <>
          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-charcoal-400">
            Waitlist ({waitlist.length}) — auto-promotes when spots open
          </p>
          {waitlist.map((r) => (
            <Row key={r.attendeeId} r={r} actions={[['Promote', 'going'], ['Remove', 'declined', true]]} />
          ))}
        </>
      )}
      {going.length > 0 && (
        <>
          <p className="mt-3 text-xs font-medium uppercase tracking-wide text-charcoal-400">
            Confirmed ({going.length})
          </p>
          {going.map((r) => (
            <Row key={r.attendeeId} r={r} actions={[['Remove', 'declined', true]]} />
          ))}
        </>
      )}
    </section>
  )
}

/** After the event: nudge attendees to connect with each other. */
function PostEventConnect({ attendees, myUid }) {
  const others = attendees.filter((a) => a.attendeeId !== myUid)
  if (others.length === 0) return null

  return (
    <section className="mt-6 rounded-2xl bg-charcoal-900 p-4 ring-1 ring-charcoal-800">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-charcoal-400">
        You were all there — stay in touch
      </h2>
      <div className="mt-1 flex flex-col gap-2">
        {others.map((a) => (
          <div key={a.attendeeId} className="flex items-center gap-3">
            <Avatar src={a.attendeePhotoURL} name={a.attendeeName} className="h-8 w-8 text-sm" />
            <p className="min-w-0 flex-1 truncate text-sm text-charcoal-100">{a.attendeeName}</p>
            <ConnectButton
              target={{ type: 'user', id: a.attendeeId, uids: [a.attendeeId], name: a.attendeeName, photoURL: a.attendeePhotoURL }}
            />
          </div>
        ))}
      </div>
    </section>
  )
}

function EventChat({ eventId, canChat }) {
  const { user, profile } = useAuth()
  const queryClient = useQueryClient()
  const [text, setText] = useState('')

  const { data: messages = [] } = useQuery({
    queryKey: ['eventChat', eventId],
    queryFn: () => fetchEventMessages(eventId),
    refetchInterval: 15_000,
  })

  const send = useMutation({
    mutationFn: () =>
      sendEventMessage(eventId, {
        authorId: user.uid,
        authorName: profile.displayName,
        authorPhotoURL: profile.photoURL,
        text: text.trim(),
      }),
    onSuccess: () => {
      setText('')
      queryClient.invalidateQueries({ queryKey: ['eventChat', eventId] })
    },
  })

  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-charcoal-400">
        Event chat
      </h2>
      <div className="mt-2 flex flex-col gap-3 rounded-2xl bg-charcoal-900 p-4 ring-1 ring-charcoal-800">
        {messages.length === 0 && (
          <p className="text-sm text-charcoal-500">No messages yet.</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className="flex gap-2.5">
            <Avatar src={m.authorPhotoURL} name={m.authorName} className="h-7 w-7 text-xs" />
            <div className="min-w-0">
              <p className="text-xs text-charcoal-400">
                <span className="font-semibold text-charcoal-200">{m.authorName}</span>{' '}
                {timeAgo(m.createdAt)}
              </p>
              <p className="whitespace-pre-wrap text-sm text-charcoal-100">{m.text}</p>
            </div>
          </div>
        ))}

        {canChat ? (
          <form
            onSubmit={(e) => {
              e.preventDefault()
              if (text.trim()) send.mutate()
            }}
            className="mt-2 flex gap-2"
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Message attendees…"
              maxLength={1000}
              className="h-10 flex-1 rounded-xl border border-charcoal-600 bg-charcoal-800 px-3 text-sm text-charcoal-50 placeholder-charcoal-400 outline-none focus:border-gold-500"
            />
            <button
              type="submit"
              disabled={!text.trim() || send.isPending}
              className="h-10 rounded-xl bg-gold-500 px-4 text-sm font-semibold text-charcoal-950 hover:bg-gold-400 disabled:opacity-40"
            >
              Send
            </button>
          </form>
        ) : (
          <p className="mt-1 text-xs text-charcoal-500">RSVP to join the conversation.</p>
        )}
      </div>
    </section>
  )
}
