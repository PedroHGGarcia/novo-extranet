import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#f1f5f9] p-4 font-sans">
          <div className="bg-white p-8 rounded-sm shadow-sm border border-slate-200 max-w-md w-full text-center">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-lg font-medium text-slate-800 mb-2">
              Ops, ocorreu um erro inesperado
            </h2>
            <p className="text-slate-500 mb-6 text-sm">
              Pedimos desculpas pelo inconveniente. A aplicação encontrou um problema ao tentar
              exibir esta tela.
            </p>
            {this.state.error && (
              <div className="bg-slate-50 p-3 rounded text-left overflow-auto text-[11px] text-red-500 mb-6 border border-slate-100 max-h-32 font-mono">
                {this.state.error.message}
              </div>
            )}
            <button
              onClick={() => (window.location.href = '/dashboard')}
              className="bg-[#337ab7] hover:bg-[#286090] text-white px-6 py-2 rounded-[3px] text-sm uppercase transition-colors"
            >
              Voltar ao Início
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
