import { useEffect, useState } from 'react'
import ErrorBoundary from './components/ErrorBoundary'
import Footer from './components/Footer'
import GermanyMap from './components/GermanyMap'
import Header from './components/Header'
import LegalPage from './components/LegalPage'
import StatsPanel from './components/StatsPanel'
import datenschutzContent from './content/datenschutz.md?raw'
import impressumContent from './content/impressum.md?raw'
import { usePathname } from './hooks/useRouter'

interface SightingCount {
  bundesland: string
  count: number
}

function MapView() {
  const currentYear = new Date().getFullYear()
  const [year, setYear] = useState(currentYear)
  const [counts, setCounts] = useState<Map<string, number>>(new Map())
  const [availableYears, setAvailableYears] = useState<number[]>([currentYear])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setIsLoading(true)
    setFetchError(false)
    fetch(`/api/sightings?year=${year}`, { signal: controller.signal })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<SightingCount[]>
      })
      .then(data => {
        const map = new Map<string, number>()
        data.forEach(({ bundesland, count }) => map.set(bundesland, count))
        setCounts(map)
      })
      .catch(err => { if (err.name !== 'AbortError') setFetchError(true) })
      .finally(() => setIsLoading(false))
    return () => controller.abort()
  }, [year, retryCount])

  useEffect(() => {
    fetch('/api/years')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        return r.json() as Promise<number[]>
      })
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
      <div className="w-full px-4 sm:px-6 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-lg sm:max-w-2xl mx-auto flex items-center gap-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 flex-1">
            Wir nagen uns vor — eine Sichtung nach der anderen.
          </p>
          <img
            src="/beaver-illustration.png"
            alt=""
            aria-hidden="true"
            className="lg:hidden h-16 w-auto shrink-0 object-contain"
          />
        </div>
      </div>
      <main id="main-content" className="flex-1 py-6 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex flex-col lg:flex-row lg:gap-12 lg:items-start">
          <div className="flex-1 min-w-0">
            {fetchError ? (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Daten konnten nicht geladen werden.
                </p>
                <button
                  type="button"
                  onClick={() => setRetryCount(n => n + 1)}
                  className="text-sm text-blue-600 dark:text-blue-400 underline"
                >
                  Erneut versuchen
                </button>
              </div>
            ) : (
              <>
                <ErrorBoundary>
                  <GermanyMap year={year} counts={counts} onCountsChange={setCounts} isLoading={isLoading} />
                </ErrorBoundary>
                <ErrorBoundary>
                  <StatsPanel counts={counts} year={year} availableYears={availableYears} onYearChange={setYear} isLoading={isLoading} />
                </ErrorBoundary>
              </>
            )}
          </div>
          <div className="hidden lg:block lg:w-72 lg:shrink-0 lg:sticky lg:top-6">
            <img
              src="/beaver-illustration.png"
              alt=""
              aria-hidden="true"
              className="w-full"
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function App() {
  const pathname = usePathname()

  return (
    <div key={pathname} className="page-fade">
      {pathname === '/impressum' ? <LegalPage content={impressumContent} /> :
       pathname === '/datenschutz' ? <LegalPage content={datenschutzContent} /> :
       <MapView />}
    </div>
  )
}
