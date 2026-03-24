import { BUNDESLAENDER } from '../data/bundeslaender'

interface StatsPanelProps {
  counts: Map<string, number>
  year: number
  availableYears: number[]
  onYearChange: (year: number) => void
}

export default function StatsPanel({ counts, year, availableYears, onYearChange }: StatsPanelProps) {
  const sorted = [...BUNDESLAENDER]
    .map(({ code, name }) => ({ code, name, count: counts.get(code) ?? 0 }))
    .sort((a, b) => b.count - a.count)

  const maxCount = Math.max(1, ...sorted.map(s => s.count))

  return (
    <div className="w-full mt-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Statistik</h2>
        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="year-select" className="text-gray-500 dark:text-gray-400">Jahr:</label>
          <select
            id="year-select"
            value={year}
            onChange={e => onYearChange(Number(e.target.value))}
            className="border border-gray-300 dark:border-gray-600 rounded px-2 py-0.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            {availableYears.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        {sorted.map(({ code, name, count }) => (
          <div key={code} className="flex items-center gap-2 text-xs sm:text-sm">
            <span className="w-28 sm:w-36 shrink-0 text-right text-gray-600 dark:text-gray-400 truncate">{name}</span>
            <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden h-4 sm:h-5">
              <div
                className="h-full rounded transition-[width] duration-300 ease-out"
                style={{
                  width: count > 0 ? `${(count / maxCount) * 100}%` : '0%',
                  backgroundColor: 'var(--color-land-3)',
                }}
              />
            </div>
            <span className="w-6 sm:w-8 shrink-0 text-right tabular-nums text-gray-600 dark:text-gray-400">{count}</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-right">Sichtungen</p>
    </div>
  )
}
