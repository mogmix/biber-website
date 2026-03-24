import * as Tooltip from '@radix-ui/react-tooltip'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BUNDESLAENDER } from '../data/bundeslaender'
import { useIdentity } from '../hooks/useIdentity'

function getQuantileTier(count: number, sortedCounts: number[]): number {
  const n = sortedCounts.length
  if (n === 0) return 1
  const rank = sortedCounts.filter(c => c <= count).length
  return Math.max(1, Math.min(5, Math.ceil((rank / n) * 5)))
}

function loadCooldownUntil(): number {
  try {
    return Number(localStorage.getItem('biber_cooldown_until') ?? 0)
  } catch {
    return 0
  }
}

function saveCooldownUntil(unlockMs: number) {
  try {
    localStorage.setItem('biber_cooldown_until', String(unlockMs))
  } catch {
    // Private browsing or storage quota exceeded — cooldown won't persist
  }
}

function formatCountdown(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h} h ${m} min`
  if (m > 0) return `${m} min ${s} s`
  return `${s} s`
}

interface GermanyMapProps {
  year: number
  counts: Map<string, number>
  onCountsChange: (updater: (prev: Map<string, number>) => Map<string, number>) => void
  isLoading?: boolean
}

export default function GermanyMap({ year: _year, counts, onCountsChange, isLoading = false }: GermanyMapProps) {
  const [hovered, setHovered] = useState<string | null>(null)
  const [focused, setFocused] = useState<string | null>(null)
  const [touchSelected, setTouchSelected] = useState<string | null>(null)
  const [cooldownUntil, setCooldownUntil] = useState<number>(loadCooldownUntil)
  const [flashCode, setFlashCode] = useState<string | null>(null)
  const [toastLand, setToastLand] = useState<{ name: string; key: number } | null>(null)
  const toastCounterRef = useRef(0)
  const [now, setNow] = useState(Date.now())
  const { browserId } = useIdentity()
  const latestPointerType = useRef('mouse')
  const submittingRef = useRef(false)

  // Only tick while cooldown is active — stops wasting CPU when idle
  useEffect(() => {
    if (cooldownUntil <= Date.now()) return
    const id = setInterval(() => {
      const t = Date.now()
      setNow(t)
      if (t >= cooldownUntil) clearInterval(id)
    }, 1000)
    return () => clearInterval(id)
  }, [cooldownUntil])

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

  const handleClick = useCallback(async (code: string) => {
    if (Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000)) > 0) return
    if (submittingRef.current) return
    submittingRef.current = true

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
        body: JSON.stringify({ bundesland: code, browser_id: browserId }),
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
        // Success — block entire map for 15 minutes
        const unlockMs = Date.now() + 60 * 15 * 1000
        setCooldownUntil(unlockMs)
        saveCooldownUntil(unlockMs)
        // Delight: flash the region and show a toast
        const landName = BUNDESLAENDER.find(b => b.code === code)?.name ?? code
        setFlashCode(code)
        setToastLand({ name: landName, key: ++toastCounterRef.current })
        setTimeout(() => setFlashCode(null), 120)
        setTimeout(() => setToastLand(null), 2800)
      }
    } catch {
      // Network error — revert optimistic update
      onCountsChange(prev => {
        const next = new Map(prev)
        next.set(code, Math.max(0, (next.get(code) ?? 1) - 1))
        return next
      })
    } finally {
      submittingRef.current = false
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [browserId, onCountsChange])

  const sortedNonZero = useMemo(
    () => Array.from(counts.values()).filter(c => c > 0).sort((a, b) => a - b),
    [counts]
  )

  const globalCooldownSeconds = useMemo(
    () => Math.max(0, Math.ceil((cooldownUntil - now) / 1000)),
    [cooldownUntil, now]
  )

  function getFill(code: string): string {
    if (flashCode === code) return '#5eead4'
    const isActive = code === touchSelected || code === hovered
    if (isActive) return globalCooldownSeconds > 0 ? 'var(--color-land-cooldown)' : 'var(--color-land-hover)'
    const count = counts.get(code) ?? 0
    if (count === 0) return 'var(--color-land-default)'
    const tier = getQuantileTier(count, sortedNonZero)
    return `var(--color-land-${tier})`
  }

  if (isLoading) {
    return (
      <div className="w-full max-w-lg mx-auto" aria-busy="true" aria-label="Karte wird geladen">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-3" />
          <div className="bg-gray-100 dark:bg-gray-800 rounded" style={{ aspectRatio: '500/600' }} />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-lg mx-auto relative">
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {globalCooldownSeconds > 0
          ? `Der Biber braucht eine Pause. Nächste Sichtung in ${formatCountdown(globalCooldownSeconds)} möglich.`
          : ''}
      </div>

      {globalCooldownSeconds > 0 && (
        <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
          🦫 Der Biber braucht eine Pause — in {formatCountdown(globalCooldownSeconds)} wieder einsatzbereit.
        </p>
      )}

      {toastLand && (
        <div
          key={toastLand.key}
          role="status"
          aria-live="polite"
          className="sighting-toast pointer-events-none absolute bottom-4 left-1/2 z-10 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium text-white shadow-lg"
          style={{ backgroundColor: 'var(--brand-primary)' }}
        >
          🦫 Sichtung in {toastLand.name} gemeldet!
        </div>
      )}

      <Tooltip.Provider delayDuration={100}>
        <svg
          viewBox="0 0 500 600"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto block"
          aria-label="Karte der deutschen Bundesländer — Bundesland anklicken um eine Sichtung zu melden"
          role="group"
        >
          {BUNDESLAENDER.map(({ code, name, d }) => {
            const count = counts.get(code) ?? 0
            const isTooltipOpen = touchSelected === code || hovered === code
            const isFocused = focused === code
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
                    tabIndex={0}
                    role="button"
                    aria-label={`${name}: ${count} ${count === 1 ? 'Sichtung' : 'Sichtungen'}${globalCooldownSeconds > 0 ? `. Pause noch ${formatCountdown(globalCooldownSeconds)}` : ''}`}
                    aria-disabled={globalCooldownSeconds > 0 ? 'true' : undefined}
                    onPointerEnter={(e) => { if (e.pointerType !== 'touch') setHovered(code) }}
                    onPointerLeave={(e) => { if (e.pointerType !== 'touch') setHovered(null) }}
                    onPointerDown={(e) => { latestPointerType.current = e.pointerType }}
                    onClick={(e) => handleRegionInteraction(e, code)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        handleClick(code)
                      }
                    }}
                    onFocus={() => { setFocused(code); setHovered(code) }}
                    onBlur={() => { setFocused(null); setHovered(null) }}
                    style={{ cursor: 'pointer' }}
                    className="focus:outline-none"
                  >
                    <path
                      data-land={code}
                      d={d}
                      style={{
                        fill: getFill(code),
                        stroke: isFocused ? 'var(--color-focus)' : 'var(--color-land-stroke)',
                        strokeWidth: isFocused ? 2 : 1,
                        transition: flashCode === code ? 'fill 0ms' : 'fill 600ms ease-out',
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
                    <span className="text-gray-600 dark:text-gray-400 ml-2">
                      {count} {count === 1 ? 'Sichtung' : 'Sichtungen'}
                    </span>
                    {globalCooldownSeconds > 0 && (
                      <span className="block text-gray-500 dark:text-gray-400 text-xs mt-0.5">
                        Noch {formatCountdown(globalCooldownSeconds)} warten
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
