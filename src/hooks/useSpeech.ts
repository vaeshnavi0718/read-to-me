import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Reads a list of sentences one utterance at a time, so we always know which
 * sentence is being spoken and can jump anywhere. Each run gets an id; stale
 * callbacks from cancelled utterances compare ids and do nothing.
 */
export function useSpeech(sentences: string[], voice: SpeechSynthesisVoice | null, rate: number) {
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const runId = useRef(0)
  const utterance = useRef<SpeechSynthesisUtterance | null>(null) // held so Chrome doesn't GC it mid-speech
  const latest = useRef({ index, playing })
  latest.current = { index, playing }

  const speakFrom = useRef<(i: number) => void>(() => {})
  speakFrom.current = (i: number) => {
    const id = ++runId.current
    const busy = speechSynthesis.speaking || speechSynthesis.pending
    if (busy) speechSynthesis.cancel()

    if (i >= sentences.length) {
      setPlaying(false)
      setIndex(0)
      return
    }
    setIndex(i)
    setPlaying(true)

    const u = new SpeechSynthesisUtterance(sentences[i])
    if (voice) {
      u.voice = voice
      u.lang = voice.lang
    }
    u.rate = rate
    u.onend = () => {
      if (runId.current === id) speakFrom.current(i + 1)
    }
    u.onerror = (e) => {
      if (runId.current !== id || e.error === 'interrupted' || e.error === 'canceled') return
      console.warn('[read-aloud] speech error:', e.error)
      setPlaying(false)
    }
    utterance.current = u
    // Chrome occasionally drops a speak() issued in the same tick as cancel().
    if (busy) setTimeout(() => runId.current === id && speechSynthesis.speak(u), 60)
    else speechSynthesis.speak(u)
  }

  const stop = useCallback(() => {
    runId.current++
    speechSynthesis.cancel()
    setPlaying(false)
  }, [])

  const play = useCallback(() => speakFrom.current(latest.current.index), [])
  const toggle = useCallback(() => (latest.current.playing ? stop() : play()), [play, stop])

  const jump = useCallback(
    (i: number) => {
      const target = Math.max(0, Math.min(i, sentences.length - 1))
      if (latest.current.playing) speakFrom.current(target)
      else setIndex(target)
    },
    [sentences.length],
  )

  // New document: start from the top, silently.
  useEffect(() => {
    stop()
    setIndex(0)
  }, [sentences, stop])

  // Voice or speed changed mid-read: restart the current sentence with the new settings.
  // Keyed on voiceURI because Chrome hands out fresh voice objects on every voiceschanged event.
  useEffect(() => {
    if (latest.current.playing) speakFrom.current(latest.current.index)
  }, [voice?.voiceURI, rate])

  useEffect(() => () => void speechSynthesis.cancel(), [])

  return { index, playing, play, stop, toggle, jump }
}
