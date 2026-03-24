import { useState, useEffect } from 'react'
import GermanyMap from './components/GermanyMap'
import StatsPanel from './components/StatsPanel'
import Header from './components/Header'
import Footer from './components/Footer'
import LegalPage from './components/LegalPage'
import { usePathname } from './hooks/useRouter'
import impressumContent from './content/impressum.md?raw'
import datenschutzContent from './content/datenschutz.md?raw'

interface SightingCount {
  bundesland: string
  count: number
}

function MapView() {
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
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-white focus:text-gray-900 focus:rounded focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Zum Hauptinhalt springen
      </a>
      <Header />
      <main id="main-content" className="flex-1 py-6 px-4 sm:px-6">
        <div className="max-w-lg mx-auto sm:max-w-2xl">
          <GermanyMap year={year} counts={counts} onCountsChange={setCounts} />
          <StatsPanel counts={counts} year={year} availableYears={availableYears} onYearChange={setYear} />
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  const pathname = usePathname()

  if (pathname === '/impressum') return <LegalPage content={impressumContent} />
  if (pathname === '/datenschutz') return <LegalPage content={datenschutzContent} />
  return <MapView />
}
