import { NavLink, Outlet } from 'react-router-dom'
import { useUnreadMessages } from '../features/messages/useUnreadMessages'
import { Logo } from './Logo'

const TABS = [
  { to: '/', label: 'Feed', icon: HomeIcon, end: true },
  { to: '/discover', label: 'Discover', icon: CompassIcon },
  { to: '/compose', label: 'Post', icon: PlusIcon, accent: true },
  { to: '/messages', label: 'Messages', icon: ChatIcon, dot: 'messages' },
  { to: '/events', label: 'Events', icon: CalendarIcon },
  { to: '/profile', label: 'Profile', icon: UserIcon },
]

/** Mobile: bottom tab bar. Desktop (md+): left sidebar. */
export function AppShell() {
  const unreadMessages = useUnreadMessages()
  const dots = { messages: unreadMessages }

  return (
    <div className="min-h-dvh bg-charcoal-950 md:flex">
      <aside className="hidden md:flex md:w-60 md:flex-col md:gap-1 md:border-r md:border-charcoal-800 md:p-4">
        <Logo className="mb-6 px-2" />
        {TABS.map((tab) => (
          <SidebarLink key={tab.to} {...tab} showDot={dots[tab.dot]} />
        ))}
      </aside>

      <main className="mx-auto w-full max-w-xl flex-1 pb-20 md:pb-6">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-charcoal-800 bg-charcoal-900/95 backdrop-blur md:hidden">
        <div className="mx-auto flex h-16 max-w-xl items-stretch justify-around pb-[env(safe-area-inset-bottom)]">
          {TABS.map((tab) => (
            <TabLink key={tab.to} {...tab} showDot={dots[tab.dot]} />
          ))}
        </div>
      </nav>
    </div>
  )
}

function TabLink({ to, label, icon: Icon, accent, end, showDot }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition ${
          accent
            ? 'text-gold-500'
            : isActive
              ? 'text-gold-400'
              : 'text-charcoal-400 hover:text-charcoal-200'
        }`
      }
    >
      <span className="relative">
        <Icon className={accent ? 'h-7 w-7' : 'h-6 w-6'} />
        {showDot && (
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-gold-400" />
        )}
      </span>
      {label}
    </NavLink>
  )
}

function SidebarLink({ to, label, icon: Icon, end, showDot }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        `flex h-11 items-center gap-3 rounded-2xl px-3 text-sm font-medium transition ${
          isActive
            ? 'bg-charcoal-800 text-gold-400'
            : 'text-charcoal-300 hover:bg-charcoal-900 hover:text-charcoal-100'
        }`
      }
    >
      <span className="relative">
        <Icon className="h-5 w-5" />
        {showDot && (
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-gold-400" />
        )}
      </span>
      {label}
    </NavLink>
  )
}

function HomeIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M3 10.5 12 3l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 9.5V21h14V9.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function CompassIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5z" strokeLinejoin="round" />
    </svg>
  )
}
function PlusIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" strokeLinecap="round" />
    </svg>
  )
}
function ChatIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M21 12a8 8 0 0 1-8 8H4l1.5-3A8 8 0 1 1 21 12z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
function CalendarIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M3 10h18M8 3v4M16 3v4" strokeLinecap="round" />
    </svg>
  )
}
function UserIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" strokeLinecap="round" />
    </svg>
  )
}
