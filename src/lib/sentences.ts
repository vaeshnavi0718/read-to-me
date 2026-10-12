import type { Paragraph, Sentence } from '../types'

// Keep each utterance short: Chrome cuts off long ones, and shorter chunks
// make highlighting and skipping feel precise.
const MAX = 220

const segmenter = new Intl.Segmenter(undefined, { granularity: 'sentence' })

function packWords(text: string): string[] {
  const out: string[] = []
  let cur = ''
  for (const word of text.split(' ')) {
    if (cur && cur.length + word.length + 1 > MAX) {
      out.push(cur)
      cur = word
    } else {
      cur = cur ? `${cur} ${word}` : word
    }
  }
  if (cur) out.push(cur)
  return out
}

function splitLong(sentence: string): string[] {
  if (sentence.length <= MAX) return [sentence]
  const out: string[] = []
  let cur = ''
  for (const part of sentence.split(/(?<=[,;:—–])\s+/)) {
    if (cur && cur.length + part.length + 1 > MAX) {
      out.push(cur)
      cur = part
    } else {
      cur = cur ? `${cur} ${part}` : part
    }
  }
  if (cur) out.push(cur)
  return out.flatMap((chunk) => (chunk.length <= MAX * 1.5 ? [chunk] : packWords(chunk)))
}

export function toSentences(paragraphs: Paragraph[]): Sentence[] {
  return paragraphs.flatMap((p, para) =>
    [...segmenter.segment(p.text)]
      .map((s) => s.segment.trim())
      .filter((s) => /[\p{L}\p{N}]/u.test(s))
      .flatMap(splitLong)
      .map((text) => ({ text, para })),
  )
}
