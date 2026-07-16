/**
 * Boundaries & preferences: every field is OPTIONAL (null = "prefer not to
 * say") and none is ever required. Values double as Discover filters.
 */
export const BOUNDARY_FIELDS = [
  {
    key: 'playStyle',
    label: 'Play style',
    options: [
      { value: 'social', label: 'Social only' },
      { value: 'soft', label: 'Soft' },
      { value: 'full', label: 'Full' },
    ],
  },
  {
    key: 'roomPreference',
    label: 'Room preference',
    options: [
      { value: 'same-room', label: 'Same room' },
      { value: 'separate-room', label: 'Separate rooms' },
      { value: 'either', label: 'Either' },
    ],
  },
  {
    key: 'openTo',
    label: 'Open to',
    options: [
      { value: 'couples-only', label: 'Couples only' },
      { value: 'open-to-singles', label: 'Open to singles' },
    ],
  },
  {
    key: 'smoking',
    label: 'Smoking',
    options: [
      { value: 'no', label: 'Non-smoking' },
      { value: 'socially', label: 'Socially' },
      { value: 'yes', label: 'Smoker-friendly' },
    ],
  },
  {
    key: 'drinking',
    label: 'Drinking',
    options: [
      { value: 'no', label: 'Sober' },
      { value: 'socially', label: 'Social drinkers' },
      { value: 'yes', label: 'Drinks welcome' },
    ],
  },
]

export const EMPTY_BOUNDARIES = {
  playStyle: null,
  roomPreference: null,
  openTo: null,
  smoking: null,
  drinking: null,
  boundariesText: '',
}

export function boundaryLabel(key, value) {
  const field = BOUNDARY_FIELDS.find((f) => f.key === key)
  return field?.options.find((o) => o.value === value)?.label ?? null
}

export function hasAnyBoundary(boundaries) {
  if (!boundaries) return false
  return (
    BOUNDARY_FIELDS.some((f) => boundaries[f.key]) ||
    (boundaries.boundariesText ?? '').trim().length > 0
  )
}
