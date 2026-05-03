/**
 * MarkdownBlock — renders an AI assistant message as styled markdown.
 *
 * Mirrors src/screens/ai-chat/components/ChatMessageList.tsx → MarkdownBlock
 * from the production website, but tuned for the Bold Waves dark mobile theme.
 *
 * Supports:
 *   - paragraphs with proper spacing
 *   - bold / italic / strikethrough
 *   - bullet + numbered lists
 *   - inline code + fenced code blocks (with copy)
 *   - GitHub Flavored Markdown tables (overflow-scrolled)
 *   - links (open in new tab)
 *   - line breaks within a paragraph (`  \n`)
 */
import { useState, type ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

const ACCENT = 'var(--gl, #00C853)'
const BORDER = 'rgba(255,255,255,0.08)'

export function MarkdownBlock({ content }: { content: string }) {
  return (
    <div className="ai-md" style={{ fontSize: 'inherit', lineHeight: 1.55, wordBreak: 'break-word' }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Render paragraphs as <div>, not <p>. react-markdown v9 dropped
          // the `inline` prop on <code>, so block-style CodeBlock (a <div>)
          // can now end up inside a <p>, which React refuses to hydrate.
          // Using <div> for the paragraph wrapper avoids that entirely.
          p: ({ children }) => (
            <div style={{ margin: '0 0 8px', lineHeight: 1.55 }}>{children}</div>
          ),
          ul: ({ children }) => (
            <ul style={{ margin: '4px 0 8px', paddingLeft: 18 }}>{children}</ul>
          ),
          ol: ({ children }) => (
            <ol style={{ margin: '4px 0 8px', paddingLeft: 18 }}>{children}</ol>
          ),
          li: ({ children }) => (
            <li style={{ margin: '2px 0', lineHeight: 1.55 }}>{children}</li>
          ),
          strong: ({ children }) => (
            <strong style={{ fontWeight: 700, color: 'var(--text-strong, #fff)' }}>{children}</strong>
          ),
          em: ({ children }) => (
            <em style={{ fontStyle: 'italic', opacity: 0.95 }}>{children}</em>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: ACCENT, textDecoration: 'underline' }}
            >
              {children}
            </a>
          ),
          h1: ({ children }) => <H level={1}>{children}</H>,
          h2: ({ children }) => <H level={2}>{children}</H>,
          h3: ({ children }) => <H level={3}>{children}</H>,
          h4: ({ children }) => <H level={4}>{children}</H>,
          blockquote: ({ children }) => (
            <blockquote
              style={{
                margin: '4px 0 8px',
                paddingLeft: 10,
                borderLeft: `2px solid ${ACCENT}`,
                opacity: 0.85,
              }}
            >
              {children}
            </blockquote>
          ),
          hr: () => (
            <hr
              style={{
                border: 0,
                borderTop: `1px solid ${BORDER}`,
                margin: '8px 0',
              }}
            />
          ),
          code: (props: any) => {
            const { inline, className, children } = props
            const text = String(children).replace(/\n$/, '')
            // react-markdown v9 dropped `inline` — fall back to detecting
            // block code by either a fenced language class (```ts ...```)
            // or an actual newline in the content.
            const isBlock = inline === false || (inline === undefined && (
              (typeof className === 'string' && /^language-/.test(className)) ||
              text.includes('\n')
            ))
            if (!isBlock) {
              return (
                <code
                  style={{
                    padding: '1px 5px',
                    borderRadius: 4,
                    background: 'rgba(0,200,83,0.12)',
                    color: '#6EE7B7',
                    fontSize: '0.92em',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  }}
                >
                  {children}
                </code>
              )
            }
            return <CodeBlock text={text} />
          },
          table: ({ children }) => (
            <div style={{ overflowX: 'auto', margin: '4px 0 8px' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: '0.92em' }}>
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th
              style={{
                textAlign: 'left',
                padding: '5px 8px',
                borderBottom: `1px solid ${BORDER}`,
                fontWeight: 700,
                color: 'var(--text-strong, #fff)',
              }}
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td
              style={{
                padding: '5px 8px',
                borderBottom: `1px solid rgba(255,255,255,0.04)`,
              }}
            >
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

function H({ level, children }: { level: 1 | 2 | 3 | 4; children: ReactNode }) {
  const sizes = { 1: 15, 2: 13, 3: 12, 4: 11 } as const
  const style: React.CSSProperties = {
    fontSize: sizes[level],
    fontWeight: 800,
    margin: '8px 0 4px',
    color: 'var(--text-strong, #fff)',
  }
  if (level === 1) return <h1 style={style}>{children}</h1>
  if (level === 2) return <h2 style={style}>{children}</h2>
  if (level === 3) return <h3 style={style}>{children}</h3>
  return <h4 style={style}>{children}</h4>
}

function CodeBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* ignore */ }
  }
  return (
    <div
      style={{
        position: 'relative',
        background: 'rgba(0,0,0,0.35)',
        border: `1px solid ${BORDER}`,
        borderRadius: 8,
        padding: '8px 10px',
        margin: '4px 0 8px',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: '0.88em',
        overflowX: 'auto',
      }}
    >
      <button
        type="button"
        onClick={copy}
        style={{
          position: 'absolute',
          top: 4,
          right: 4,
          background: 'rgba(255,255,255,0.05)',
          border: `1px solid ${BORDER}`,
          color: ACCENT,
          fontSize: 11,
          padding: '2px 6px',
          borderRadius: 4,
          cursor: 'pointer',
          fontWeight: 700,
        }}
      >
        {copied ? '✓ Copied' : 'Copy'}
      </button>
      <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{text}</pre>
    </div>
  )
}
