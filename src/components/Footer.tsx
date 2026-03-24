import { navigate } from '../hooks/useRouter'

export default function Footer() {
  return (
    <footer className="w-full py-4 px-4 sm:px-6 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-2xl mx-auto flex flex-wrap justify-center gap-x-6 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
        <span>© {new Date().getFullYear()} Biber Lieber:innen e.V.</span>
        <button
          type="button"
          onClick={() => navigate('/impressum')}
          className="hover:text-gray-800 dark:hover:text-gray-200 underline underline-offset-2"
        >
          Impressum
        </button>
        <button
          type="button"
          onClick={() => navigate('/datenschutz')}
          className="hover:text-gray-800 dark:hover:text-gray-200 underline underline-offset-2"
        >
          Datenschutz
        </button>
      </div>
    </footer>
  )
}
