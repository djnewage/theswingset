import { Component } from 'react'

export class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error:', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-charcoal-950 px-6 text-center">
        <img src={`${import.meta.env.BASE_URL}pineapple.svg`} alt="" className="h-14 w-14 opacity-60" />
        <h1 className="mt-4 text-xl font-semibold text-charcoal-50">
          Something went sideways
        </h1>
        <p className="mt-2 max-w-xs text-sm text-charcoal-400">
          An unexpected error occurred. Reloading usually fixes it.
        </p>
        <button
          onClick={() => window.location.assign('/')}
          className="mt-6 h-11 rounded-2xl bg-gold-500 px-6 font-semibold text-charcoal-950 hover:bg-gold-400"
        >
          Reload
        </button>
      </div>
    )
  }
}
