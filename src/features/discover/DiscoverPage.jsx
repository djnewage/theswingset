import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { fetchCouplesPage } from './api'
import { fetchUpcomingTravel, travelDates } from '../travel/api'
import { LOOKING_FOR } from '../profiles/constants'
import { BOUNDARY_FIELDS } from '../profiles/boundaries'
import { useAuth } from '../auth/AuthContext'
import { Avatar } from '../../components/Avatar'

export function DiscoverPage() {
  const { profile } = useAuth()
  const [lookingFor, setLookingFor] = useState(null)
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [boundaryFilters, setBoundaryFilters] = useState({})
  const [showFilters, setShowFilters] = useState(false)
  const [search, setSearch] = useState('')

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isPending } =
    useInfiniteQuery({
      queryKey: ['discover', lookingFor, verifiedOnly],
      queryFn: ({ pageParam }) =>
        fetchCouplesPage({ lookingFor, verifiedOnly, cursor: pageParam }),
      initialPageParam: null,
      getNextPageParam: (lastPage) => lastPage.cursor,
    })

  const needle = search.trim().toLowerCase()
  const activeBoundaryKeys = Object.keys(boundaryFilters).filter((k) => boundaryFilters[k])
  const couples = (data?.pages.flatMap((p) => p.couples) ?? [])
    // Hide my own couple and (client-side) apply text + boundaries filters.
    .filter((c) => c.id !== profile.coupleId)
    .filter((c) =>
      activeBoundaryKeys.every((key) => {
        const v = c.boundaries?.[key]
        // "Either" room preference matches both specific filters.
        if (key === 'roomPreference' && v === 'either') return true
        return v === boundaryFilters[key]
      }),
    )
    .filter(
      (c) =>
        !needle ||
        c.coupleName?.toLowerCase().includes(needle) ||
        c.location?.toLowerCase().includes(needle) ||
        c.bio?.toLowerCase().includes(needle),
    )

  return (
    <div className="px-4 pt-6 pb-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-charcoal-50">Discover</h1>
        <div className="flex gap-2">
          <Link
            to="/groups"
            className="flex h-9 items-center rounded-2xl bg-charcoal-800 px-3.5 text-sm font-medium text-charcoal-200 ring-1 ring-charcoal-600 hover:bg-charcoal-700"
          >
            Groups
          </Link>
          <Link
            to="/travel"
            className="flex h-9 items-center rounded-2xl bg-charcoal-800 px-3.5 text-sm font-medium text-charcoal-200 ring-1 ring-charcoal-600 hover:bg-charcoal-700"
          >
            ✈️ Travel
          </Link>
        </div>
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name, city, or vibe…"
        className="mb-3 h-11 w-full rounded-2xl border border-charcoal-600 bg-charcoal-800 px-4 text-sm text-charcoal-50 placeholder-charcoal-400 outline-none focus:border-gold-500"
      />

      <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1">
        <FilterChip active={!lookingFor} onClick={() => setLookingFor(null)}>
          Everyone
        </FilterChip>
        <FilterChip active={verifiedOnly} onClick={() => setVerifiedOnly((v) => !v)}>
          ✓ Verified only
        </FilterChip>
        {LOOKING_FOR.map((tag) => (
          <FilterChip key={tag} active={lookingFor === tag} onClick={() => setLookingFor(tag)}>
            {tag}
          </FilterChip>
        ))}
      </div>

      <button
        onClick={() => setShowFilters((v) => !v)}
        className="mb-3 text-sm font-medium text-gold-400 hover:text-gold-300"
      >
        {showFilters ? 'Hide preference filters ▲' : 'Preference filters ▼'}
        {activeBoundaryKeys.length > 0 && ` (${activeBoundaryKeys.length} active)`}
      </button>

      {showFilters && (
        <div className="mb-5 rounded-2xl bg-charcoal-900 p-4 ring-1 ring-charcoal-800">
          {BOUNDARY_FIELDS.map((field) => (
            <div key={field.key} className="mb-3 last:mb-0">
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-charcoal-400">
                {field.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {field.options.map((opt) => (
                  <FilterChip
                    key={opt.value}
                    active={boundaryFilters[field.key] === opt.value}
                    onClick={() =>
                      setBoundaryFilters((f) => ({
                        ...f,
                        [field.key]: f[field.key] === opt.value ? null : opt.value,
                      }))
                    }
                  >
                    {opt.label}
                  </FilterChip>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <TravelingSection myLocation={profile.location} />

      {isPending && <p className="py-10 text-center text-sm text-charcoal-500">Finding couples…</p>}

      {!isPending && couples.length === 0 && (
        <div className="flex flex-col items-center pt-10 text-center">
          <img src="/pineapple.svg" alt="" className="h-12 w-12 opacity-60" />
          <p className="mt-3 max-w-xs text-sm text-charcoal-400">
            No couples match yet. Check back soon — or invite friends to join.
          </p>
        </div>
      )}

      {/* Swipeable on mobile via scroll-snap; grid on desktop. */}
      <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0">
        {couples.map((couple) => (
          <CoupleCard key={couple.id} couple={couple} />
        ))}
      </div>

      {hasNextPage && (
        <button
          onClick={() => fetchNextPage()}
          disabled={isFetchingNextPage}
          className="mt-4 h-11 w-full rounded-2xl bg-charcoal-800 text-sm font-medium text-charcoal-200 ring-1 ring-charcoal-600 hover:bg-charcoal-700"
        >
          {isFetchingNextPage ? 'Loading…' : 'Show more'}
        </button>
      )}
    </div>
  )
}

/** "Traveling to your area" — trips whose city matches the viewer's location,
 * plus everyone currently on the move if none match. */
function TravelingSection({ myLocation }) {
  const { data: trips = [] } = useQuery({
    queryKey: ['upcomingTravel'],
    queryFn: fetchUpcomingTravel,
  })

  const mine = (myLocation ?? '').toLowerCase()
  const local = mine
    ? trips.filter((t) => mine.includes(t.city.toLowerCase()) || t.city.toLowerCase().includes(mine.split(',')[0].trim()))
    : []
  const shown = local.length > 0 ? local : trips.slice(0, 5)

  if (shown.length === 0) return null

  return (
    <section className="mb-5">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-charcoal-400">
        {local.length > 0 ? 'Traveling to your area' : 'On the move'}
      </h2>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {shown.map((t) => (
          <Link
            key={t.id}
            to={t.ownerType === 'couple' ? `/c/${t.ownerId}` : `/u/${t.ownerId}`}
            className="shrink-0 rounded-2xl bg-charcoal-900 p-3 ring-1 ring-charcoal-800 hover:ring-gold-600/60"
          >
            <div className="flex items-center gap-2.5">
              <Avatar src={t.ownerPhotoURL} name={t.ownerName} className="h-9 w-9 text-sm" />
              <div>
                <p className="text-sm font-semibold text-charcoal-50">{t.ownerName}</p>
                <p className="text-xs text-gold-400">
                  ✈️ Visiting {t.city} {travelDates(t)}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`h-9 shrink-0 rounded-full px-3.5 text-sm font-medium transition ${
        active
          ? 'bg-gold-500 text-charcoal-950'
          : 'bg-charcoal-800 text-charcoal-300 ring-1 ring-charcoal-600 hover:bg-charcoal-700'
      }`}
    >
      {children}
    </button>
  )
}

function CoupleCard({ couple }) {
  return (
    <Link
      to={`/c/${couple.id}`}
      className="w-[85%] shrink-0 snap-center overflow-hidden rounded-2xl bg-charcoal-900 ring-1 ring-charcoal-800 transition hover:ring-gold-600/60 md:w-auto"
    >
      {couple.coverPhotoURL ? (
        <img src={couple.coverPhotoURL} alt="" className="h-44 w-full object-cover" />
      ) : (
        <div className="flex h-44 w-full items-center justify-center bg-charcoal-800">
          <Avatar name={couple.coupleName} className="h-16 w-16 text-2xl" />
        </div>
      )}
      <div className="p-4">
        <h3 className="text-base font-semibold text-charcoal-50">
          {couple.coupleName}
          {couple.verified && (
            <span className="ml-1.5 rounded-full bg-gold-500/15 px-2 py-0.5 text-xs font-semibold text-gold-400" title="Photo verified">
              ✓ Verified
            </span>
          )}
        </h3>
        {couple.location && <p className="mt-0.5 text-sm text-charcoal-400">📍 {couple.location}</p>}
        {couple.bio && <p className="mt-2 line-clamp-2 text-sm text-charcoal-300">{couple.bio}</p>}
        {couple.lookingFor?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {couple.lookingFor.slice(0, 3).map((tag) => (
              <span key={tag} className="rounded-full bg-charcoal-800 px-2.5 py-1 text-xs font-medium text-gold-400">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  )
}
