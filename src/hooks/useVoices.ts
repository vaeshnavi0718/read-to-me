import { useEffect, useState } from 'react'

// macOS novelty voices — kept, but tucked into their own group.
const SILLY = new Set([
  'Albert', 'Bad News', 'Bahh', 'Bells', 'Boing', 'Bubbles', 'Cellos', 'Deranged', 'Good News',
  'Hysterical', 'Jester', 'Organ', 'Superstar', 'Trinoids', 'Whisper', 'Wobble', 'Zarvox',
  'Fred', 'Junior', 'Kathy', 'Ralph', 'Pipe Organ',
])

export type VoiceGroup = 'best' | 'standard' | 'silly'

export function voiceGroup(v: SpeechSynthesisVoice): VoiceGroup {
  const base = v.name.replace(/\s*\(.*\)$/, '')
  if (SILLY.has(base)) return 'silly'
  if (/premium|enhanced|natural|neural|google/i.test(v.name)) return 'best'
  return 'standard'
}

export function useVoices() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>(() =>
    'speechSynthesis' in window ? speechSynthesis.getVoices() : [],
  )

  useEffect(() => {
    if (!('speechSynthesis' in window)) return
    const update = () => setVoices(speechSynthesis.getVoices())
    update()
    speechSynthesis.addEventListener('voiceschanged', update)
    return () => speechSynthesis.removeEventListener('voiceschanged', update)
  }, [])

  return voices
}
