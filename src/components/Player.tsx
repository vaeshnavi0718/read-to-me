import { useMemo, useState } from 'react'
import { voiceGroup, type VoiceGroup } from '../hooks/useVoices'

const SPEEDS = [0.75, 1, 1.25, 1.5, 2]
const GROUP_LABELS: Record<VoiceGroup, string> = {
  best: '✨ best sounding',
  standard: 'voices',
  silly: '🎈 silly voices',
}

interface Props {
  playing: boolean
  index: number
  total: number
  wordsLeft: number
  voices: SpeechSynthesisVoice[]
  voice: SpeechSynthesisVoice | null
  rate: number
  onToggle: () => void
  onJump: (i: number) => void
  onVoice: (uri: string) => void
  onRate: (rate: number) => void
}

const userLang = navigator.language.split('-')[0]

export function Player(props: Props) {
  const { playing, index, total, wordsLeft, voices, voice, rate } = props
  const [allLangs, setAllLangs] = useState(false)

  const grouped = useMemo(() => {
    const visible = voices.filter((v) => allLangs || v.lang.startsWith(userLang) || v === voice)
    const groups: Record<VoiceGroup, SpeechSynthesisVoice[]> = { best: [], standard: [], silly: [] }
    for (const v of visible) groups[voiceGroup(v)].push(v)
    for (const list of Object.values(groups)) list.sort((a, b) => a.name.localeCompare(b.name))
    return groups
  }, [voices, allLangs, voice])

  function preview() {
    if (!voice) return
    speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(`Hi! I'm ${voice.name.replace(/\s*\(.*\)$/, '')}. Want me to read to you?`)
    u.voice = voice
    u.lang = voice.lang
    u.rate = rate
    speechSynthesis.speak(u)
  }

  const minutes = Math.max(1, Math.round(wordsLeft / (165 * rate)))
  const progress = total ? ((index + (playing ? 0.5 : 0)) / total) * 100 : 0

  return (
    <div className="player">
      <div className="progress" aria-hidden>
        <div style={{ width: `${progress}%` }} />
      </div>

      <div className="player-row">
        <div className="voice">
          <select
            aria-label="Voice"
            value={voice?.voiceURI ?? ''}
            onChange={(e) => props.onVoice(e.target.value)}
          >
            {(Object.keys(grouped) as VoiceGroup[]).map((g) =>
              grouped[g].length ? (
                <optgroup key={g} label={GROUP_LABELS[g]}>
                  {grouped[g].map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>
                      {v.name}
                      {allLangs ? ` · ${v.lang}` : ''}
                    </option>
                  ))}
                </optgroup>
              ) : null,
            )}
          </select>
          <button className="icon-btn small" onClick={preview} disabled={playing} title="Hear this voice">
            👋
          </button>
          <label className="lang-toggle" title="Show voices for every language">
            <input type="checkbox" checked={allLangs} onChange={(e) => setAllLangs(e.target.checked)} />
            all languages
          </label>
        </div>

        <div className="transport">
          <button className="icon-btn" onClick={() => props.onJump(index - 1)} aria-label="Previous sentence">
            ⏮
          </button>
          <button className="play" onClick={props.onToggle} aria-label={playing ? 'Pause' : 'Play'}>
            {playing ? (
              <svg viewBox="0 0 24 24" width="22" height="22">
                <rect x="6" y="5" width="4" height="14" rx="1.5" fill="currentColor" />
                <rect x="14" y="5" width="4" height="14" rx="1.5" fill="currentColor" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="22" height="22">
                <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z" fill="currentColor" />
              </svg>
            )}
          </button>
          <button className="icon-btn" onClick={() => props.onJump(index + 1)} aria-label="Next sentence">
            ⏭
          </button>
        </div>

        <div className="speed">
          {SPEEDS.map((s) => (
            <button key={s} className={s === rate ? 'chip active' : 'chip'} onClick={() => props.onRate(s)}>
              {s}×
            </button>
          ))}
          <span className="time-left">~{minutes} min left</span>
        </div>
      </div>
    </div>
  )
}
