import { useState, useEffect } from 'react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { BUNDESLAENDER } from '../data/bundeslaender'

interface SightingCount {
  bundesland: string
  count: number
}

function getQuantileTier(count: number, sortedCounts: number[]): number {
  const n = sortedCounts.length
  if (n === 0) return 1
  const rank = sortedCounts.filter(c => c <= count).length
  return Math.max(1, Math.min(5, Math.ceil((rank / n) * 5)))
}

interface GermanyMapProps {
  year?: number
}

export default function GermanyMap({ year = new Date().getFullYear() }: GermanyMapProps) {
  const [counts, setCounts] = useState<Map<string, number>>(new Map())
  const [hovered, setHovered] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/sightings?year=${year}`)
      .then(r => r.json() as Promise<SightingCount[]>)
      .then(data => {
        const map = new Map<string, number>()
        data.forEach(({ bundesland, count }) => map.set(bundesland, count))
        setCounts(map)
      })
      .catch(() => {/* map renders with default colors on fetch failure */})
  }, [year])

  const sortedNonZero = Array.from(counts.values())
    .filter(c => c > 0)
    .sort((a, b) => a - b)

  function getFill(code: string): string {
    if (code === hovered) return 'var(--color-land-hover)'
    const count = counts.get(code) ?? 0
    if (count === 0) return 'var(--color-land-default)'
    const tier = getQuantileTier(count, sortedNonZero)
    return `var(--color-land-${tier})`
  }

  return (
    <Tooltip.Provider delayDuration={100}>
      <svg
        viewBox="0 0 500 600"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto max-w-lg mx-auto block"
        aria-label="Karte der deutschen Bundesländer"
        role="img"
      >
        {BUNDESLAENDER.map(({ code, name, d }) => {
          const count = counts.get(code) ?? 0
          return (
            <Tooltip.Root key={code}>
              <Tooltip.Trigger asChild>
                <g
                  onPointerEnter={() => setHovered(code)}
                  onPointerLeave={() => setHovered(null)}
                  style={{ cursor: 'pointer' }}
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
                  <Tooltip.Arrow className="fill-white dark:fill-gray-800" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          )
        })}
      </svg>
    </Tooltip.Provider>
  )
}
