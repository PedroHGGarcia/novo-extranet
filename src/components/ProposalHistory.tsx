import { useEffect, useState } from 'react'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { History, User, ArrowRight } from 'lucide-react'

export function ProposalHistory({ proposalId }: { proposalId: string }) {
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!proposalId) return
    let isMounted = true
    setLoading(true)

    pb.collection('auditoria')
      .getList(1, 50, {
        filter: `tabela = 'propostas' && registro_id = '${proposalId}' && acao ~ 'Status updated to'`,
        sort: '-created',
        expand: 'user',
      })
      .then((res) => {
        if (isMounted) setHistory(res.items)
      })
      .catch(console.error)
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => {
      isMounted = false
    }
  }, [proposalId])

  return (
    <Card className="shadow-none border-none sm:border-solid sm:shadow-sm">
      <CardHeader className="px-0 sm:px-4 pb-4">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800 dark:text-slate-200">
          <History className="h-5 w-5 text-slate-400" />
          Histórico de Status
        </CardTitle>
      </CardHeader>
      <CardContent className="px-0 sm:px-4">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
            <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
          </div>
        ) : history.length === 0 ? (
          <div className="bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 p-6 rounded-lg text-center">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Nenhuma alteração de status registrada.
            </p>
          </div>
        ) : (
          <div className="relative border-l-2 border-slate-100 dark:border-slate-800 ml-4 space-y-8 pb-4 mt-2">
            {history.map((item) => (
              <div key={item.id} className="relative pl-6">
                <div className="absolute -left-[17px] top-0 bg-white dark:bg-slate-950 p-1">
                  <div className="bg-blue-50 dark:bg-blue-900/30 rounded-full h-6 w-6 flex items-center justify-center ring-4 ring-white dark:ring-slate-950 border border-blue-100 dark:border-blue-900">
                    <User className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="-mt-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline justify-between">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {item.expand?.user?.name || item.expand?.user?.email || 'Sistema'}
                    </p>
                    <p className="text-[11px] font-medium text-slate-400 shrink-0">
                      {new Date(item.created).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-sm flex-wrap">
                    {item.dados?.old_status ? (
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded font-medium text-[11px] uppercase tracking-wider">
                        {item.dados.old_status}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 rounded font-medium text-[11px] uppercase tracking-wider">
                        Criada
                      </span>
                    )}
                    <ArrowRight className="h-3 w-3 text-slate-300 dark:text-slate-600" />
                    <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded font-bold text-[11px] uppercase tracking-wider border border-blue-100 dark:border-blue-800 shadow-sm">
                      {item.dados?.new_status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
