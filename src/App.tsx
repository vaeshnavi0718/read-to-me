import { useEffect, useMemo, useState } from 'react'
import { Intake } from './components/Intake'
import { Player } from './components/Player'
import { Reader } from './components/Reader'
import { useSpeech } from './hooks/useSpeech'
import { useVoices, voiceGroup } from './hooks/useVoices'
import { toSentences } from './lib/sentences'
import * as storage from './lib/storage'
import type { Doc, Sentence } from './types'

const NO_SENTENCES: Sentence[] = []
const supported = 'speechSynthesis' in window

export default function App() {
  const [doc, setDoc] = useState<Doc | null>(null)
  const [voiceURI, setVoiceURI] = useState(() => storage.load('voice'))
  const [rate, setRate] = useState(() => Number(storage.load('rate')) || 1)
  const voices = useVoices()

  const sentences = useMemo(() => (doc ? toSentences(doc.paragraphs) : NO_SENTENCES), [doc])
  const texts = useMemo(() => sentences.map((s) => s.text), [sentences])

  const voice = useMemo(() => {
    const saved = voices.find((v) => v.voiceURI === voiceURI)
    if (saved) return saved
    const lang = navigator.language.split('-')[0]
    const local = voices.filter((v) => v.lang.startsWith(lang))
    return (
      local.find((v) => voiceGroup(v) === 'best') ??
      local.find((v) => v.default) ??
      local.find((v) => voiceGroup(v) === 'standard') ??
      voices[0] ??
      null
    )
  }, [voices, voiceURI])

  const speech = useSpeech(texts, voice, rate)

  const wordsLeft = useMemo(
    () => sentences.slice(speech.index).reduce((n, s) => n + s.text.split(' ').length, 0),
    [sentences, speech.index],
  )

  // Space to play/pause, arrows to skip — unless you're typing somewhere.
  useEffect(() => {
    if (!doc) return
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (el.closest('input, select, textarea, button')) return
      if (e.key === ' ') speech.toggle()
      else if (e.key === 'ArrowRight') speech.jump(speech.index + 1)
      else if (e.key === 'ArrowLeft') speech.jump(speech.index - 1)
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [doc, speech])

  if (!supported) {
    return (
      <main className="center">
        <p className="error">Sorry — this browser can't speak. Try Chrome, Safari, or Edge.</p>
      </main>
    )
  }

  if (!doc) {
    return (
      <main className="center">
        <Intake onLoad={setDoc} />
      </main>
    )
  }

  return (
    <main className="reading">
      <nav className="topbar">
        <button
          className="btn ghost"
          onClick={() => {
            speech.stop()
            setDoc(null)
          }}
        >
          ← something new
        </button>
        <span className="brand">☁️ read to me</span>
      </nav>

      <Reader doc={doc} sentences={sentences} index={speech.index} playing={speech.playing} onJump={speech.jump} />

      <Player
        playing={speech.playing}
        index={speech.index}
        total={sentences.length}
        wordsLeft={wordsLeft}
        voices={voices}
        voice={voice}
        rate={rate}
        onToggle={speech.toggle}
        onJump={speech.jump}
        onVoice={(uri) => {
          setVoiceURI(uri)
          storage.save('voice', uri)
        }}
        onRate={(r) => {
          setRate(r)
          storage.save('rate', String(r))
        }}
      />
    </main>
  )
}
