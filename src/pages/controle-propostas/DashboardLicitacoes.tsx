import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FileText, CheckCircle2, XCircle, Clock, DollarSign, Eye, Plus, Search } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import pb from '@/lib/pocketbase/client'
import { cn } from '@/lib/utils'

type StatusFilter = 'all' | 'Em Análise' | 'Aprovada' | 'Recusada' | 'Excluída'

const STATUS_COLORS: Record<string, string> = {
  Aprovada: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
  'Em Análise': 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
  Recusada: 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400',
  Excluída: 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
}

const STATUS_CONFIG: Record<string, { icon: any; color: string; bg: string }> = {
  'Em Análise': { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/20' },
  Aprovada: {
    icon: CheckCircle2,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
  },
  Recusada: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/20' },
  Excluída: { icon: XCircle, color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-slate-800/50' },
}

const currency = (v: number | undefined) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v || 0)

const formatDate = (dt: string | undefined, created: string) => {
  const d = dt ? new Date(dt) : new Date(created)
  return format(d, 'dd/MM/yyyy')
}

export default function DashboardLicitacoes() {
  const { user } = useAuth()
  const [propostas, setPropostas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')

  const loadData = async () => {
    if (!user?.id) return
    try {
      setLoading(true)
      const records = await pb.collection('propostas').getFullList({
        filter: `modelo_licitacao = true && user = "${user.id}"`,
        expand: 'cliente',
        sort: '-created',
      })
      setPropostas(records)
    } catch (err) {
      console.error('Erro ao carregar licitações:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [user?.id])

  useRealtime('propostas', () => loadData())

  const filtered = useMemo(() => {
    let result = propostas
    if (statusFilter !== 'all') {
      result = result.filter((p) => p.status === statusFilter)
    }
    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        (p) =>
          p.numero_proposta?.toLowerCase().includes(q) ||
          p.expand?.cliente?.razao_social?.toLowerCase().includes(q) ||
          p.expand?.cliente?.fantasia?.toLowerCase().includes(q),
      )
    }
    return result
  }, [propostas, statusFilter, search])

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'Em Análise': 0,
      Aprovada: 0,
      Recusada: 0,
      Excluída: 0,
    }
    propostas.forEach((p) => {
      const s = p.status || 'Em Análise'
      counts[s] = (counts[s] || 0) + 1
    })
    return counts
  }, [propostas])

  const valorTotal = filtered.reduce((acc, p) => acc + (p.valor_final || 0), 0)

  const statusFilters: StatusFilter[] = ['all', 'Em Análise', 'Aprovada', 'Recusada', 'Excluída']

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-pulse text-slate-400">Carregando licitações...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Dashboard de Licitações
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Gerencie suas propostas de licitação em um só lugar.
          </p>
        </div>
        <Link to="/controle-propostas/emitir">
          <Button className="bg-[#337ab7] hover:bg-[#286090] text-white gap-2">
            <Plus className="h-4 w-4" /> Nova Proposta de Licitação
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {(['Em Análise', 'Aprovada', 'Recusada', 'Excluída'] as const).map((status) => {
          const config = STATUS_CONFIG[status]
          const Icon = config?.icon || FileText
          const count = statusCounts[status] || 0
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)}
              className={cn(
                'text-left transition-all',
                statusFilter === status &&
                  'ring-2 ring-offset-2 ring-brand-blue dark:ring-offset-slate-950',
              )}
            >
              <Card
                className={cn(
                  'rounded-2xl shadow-sm border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-md transition-shadow',
                  config?.bg,
                )}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={cn('p-2 rounded-lg', config?.bg, config?.color)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{count}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{status}</p>
                  </div>
                </CardContent>
              </Card>
            </button>
          )
        })}
      </div>

      <Card className="rounded-2xl shadow-sm border-slate-200 dark:border-slate-800">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-brand-blue" />
              Propostas de Licitação
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              {filtered.length} proposta(s) encontrada(s) · Valor total: {currency(valorTotal)}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por número ou cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex items-center gap-1 px-5 pb-3 flex-wrap">
            {statusFilters.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                  statusFilter === s
                    ? 'bg-brand-blue text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700',
                )}
              >
                {s === 'all' ? 'Todas' : s}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nenhuma proposta de licitação encontrada
              </h3>
              <p className="text-sm text-slate-500 mb-6 max-w-md">
                {search || statusFilter !== 'all'
                  ? 'Tente ajustar os filtros de busca para encontrar suas propostas.'
                  : 'Você ainda não criou nenhuma proposta de licitação. Comece criando a primeira!'}
              </p>
              <Link to="/controle-propostas/emitir">
                <Button className="bg-[#337ab7] hover:bg-[#286090] text-white gap-2">
                  <Plus className="h-4 w-4" /> Criar Nova Proposta de Licitação
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Data de Criação</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => (
                    <TableRow
                      key={p.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <TableCell className="font-medium text-brand-blue">
                        {p.numero_proposta}
                      </TableCell>
                      <TableCell className="text-slate-700 dark:text-slate-300">
                        {p.expand?.cliente?.razao_social || p.expand?.cliente?.fantasia || 'N/A'}
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400 text-sm">
                        {formatDate(p.dt_cad, p.created)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={cn(
                            'inline-flex px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap',
                            STATUS_COLORS[p.status || 'Em Análise'] || STATUS_COLORS['Em Análise'],
                          )}
                        >
                          {p.status || 'Em Análise'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium text-slate-700 dark:text-slate-300">
                        {currency(p.valor_final)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Link to={`/controle-propostas/proposta-pdf/${p.id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1 text-brand-blue hover:text-brand-blue/80"
                          >
                            <Eye className="h-4 w-4" /> Ver
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
