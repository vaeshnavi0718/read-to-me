import * as pdfjs from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import type { Doc, Paragraph } from '../types'

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

// PDFs only give us visual lines. A line that ends a sentence and is noticeably
// shorter than a full line is very likely the end of a paragraph.
function linesToParagraphs(lines: string[]): Paragraph[] {
  const trimmed = lines.map((l) => l.replace(/\s+/g, ' ').trim())
  const fullWidth = Math.max(0, ...trimmed.map((l) => l.length))
  const paragraphs: Paragraph[] = []
  let cur = ''

  const flush = () => {
    if (cur && !/^\d+$/.test(cur)) paragraphs.push({ heading: false, text: cur })
    cur = ''
  }

  for (const line of trimmed) {
    if (!line) {
      flush()
      continue
    }
    if (cur.endsWith('-') && /^[a-z]/.test(line)) cur = cur.slice(0, -1) + line
    else cur = cur ? `${cur} ${line}` : line
    if (/[.!?:"”')]$/.test(line) && line.length < fullWidth * 0.75) flush()
  }
  flush()
  return paragraphs
}

export async function readPdf(data: ArrayBuffer, fallbackTitle: string): Promise<Doc> {
  const pdf = await pdfjs.getDocument({ data }).promise
  const meta = await pdf.getMetadata().catch(() => null)
  const paragraphs: Paragraph[] = []

  for (let n = 1; n <= pdf.numPages; n++) {
    const page = await pdf.getPage(n)
    const content = await page.getTextContent()
    const lines: string[] = []
    let line = ''
    for (const item of content.items) {
      if (!('str' in item)) continue
      line += item.str
      if (item.hasEOL) {
        lines.push(line)
        line = ''
      }
    }
    if (line) lines.push(line)
    paragraphs.push(...linesToParagraphs(lines))
  }

  if (paragraphs.length === 0) {
    throw new Error("This PDF has no readable text — it might be a scanned image.")
  }

  const metaTitle = (meta?.info as { Title?: unknown } | undefined)?.Title
  const title = typeof metaTitle === 'string' && metaTitle.trim() ? metaTitle.trim() : fallbackTitle
  return { title, subtitle: `${pdf.numPages} page${pdf.numPages === 1 ? '' : 's'} · PDF`, paragraphs }
}
