export function Logo({ className = '' }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img src={`${import.meta.env.BASE_URL}pineapple.svg`} alt="" className="h-8 w-8" />
      <span className="text-2xl font-bold tracking-tight text-gold-400">
        The Swingset
      </span>
    </div>
  )
}
