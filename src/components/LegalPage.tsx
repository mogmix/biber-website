import Header from './Header'
import Footer from './Footer'
import { navigate } from '../hooks/useRouter'

interface Props {
  content: string
}

function renderMarkdown(md: string) {
  return md.split(/\n\n+/).map((block, i) => {
    if (block.startsWith('### ')) {
      return <h3 key={i} className="text-base font-semibold text-gray-900 dark:text-gray-100 mt-5 mb-1">{block.slice(4)}</h3>
    }
    if (block.startsWith('## ')) {
      return <h2 key={i} className="text-lg font-bold text-gray-900 dark:text-gray-100 mt-6 mb-2">{block.slice(3)}</h2>
    }
    if (block.startsWith('# ')) {
      return <h1 key={i} className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">{block.slice(2)}</h1>
    }
    if (block.startsWith('---')) {
      return <hr key={i} className="my-6 border-gray-200 dark:border-gray-700" />
    }
    const lines = block.split('\n').map((line, j) => {
      const bold = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      return (
        <span key={j}>
          {j > 0 && <br />}
          <span dangerouslySetInnerHTML={{ __html: bold }} />
        </span>
      )
    })
    return <p key={i} className="text-gray-700 dark:text-gray-300 leading-relaxed mb-0">{lines}</p>
  })
}

export default function LegalPage({ content }: Props) {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
      <Header />
      <main className="flex-1 py-8 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="mb-6 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 flex items-center gap-1"
          >
            ← Zurück zur Karte
          </button>
          <div className="prose-sm space-y-3">
            {renderMarkdown(content)}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
