import type { Doc } from '../types'
import { readPdf } from './pdf'

const stripPdf = (name: string) => name.replace(/\.pdf$/i, '')

export async function loadFile(file: File): Promise<Doc> {
  if (file.type !== 'application/pdf' && !/\.pdf$/i.test(file.name)) {
    throw new Error('Please choose a PDF file.')
  }
  return readPdf(await file.arrayBuffer(), stripPdf(file.name))
}

export async function loadLink(input: string): Promise<Doc> {
  const link = /^https?:\/\//i.test(input.trim()) ? input.trim() : `https://${input.trim()}`
  const res = await fetch(`/api/fetch?url=${encodeURIComponent(link)}`)

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null
    throw new Error(body?.error ?? 'Something went wrong fetching that link.')
  }
  if (res.headers.get('content-type')?.includes('application/pdf')) {
    const name = decodeURIComponent(new URL(link).pathname.split('/').pop() || 'Document')
    return readPdf(await res.arrayBuffer(), stripPdf(name))
  }
  return (await res.json()) as Doc
}
