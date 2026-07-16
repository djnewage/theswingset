import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useAuth } from '../auth/AuthContext'
import { fetchMyCalendar, fetchUpcomingEvents } from './api'
import { EventCard } from './EventCard'

export function EventsPage() {
  const [tab, setTab] = useState('upcoming')

  return (
    <div className="px-4 pt-6 pb-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-charcoal-50">Events</h1>
        <Link
          to="/events/new"
          className="flex h-10 items-center rounded-2xl bg-gold-500 px-4 text-sm font-semibold text-charcoal-950 hover:bg-gold-400"
        >
          + Host one
        </Link>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-charcoal-900 p-1 ring-1 ring-charcoal-700">
        {[
          ['upcoming', 'Upcoming'],
          ['calendar', 'My calendar'],
        ].map(([value, label]) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`h-10 rounded-xl text-sm font-medium transition ${
              tab === value
                ? 'bg-gold-500 text-charcoal-950'
                : 'text-charcoal-300 hover:text-charcoal-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'upcoming' ? <UpcomingList /> : <MyCalendar />}
    </div>
  )
}

function UpcomingList() {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending } =
    useInfiniteQuery({
      queryKey: ['events'],
      queryFn: ({ pageParam }) => fetchUpcomingEvents(pageParam),
      initialPageParam: null,
      getNextPageParam: (lastPage) => lastPage.cursor,
    })

  const events = data?.pages.flatMap((p) => p.events) ?? []

  if (isPending) {
    return <p className="py-10 text-center text-sm text-charcoal-500">Loading events…</p>
  }
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center pt-10 text-center">
        <img src="/pineapple.svg" alt="" className="h-12 w-12 opacity-60" />
        <p className="mt-3 max-w-xs text-sm text-charcoal-400">
          No upcoming events yet. Host the first play date, house party, or
          meetup in your area.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="h-11 rounded-2xl bg-charcoal-800 text-sm font-medium text-charcoal-200 ring-1 ring-charcoal-600 hover:bg-charcoal-700"
        >
          {isFetchingNextPage ? 'Loading…' : 'Load more'}
        </button>
      )}
    </div>
  )
}

function MyCalendar() {
  const { user } = useAuth()
  const { data: rsvps = [], isPending } = useQuery({
    queryKey: ['calendar', user.uid],
    queryFn: () => fetchMyCalendar(user.uid),
  })

  if (isPending) {
    return <p className="py-10 text-center text-sm text-charcoal-500">Loading calendar…</p>
  }
  if (rsvps.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-charcoal-400">
        Nothing on your calendar yet. RSVP to an event and it’ll show up here.
      </p>
    )
  }

  // Group by "Month Year".
  const groups = rsvps.reduce((acc, r) => {
    const key = r.eventStartsAt.toDate().toLocaleDateString(undefined, {
      month: 'long',
      year: 'numeric',
    })
    ;(acc[key] ??= []).push(r)
    return acc
  }, {})

  return (
    <div className="flex flex-col gap-5">
      {Object.entries(groups).map(([month, items]) => (
        <section key={month}>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-charcoal-400">
            {month}
          </h2>
          <div className="flex flex-col gap-2">
            {items.map((r) => (
              <Link
                key={r.eventId}
                to={`/events/${r.eventId}`}
                className="flex items-center gap-4 rounded-2xl bg-charcoal-900 p-4 ring-1 ring-charcoal-800 hover:ring-charcoal-600"
              >
                <div className="flex h-12 w-12 flex-col items-center justify-center rounded-xl bg-charcoal-800 text-gold-400">
                  <span className="text-lg font-bold leading-5">
                    {r.eventStartsAt.toDate().getDate()}
                  </span>
                  <span className="text-[10px] uppercase">
                    {r.eventStartsAt.toDate().toLocaleDateString(undefined, { weekday: 'short' })}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-charcoal-50">{r.eventTitle}</p>
                  <p className="text-xs text-charcoal-400">
                    {r.eventStartsAt.toDate().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                    {' · '}
                    <span className={r.status === 'going' ? 'text-gold-400' : ''}>
                      {r.status === 'going' ? 'Going' : 'Interested'}
                    </span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
