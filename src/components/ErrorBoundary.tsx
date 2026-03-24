import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex items-center justify-center p-8 text-center">
          <div>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Etwas ist schiefgelaufen.
            </p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false })}
              className="mt-2 text-sm text-blue-600 dark:text-blue-400 underline"
            >
              Erneut versuchen
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
