import { useState, useEffect } from 'react'
import GermanyMap from './components/GermanyMap'
import StatsPanel from './components/StatsPanel'

interface SightingCount {
  bundesland: string
  count: number
}

export default function App() {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [counts, setCounts] = useState<Map<string, number>>(new Map())
  const [availableYears, setAvailableYears] = useState<number[]>([currentYear])

  useEffect(() => {
    fetch(`/api/sightings?year=${year}`)
      .then(r => r.json() as Promise<SightingCount[]>)
      .then(data => {
        const map = new Map<string, number>()
        data.forEach(({ bundesland, count }) => map.set(bundesland, count))
        setCounts(map)
      })
      .catch(() => {})
  }, [year])

  useEffect(() => {
    fetch('/api/years')
      .then(r => r.json() as Promise<number[]>)
      .then(years => setAvailableYears(years.length > 0 ? years : [currentYear]))
      .catch(() => {})
  }, [currentYear])

  return (
    <main className="min-h-screen bg-white dark:bg-gray-900 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <GermanyMap year={year} counts={counts} onCountsChange={setCounts} />
        <StatsPanel counts={counts} year={year} availableYears={availableYears} onYearChange={setYear} />
      </div>
    </main>
  )
}
