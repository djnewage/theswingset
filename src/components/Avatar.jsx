export function Avatar({ src, name, className = 'h-12 w-12 text-lg' }) {
  if (src) {
    return (
      <img
        src={src}
        alt={name ?? ''}
        className={`rounded-full object-cover ${className}`}
      />
    )
  }
  return (
    <div
      className={`flex items-center justify-center rounded-full bg-gold-500 font-bold text-charcoal-950 ${className}`}
    >
      {(name ?? '?').slice(0, 1).toUpperCase()}
    </div>
  )
}
