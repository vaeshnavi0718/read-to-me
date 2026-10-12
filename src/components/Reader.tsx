import { useEffect, useMemo, useRef } from 'react'
import type { Doc, Sentence } from '../types'

interface Props {
  doc: Doc
  sentences: Sentence[]
  index: number
  playing: boolean
  onJump: (i: number) => void
}

export function Reader({ doc, sentences, index, playing, onJump }: Props) {
  const active = useRef<HTMLSpanElement>(null)

  const groups = useMemo(() => {
    const byPara = doc.paragraphs.map(() => [] as { text: string; i: number }[])
    sentences.forEach((s, i) => byPara[s.para].push({ text: s.text, i }))
    return byPara
  }, [doc, sentences])

  useEffect(() => {
    if (playing) active.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [index, playing])

  return (
    <article className="reader">
      <header>
        <h1>{doc.title}</h1>
        {doc.subtitle && <p className="meta">{doc.subtitle}</p>}
      </header>
      {doc.paragraphs.map((p, pi) => {
        const items = groups[pi]
        if (items.length === 0) return null
        const Tag = p.heading ? 'h2' : 'p'
        return (
          <Tag key={pi}>
            {items.map(({ text, i }) => (
              <span
                key={i}
                ref={i === index ? active : undefined}
                className={i === index ? 's current' : i < index ? 's read' : 's'}
                onClick={() => onJump(i)}
              >
                {text}{' '}
              </span>
            ))}
          </Tag>
        )
      })}
    </article>
  )
}
