import { BOUNDARY_FIELDS, boundaryLabel, hasAnyBoundary } from './boundaries'

/** Scannable read-only boundaries card for profile pages. */
export function BoundariesCard({ boundaries }) {
  if (!hasAnyBoundary(boundaries)) return null

  return (
    <section className="mt-5 rounded-2xl bg-charcoal-900 p-4 ring-1 ring-charcoal-800">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-charcoal-400">
        Boundaries & preferences
      </h2>
      <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2">
        {BOUNDARY_FIELDS.map((field) => {
          const label = boundaryLabel(field.key, boundaries[field.key])
          if (!label) return null
          return (
            <div key={field.key}>
              <dt className="text-xs text-charcoal-500">{field.label}</dt>
              <dd className="text-sm font-medium text-charcoal-100">{label}</dd>
            </div>
          )
        })}
      </dl>
      {(boundaries.boundariesText ?? '').trim() && (
        <p className="mt-3 whitespace-pre-wrap rounded-xl bg-charcoal-950 px-3 py-2 text-sm text-charcoal-200">
          {boundaries.boundariesText}
        </p>
      )}
    </section>
  )
}
