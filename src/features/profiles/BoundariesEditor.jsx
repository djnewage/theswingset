import { BOUNDARY_FIELDS } from './boundaries'

/**
 * Structured, all-optional boundaries editor. `value` is a boundaries object;
 * `onChange` receives the updated object. Tapping a selected chip clears it.
 */
export function BoundariesEditor({ value, onChange }) {
  const set = (key, v) => onChange({ ...value, [key]: value[key] === v ? null : v })

  return (
    <fieldset className="rounded-2xl bg-charcoal-900 p-4 ring-1 ring-charcoal-800">
      <legend className="sr-only">Boundaries & preferences</legend>
      <p className="text-sm font-semibold text-charcoal-100">Boundaries & preferences</p>
      <p className="mt-0.5 text-xs text-charcoal-400">
        All optional — share only what you're comfortable with. These help
        others find a match in Discover.
      </p>

      {BOUNDARY_FIELDS.map((field) => (
        <div key={field.key} className="mt-3.5">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-charcoal-400">
            {field.label}
          </p>
          <div className="flex flex-wrap gap-2">
            {field.options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => set(field.key, opt.value)}
                className={`h-9 rounded-full px-3.5 text-sm font-medium transition ${
                  value[field.key] === opt.value
                    ? 'bg-gold-500 text-charcoal-950'
                    : 'bg-charcoal-800 text-charcoal-300 ring-1 ring-charcoal-600 hover:bg-charcoal-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      ))}

      <label className="mt-4 block">
        <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-charcoal-400">
          Boundaries in your own words
        </span>
        <textarea
          value={value.boundariesText ?? ''}
          onChange={(e) => onChange({ ...value, boundariesText: e.target.value })}
          rows={3}
          maxLength={400}
          placeholder="Hard limits, must-haves, pace — anything a match should know up front."
          className="w-full rounded-2xl border border-charcoal-600 bg-charcoal-800 px-4 py-3 text-sm text-charcoal-50 placeholder-charcoal-400 outline-none transition focus:border-gold-500 focus:ring-1 focus:ring-gold-500"
        />
      </label>
    </fieldset>
  )
}
