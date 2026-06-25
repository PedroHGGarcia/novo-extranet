import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Bell, Calendar, CheckCircle2, DollarSign, Trophy, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { startOfMonth, endOfMonth, format } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

interface MetricCardProps {
  title: string
  value: string | number
  colorClass: string
  icon: React.ElementType
}

const MetricCard = ({ title, value, colorClass, icon: Icon }: MetricCardProps) => (
  <div
    className={cn(
      'relative overflow-hidden rounded-2xl p-6 text-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md',
      colorClass,
    )}
  >
    <div className="relative z-10 flex flex-col gap-1">
      <span
        className={cn(
          'font-bold tracking-tight',
          typeof value === 'string' && value.length > 10 ? 'text-3xl mt-1' : 'text-5xl',
        )}
      >
        {value}
      </span>
      <span className="text-sm font-medium opacity-90 mt-1">{title}</span>
    </div>
    <Icon
      className="absolute -bottom-6 -right-4 h-32 w-32 opacity-20 transition-transform duration-500 hover:scale-110 select-none"
      strokeWidth={1.5}
      draggable={false}
    />
  </div>
)

export default function Dashboard() {
  const { user } = useAuth()

  const [notificacoes, setNotificacoes] = useState<any[]>([])
  const [eventos, setEventos] = useState<any[]>([])
  const [configs, setConfigs] = useState<Record<string, boolean>>({})

  const [metrics, setMetrics] = useState({
    totalProposals: 0,
    approvedProposals: 0,
    approvalRate: 0,
    consolidatedValue: 0,
    representativesRanking: [] as {
      name: string
      conversionRate: number
      approved: number
      total: number
    }[],
  })

  const loadData = async () => {
    try {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const startTodayStr = todayStart.toISOString().replace('T', ' ')

      const startMonthStr = format(startOfMonth(new Date()), 'yyyy-MM-dd 00:00:00')
      const endMonthStr = format(endOfMonth(new Date()), 'yyyy-MM-dd 23:59:59')

      const propostasMesRes = await pb.collection('propostas').getFullList({
        filter: `created >= "${startMonthStr}" && created <= "${endMonthStr}"`,
        expand: 'representante',
      })

      const approvedMonth = propostasMesRes.filter((p) => p.status === 'Aprovada')
      const consolidatedValueMonth = approvedMonth.reduce((acc, p) => acc + (p.valor_final || 0), 0)

      const repStats: Record<string, { name: string; approved: number; total: number }> = {}

      propostasMesRes.forEach((p) => {
        const repId = p.representante
        const repName = p.expand?.representante?.fantasia
        if (!repId || !repName) return

        if (!repStats[repId]) {
          repStats[repId] = { name: repName, approved: 0, total: 0 }
        }
        repStats[repId].total += 1
        if (p.status === 'Aprovada') {
          repStats[repId].approved += 1
        }
      })

      const ranking = Object.values(repStats)
        .map((r) => ({
          name: r.name,
          approved: r.approved,
          total: r.total,
          conversionRate: r.total > 0 ? (r.approved / r.total) * 100 : 0,
        }))
        .sort((a, b) => b.conversionRate - a.conversionRate)
        .slice(0, 10)

      setMetrics({
        totalProposals: propostasMesRes.length,
        approvedProposals: approvedMonth.length,
        approvalRate: propostasMesRes.length
          ? (approvedMonth.length / propostasMesRes.length) * 100
          : 0,
        consolidatedValue: consolidatedValueMonth,
        representativesRanking: ranking,
      })

      if (user?.id) {
        const notifRes = await pb.collection('notificacoes').getList(1, 5, {
          filter: `user = "${user.id}" && lida = false`,
          sort: '-created',
        })
        setNotificacoes(notifRes.items)
      }

      const evtRes = await pb.collection('eventos').getList(1, 3, {
        filter: `data >= "${startTodayStr}"`,
        sort: '+data',
      })
      setEventos(evtRes.items)

      if (user?.role) {
        const confs = await pb.collection('configuracoes_dashboard').getFullList({
          filter: `perfil = "${user.role}"`,
        })
        const configMap: Record<string, boolean> = {}
        confs.forEach((c) => (configMap[c.componente] = c.visivel))
        setConfigs(configMap)
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    loadData()
  }, [user])

  useRealtime('eventos', () => loadData())
  useRealtime('notificacoes', () => loadData())
  useRealtime('configuracoes_dashboard', () => loadData())
  useRealtime('propostas', () => loadData())

  const isVisible = (componente: string) => configs[componente] !== false

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Olá, {user?.name || 'Usuário'}!
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Aqui está o resumo de performance de vendas.
          </p>
        </div>
      </div>

      {isVisible('cards_resumo') && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <MetricCard
            title="Total de Propostas (Mês)"
            value={metrics.totalProposals}
            colorClass="bg-[#3b82f6]"
            icon={FileText}
          />
          <MetricCard
            title="Propostas Aprovadas (Mês)"
            value={metrics.approvedProposals}
            colorClass="bg-[#06b6d4]"
            icon={CheckCircle2}
          />
          <MetricCard
            title="Taxa de Aprovação (Mês)"
            value={`${metrics.approvalRate.toFixed(1)}%`}
            colorClass="bg-[#f59e0b]"
            icon={Trophy}
          />
          <MetricCard
            title="Volume de Negócios (Mês)"
            value={formatCurrency(metrics.consolidatedValue)}
            colorClass="bg-[#14532d]"
            icon={DollarSign}
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl shadow-sm border-slate-200 dark:border-slate-800 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-brand-orange" />
              Ranking de Representantes (Conversão)
            </CardTitle>
            <CardDescription>
              Top 10 representantes com maior taxa de conversão neste mês (Propostas Aprovadas /
              Total)
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {metrics.representativesRanking.length === 0 ? (
              <p className="text-sm text-slate-500">
                Nenhum dado de conversão disponível neste mês.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-800">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                    <TableRow>
                      <TableHead className="w-[100px]">Posição</TableHead>
                      <TableHead>Representante</TableHead>
                      <TableHead className="text-right">Total Propostas</TableHead>
                      <TableHead className="text-right">Aprovadas</TableHead>
                      <TableHead className="text-right">Taxa de Conversão</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metrics.representativesRanking.map((rep, index) => (
                      <TableRow
                        key={index}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                      >
                        <TableCell className="font-bold text-slate-400">{index + 1}º</TableCell>
                        <TableCell className="font-medium text-slate-700 dark:text-slate-300">
                          {rep.name}
                        </TableCell>
                        <TableCell className="text-right text-slate-600 dark:text-slate-400">
                          {rep.total}
                        </TableCell>
                        <TableCell className="text-right text-slate-600 dark:text-slate-400">
                          {rep.approved}
                        </TableCell>
                        <TableCell className="text-right font-bold text-[#f59e0b]">
                          {rep.conversionRate.toFixed(1)}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {isVisible('notificacoes_recentes') && (
          <Card className="rounded-2xl shadow-sm border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-brand-blue select-none" draggable={false} />
                Notificações Recentes
              </CardTitle>
              <CardDescription>Suas últimas 5 notificações não lidas</CardDescription>
            </CardHeader>
            <CardContent>
              {notificacoes.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhuma notificação nova.</p>
              ) : (
                <div className="space-y-4">
                  {notificacoes.map((notif) => (
                    <div
                      key={notif.id}
                      className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50"
                    >
                      <div
                        className={cn(
                          'mt-1.5 w-2.5 h-2.5 rounded-full shrink-0',
                          notif.tipo === 'info'
                            ? 'bg-blue-500'
                            : notif.tipo === 'alerta'
                              ? 'bg-orange-500'
                              : 'bg-green-500',
                        )}
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          {notif.titulo}
                        </p>
                        <p className="text-sm text-slate-500 mt-0.5">{notif.mensagem}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {new Date(notif.created).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {isVisible('proximos_eventos') && (
          <Card className="rounded-2xl shadow-sm border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-brand-green select-none" draggable={false} />
                Próximos Eventos
              </CardTitle>
              <CardDescription>Seus próximos 3 eventos agendados</CardDescription>
            </CardHeader>
            <CardContent>
              {eventos.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhum evento futuro agendado.</p>
              ) : (
                <div className="space-y-4">
                  {eventos.map((evento) => (
                    <div
                      key={evento.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center p-3 bg-brand-green/10 text-brand-green rounded-lg min-w-[80px]">
                        <span className="text-xl font-bold">{new Date(evento.data).getDate()}</span>
                        <span className="text-xs font-semibold uppercase">
                          {new Date(evento.data).toLocaleDateString('pt-BR', { month: 'short' })}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                          {evento.titulo}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            {evento.categoria}
                          </span>
                          <span className="text-sm text-slate-500">{evento.status}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
