import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { FolderKanban, ArrowRight, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { cn } from '@/lib/utils'

const statusColors: Record<string, string> = {
  'Em Andamento': 'bg-blue-100 text-blue-700',
  Concluído: 'bg-emerald-100 text-emerald-700',
  Cancelado: 'bg-rose-100 text-rose-700',
  Suspenso: 'bg-amber-100 text-amber-700',
}

export function ProjectsWidget() {
  const [projects, setProjects] = useState<any[]>([])
  const [proposalCounts, setProposalCounts] = useState<
    Record<string, { total: number; licitacoes: number }>
  >({})
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    try {
      const res = await pb.collection('projetos').getList(1, 5, {
        sort: '-created',
        expand: 'cliente',
      })
      setProjects(res.items)

      const counts: Record<string, { total: number; licitacoes: number }> = {}
      for (const proj of res.items) {
        try {
          const props = await pb.collection('propostas').getList(1, 200, {
            filter: `projeto = "${proj.id}" && status != 'Excluída'`,
          })
          counts[proj.id] = {
            total: props.totalItems,
            licitacoes: props.items.filter((p: any) => p.modelo_licitacao).length,
          }
        } catch {
          counts[proj.id] = { total: 0, licitacoes: 0 }
        }
      }
      setProposalCounts(counts)
    } catch {
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('projetos', loadData)

  return (
    <Card className="rounded-2xl shadow-sm border-slate-200 dark:border-slate-800">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <FolderKanban className="h-5 w-5 text-brand-blue" />
            Gestão de Projetos
          </CardTitle>
          <CardDescription>Projetos recentes</CardDescription>
        </div>
        <Link
          to="/projetos"
          className="text-sm text-brand-blue hover:underline flex items-center gap-1"
        >
          Ver todos <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-slate-500">Carregando...</p>
        ) : projects.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum projeto criado ainda.</p>
        ) : (
          <div className="space-y-3">
            {projects.map((proj) => (
              <Link
                key={proj.id}
                to="/projetos"
                className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {proj.nome}
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-xs text-slate-500">
                      {proj.expand?.cliente?.fantasia || '-'}
                    </p>
                    {proposalCounts[proj.id]?.licitacoes > 0 && (
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1 py-0 h-4 bg-purple-50 text-purple-700 border-purple-200"
                      >
                        <ShieldCheck className="h-2.5 w-2.5 mr-0.5" />
                        {proposalCounts[proj.id].licitacoes} Lic.
                      </Badge>
                    )}
                  </div>
                </div>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-xs font-medium',
                    statusColors[proj.status] || 'bg-slate-100 text-slate-700',
                  )}
                >
                  {proj.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
