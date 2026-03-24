import { useState, useEffect, useRef } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { BUNDESLAENDER } from '../data/bundeslaender'
import { useIdentity } from '../hooks/useIdentity'

function getQuantileTier(count: number, sortedCounts: number[]): number {
  const n = sortedCounts.length
  if (n === 0) return 1
  const rank = sortedCounts.filter(c => c <= count).length
  return Math.max(1, Math.min(5, Math.ceil((rank / n) * 5)))
}

function loadCooldownUntil(): number {
  return Number(localStorage.getItem('biber_cooldown_until') ?? 0)
}

function saveCooldownUntil(unlockMs: number) {
  localStorage.setItem('biber_cooldown_until', String(unlockMs))
}

function formatCountdown(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m ${s}s`
  return `${s}s`
}

interface GermanyMapProps {
  year: number
  counts: Map<string, number>
  onCountsChange: (updater: (prev: Map<string, number>) => Map<string, number>) => void
}

export default function GermanyMap({ year: _year, counts, onCountsChange }: GermanyMapProps) {
  const [hovered, setHovered] = useState<string | null>(null)
  const [touchSelected, setTouchSelected] = useState<string | null>(null)
  const [cooldownUntil, setCooldownUntil] = useState<number>(loadCooldownUntil)
  const [now, setNow] = useState(Date.now())
  const { browserId, nickname, setNickname } = useIdentity()
  const [nicknameInput, setNicknameInput] = useState(nickname)
  const [showNicknamePrompt, setShowNicknamePrompt] = useState(false)
  const nicknameRef = useRef<HTMLInputElement>(null)
  const latestPointerType = useRef('mouse')

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  function getGlobalCooldownSeconds(): number {
    return Math.max(0, Math.ceil((cooldownUntil - now) / 1000))
  }

  function handleRegionInteraction(e: React.PointerEvent | React.MouseEvent, code: string) {
    const pointerType = 'pointerType' in e ? (e as React.PointerEvent).pointerType : latestPointerType.current
    if (pointerType === 'touch') {
      if (touchSelected === code) {
        setTouchSelected(null)
        handleClick(code)
      } else {
        setTouchSelected(code)
      }
      return
    }
    handleClick(code)
  }

  async function handleClick(code: string) {
    if (!nickname.trim()) {
      setShowNicknamePrompt(true)
      setTimeout(() => nicknameRef.current?.focus(), 50)
      return
    }

    if (getGlobalCooldownSeconds() > 0) return

    // Optimistic update
    onCountsChange(prev => {
      const next = new Map(prev)
      next.set(code, (next.get(code) ?? 0) + 1)
      return next
    })

    try {
      const res = await fetch('/api/sightings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bundesland: code, nickname: nickname.trim(), browser_id: browserId }),
      })

      if (res.status === 429) {
        // Revert optimistic update
        onCountsChange(prev => {
          const next = new Map(prev)
          next.set(code, Math.max(0, (next.get(code) ?? 1) - 1))
          return next
        })
        const data = await res.json() as { retry_after_seconds: number }
        const unlockMs = Date.now() + data.retry_after_seconds * 1000
        setCooldownUntil(unlockMs)
        saveCooldownUntil(unlockMs)
      } else if (!res.ok) {
        // Revert optimistic update
        onCountsChange(prev => {
          const next = new Map(prev)
          next.set(code, Math.max(0, (next.get(code) ?? 1) - 1))
          return next
        })
      } else {
        // Success — block entire map for 3 hours
        const unlockMs = Date.now() + 3 * 60 * 60 * 1000
        setCooldownUntil(unlockMs)
        saveCooldownUntil(unlockMs)
      }
    } catch {
      // Network error — revert optimistic update
      onCountsChange(prev => {
        const next = new Map(prev)
        next.set(code, Math.max(0, (next.get(code) ?? 1) - 1))
        return next
      })
    }
  }

  function handleNicknameSave() {
    const trimmed = nicknameInput.trim()
    if (trimmed) {
      setNickname(trimmed)
      setShowNicknamePrompt(false)
    }
  }

  const sortedNonZero = Array.from(counts.values())
    .filter(c => c > 0)
    .sort((a, b) => a - b)

  const globalCooldownSeconds = getGlobalCooldownSeconds()

  function getFill(code: string): string {
    if (globalCooldownSeconds > 0) return 'var(--color-land-cooldown)'
    if (code === touchSelected || code === hovered) return 'var(--color-land-hover)'
    const count = counts.get(code) ?? 0
    if (count === 0) return 'var(--color-land-default)'
    const tier = getQuantileTier(count, sortedNonZero)
    return `var(--color-land-${tier})`
  }

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Nickname bar */}
      <div className="flex items-center gap-2 mb-3 text-sm">
        {nickname && !showNicknamePrompt ? (
          <>
            <span className="text-gray-500 dark:text-gray-400">Gemeldet als</span>
            <span className="font-medium text-gray-800 dark:text-gray-200">{nickname}</span>
            <button
              onClick={() => { setNicknameInput(nickname); setShowNicknamePrompt(true) }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 underline"
            >
              ändern
            </button>
          </>
        ) : (
          <>
            <label htmlFor="nickname-input" className="text-gray-500 dark:text-gray-400 shrink-0">
              Dein Name:
            </label>
            <input
              id="nickname-input"
              ref={nicknameRef}
              type="text"
              value={nicknameInput}
              onChange={e => setNicknameInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleNicknameSave()}
              placeholder="Spitzname eingeben…"
              maxLength={40}
              className="border border-gray-300 dark:border-gray-600 rounded px-2 py-0.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 flex-1 min-w-0"
            />
            <button
              onClick={handleNicknameSave}
              disabled={!nicknameInput.trim()}
              className="px-2 py-0.5 rounded bg-green-600 text-white text-sm disabled:opacity-40 hover:bg-green-700"
            >
              Speichern
            </button>
          </>
        )}
      </div>

      <Tooltip.Provider delayDuration={100}>
        <svg
          viewBox="0 0 500 600"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto block"
          aria-label="Karte der deutschen Bundesländer"
          role="img"
        >
          {BUNDESLAENDER.map(({ code, name, d }) => {
            const count = counts.get(code) ?? 0
            const isTooltipOpen = touchSelected === code || hovered === code
            return (
              <Tooltip.Root
                key={code}
                open={isTooltipOpen}
                onOpenChange={(open) => {
                  if (!open) {
                    if (hovered === code) setHovered(null)
                    if (touchSelected === code) setTouchSelected(null)
                  }
                }}
              >
                <Tooltip.Trigger asChild>
                  <g
                    onPointerEnter={(e) => { if (e.pointerType !== 'touch') setHovered(code) }}
                    onPointerLeave={(e) => { if (e.pointerType !== 'touch') setHovered(null) }}
                    onPointerDown={(e) => { latestPointerType.current = e.pointerType }}
                    onClick={(e) => handleRegionInteraction(e, code)}
                    style={{ cursor: globalCooldownSeconds > 0 ? 'not-allowed' : 'pointer' }}
                  >
                    <path
                      data-land={code}
                      aria-label={name}
                      d={d}
                      style={{
                        fill: getFill(code),
                        stroke: 'var(--color-land-stroke)',
                        strokeWidth: 1,
                      }}
                    />
                  </g>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content
                    className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm px-3 py-1.5 rounded shadow-md border border-gray-200 dark:border-gray-700 z-50"
                    sideOffset={5}
                  >
                    <span className="font-medium">{name}</span>
                    <span className="text-gray-500 dark:text-gray-400 ml-2">
                      {count} {count === 1 ? 'Sichtung' : 'Sichtungen'}
                    </span>
                    {globalCooldownSeconds > 0 && (
                      <span className="block text-red-500 text-xs mt-0.5">
                        Wieder in {formatCountdown(globalCooldownSeconds)}
                      </span>
                    )}
                    <Tooltip.Arrow className="fill-white dark:fill-gray-800" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            )
          })}
        </svg>
      </Tooltip.Provider>
    </div>
  )
}
