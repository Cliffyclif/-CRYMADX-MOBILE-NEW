/**
 * ErrorBoundary — catches render-time and lazy-chunk-load errors so a single
 * failure shows a readable screen instead of a blank, unrecoverable WebView.
 *
 * Why this exists: every screen is a React.lazy() chunk. If a chunk fails to
 * load (transient WebView fetch hiccup, stale cache after an app update) or a
 * screen throws while rendering, React unmounts the whole tree — with no
 * boundary that's a white screen and the app appears dead. This boundary
 * keeps the app alive: it shows the error text (so it can actually be
 * diagnosed) and a Reload button.
 *
 * Chunk-load errors are detected and offered a one-tap reload, which re-fetches
 * the chunk fresh.
 */
import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

/** True when the error looks like a failed dynamic import / chunk fetch. */
function isChunkLoadError(err: Error | null): boolean {
  if (!err) return false
  const msg = `${err.name} ${err.message}`.toLowerCase()
  return (
    msg.includes('dynamically imported module') ||
    msg.includes('failed to fetch') ||
    msg.includes('loading chunk') ||
    msg.includes('loading css chunk') ||
    msg.includes('importing a module script failed')
  )
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Keep a record in the JS console for remote debugging / logcat.
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  private reload = () => {
    // Full reload re-fetches the app shell + chunks from scratch.
    try {
      window.location.reload()
    } catch {
      /* ignore */
    }
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    const chunk = isChunkLoadError(error)

    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: '#060d09',
          color: '#e8ece9',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 24px',
          fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif",
          textAlign: 'center',
          overflowY: 'auto',
        }}
        role="alert"
      >
        <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>
          {chunk ? 'Could not finish loading' : 'Something went wrong'}
        </h1>
        <p style={{ fontSize: 13, color: '#9aa39c', margin: '0 0 20px', maxWidth: 320, lineHeight: 1.5 }}>
          {chunk
            ? 'Part of the app failed to load. Reloading usually fixes it.'
            : 'The screen hit an unexpected error. Reloading should recover it.'}
        </p>

        <button
          type="button"
          onClick={this.reload}
          style={{
            background: '#3ddc84',
            color: '#04210f',
            border: 'none',
            borderRadius: 12,
            padding: '13px 28px',
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            minHeight: 44,
          }}
        >
          Reload
        </button>

        {/* Error detail — visible on purpose so a tester can read/screenshot it. */}
        <pre
          style={{
            marginTop: 24,
            maxWidth: '100%',
            maxHeight: 180,
            overflow: 'auto',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
            padding: '10px 12px',
            fontSize: 11,
            color: '#c0716b',
            textAlign: 'left',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {error.name}: {error.message}
        </pre>
      </div>
    )
  }
}

export default ErrorBoundary
