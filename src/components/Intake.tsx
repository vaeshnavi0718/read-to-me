import { useRef, useState, type DragEvent, type FormEvent } from 'react'
import { loadFile, loadLink } from '../lib/load'
import type { Doc } from '../types'

type Mode = 'pdf' | 'link'

export function Intake({ onLoad }: { onLoad: (doc: Doc) => void }) {
  const [mode, setMode] = useState<Mode>('pdf')
  const [link, setLink] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  async function run(task: () => Promise<Doc>) {
    setBusy(true)
    setError(null)
    try {
      onLoad(await task())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  const onFile = (file: File | undefined) => file && run(() => loadFile(file))

  function onDrop(e: DragEvent) {
    e.preventDefault()
    setDragging(false)
    onFile(e.dataTransfer.files[0])
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (link.trim()) run(() => loadLink(link))
  }

  return (
    <div className="intake">
      <div className="mascot" aria-hidden>
        <span>☁️</span>
      </div>
      <h1>read to me</h1>
      <p className="lede">drop in a pdf or paste a link, sit back, and listen.</p>

      <div className="card">
        <div className="tabs" role="tablist">
          {(['pdf', 'link'] as const).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              className={mode === m ? 'tab active' : 'tab'}
              onClick={() => {
                setMode(m)
                setError(null)
              }}
            >
              {m === 'pdf' ? '📄 pdf' : '🔗 link'}
            </button>
          ))}
        </div>

        {busy ? (
          <div className="loading">
            <span className="dots" aria-hidden>
              <i />
              <i />
              <i />
            </span>
            <p>{mode === 'pdf' ? 'reading your pdf…' : 'fetching the article…'}</p>
          </div>
        ) : mode === 'pdf' ? (
          <button
            className={dragging ? 'drop dragging' : 'drop'}
            onClick={() => fileInput.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <span className="drop-icon" aria-hidden>
              ⇪
            </span>
            <span className="drop-title">drop a pdf here</span>
            <span className="drop-hint">or click to choose one</span>
            <input
              ref={fileInput}
              type="file"
              accept="application/pdf,.pdf"
              hidden
              onChange={(e) => {
                onFile(e.target.files?.[0])
                e.target.value = ''
              }}
            />
          </button>
        ) : (
          <form className="link-form" onSubmit={onSubmit}>
            <input
              type="text"
              inputMode="url"
              placeholder="https://…"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              autoFocus
            />
            <button className="btn primary" type="submit" disabled={!link.trim()}>
              read it
            </button>
          </form>
        )}

        {error && <p className="error">{error}</p>}
      </div>
    </div>
  )
}
