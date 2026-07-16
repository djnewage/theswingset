import { Link } from 'react-router-dom'

export function EventCard({ event }) {
  const starts = event.startsAt.toDate()
  return (
    <Link
      to={`/events/${event.id}`}
      className="overflow-hidden rounded-2xl bg-charcoal-900 ring-1 ring-charcoal-800 transition hover:ring-charcoal-600"
    >
      {event.coverPhotoURL && (
        <img src={event.coverPhotoURL} alt="" className="h-36 w-full object-cover" />
      )}
      <div className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gold-400">
          {starts.toLocaleDateString(undefined, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          })}
          {' · '}
          {starts.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
        </p>
        <h3 className="mt-1 text-base font-semibold text-charcoal-50">{event.title}</h3>
        <p className="mt-0.5 text-sm text-charcoal-400">
          {event.geoArea && <>📍 {event.geoArea} · </>}
          Hosted by {event.hostName}
        </p>
        <p className="mt-2 text-xs text-charcoal-500">
          {event.goingCount ?? 0} going
          {event.capacity ? ` · ${event.capacity} spots` : ''}
          {(event.interestedCount ?? 0) > 0 && ` · ${event.interestedCount} interested`}
        </p>
      </div>
    </Link>
  )
}
