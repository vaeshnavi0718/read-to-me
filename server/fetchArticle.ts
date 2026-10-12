import type { IncomingMessage, ServerResponse } from 'node:http'
import { JSDOM, VirtualConsole } from 'jsdom'
import { Readability } from '@mozilla/readability'

const BLOCKS = 'h1,h2,h3,h4,h5,h6,p,li,blockquote,pre,figcaption'

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
}

const clean = (s: string | null | undefined) => (s ?? '').replace(/\s+/g, ' ').trim()

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

export async function handleFetch(req: IncomingMessage, res: ServerResponse) {
  const raw = new URL(req.url ?? '', 'http://localhost').searchParams.get('url') ?? ''
  let url: URL
  try {
    url = new URL(raw)
    if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error()
  } catch {
    return sendJson(res, 400, { error: "That doesn't look like a valid link." })
  }

  try {
    const upstream = await fetch(url, { headers: HEADERS, redirect: 'follow', signal: AbortSignal.timeout(20_000) })
    if (!upstream.ok) {
      return sendJson(res, 502, { error: `The site said no (error ${upstream.status}). It may block automated readers.` })
    }

    const type = upstream.headers.get('content-type') ?? ''
    if (type.includes('pdf') || url.pathname.toLowerCase().endsWith('.pdf')) {
      // Hand PDFs back as-is; the browser parses them the same way as uploads.
      res.statusCode = 200
      res.setHeader('Content-Type', 'application/pdf')
      res.end(Buffer.from(await upstream.arrayBuffer()))
      return
    }

    const dom = new JSDOM(await upstream.text(), { url: upstream.url, virtualConsole: new VirtualConsole() })
    const article = new Readability(dom.window.document).parse()
    if (!article?.content) {
      return sendJson(res, 422, { error: "Couldn't find an article on that page." })
    }

    // Keep only top-level text blocks so nested ones (a <p> inside an <li>) aren't read twice.
    const body = new JSDOM(article.content).window.document
    let paragraphs = [...body.querySelectorAll(BLOCKS)]
      .filter((el) => !el.parentElement?.closest(BLOCKS))
      .map((el) => ({ heading: /^H\d$/.test(el.tagName), text: clean(el.textContent) }))
      .filter((p) => p.text)

    if (paragraphs.length === 0) {
      paragraphs = (article.textContent ?? '')
        .split(/\n\s*\n/)
        .map(clean)
        .filter(Boolean)
        .map((text) => ({ heading: false, text }))
    }

    sendJson(res, 200, {
      title: clean(article.title) || url.hostname,
      subtitle: [clean(article.byline), clean(article.siteName) || url.hostname].filter(Boolean).join(' · '),
      paragraphs,
    })
  } catch (err) {
    const timedOut = err instanceof Error && err.name === 'TimeoutError'
    sendJson(res, 502, { error: timedOut ? 'That page took too long to load.' : "Couldn't reach that page." })
  }
}
