import { useRouteError, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export function RouteError() {
  const error = useRouteError() as any
  const navigate = useNavigate()

  return (
    <div className="flex flex-1 items-center justify-center p-6 w-full h-full min-h-[400px]">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 max-w-md w-full text-center">
        <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6 text-rose-600 dark:text-rose-500" />
        </div>
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100 mb-2">
          Ops, ocorreu um erro
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6 text-sm">
          Não foi possível carregar esta página. Pode haver um problema temporário ou de
          comunicação.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => window.location.reload()} variant="default">
            Tentar Novamente
          </Button>
          <Button onClick={() => navigate('/dashboard')} variant="outline">
            Ir para Dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
