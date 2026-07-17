export function PagePlaceholder({ title, phase, description }) {
  return (
    <div className="flex flex-col items-center px-6 pt-24 text-center">
      <img src={`${import.meta.env.BASE_URL}pineapple.svg`} alt="" className="h-14 w-14 opacity-60" />
      <h1 className="mt-4 text-xl font-semibold text-charcoal-50">{title}</h1>
      <p className="mt-2 max-w-xs text-sm text-charcoal-400">{description}</p>
      <span className="mt-4 rounded-full bg-charcoal-800 px-3 py-1 text-xs font-medium text-gold-400">
        Coming in {phase}
      </span>
    </div>
  )
}
