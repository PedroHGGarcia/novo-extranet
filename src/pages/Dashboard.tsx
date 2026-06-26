import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Bell,
  Calendar,
  Trophy,
  FileText,
  PieChart as PieChartIcon,
  CheckCircle,
  DollarSign,
  Percent,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { CurrencyWidget } from '@/components/CurrencyWidget'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

function StatusBadge({ status }: { status: string }) {
  let color = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
  if (status === 'Aprovada')
    color = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
  if (status === 'Em Análise')
    color = 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
  if (status === 'Recusada') color = 'bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400'
  if (status === 'Excluída')
    color = 'bg-slate-200 text-slate-500 dark:bg-slate-800/80 dark:text-slate-400'

  return (
    <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap', color)}>
      {status}
    </span>
  )
}

function getDateRange(period: string) {
  const now = new Date()
  let start = new Date(now)
  let end = new Date(now)

  if (period === 'este_mes') {
    start = new Date(now.getFullYear(), now.getMonth(), 1)
  } else if (period === 'mes_passado') {
    start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
  } else if (period === 'ultimos_3_meses') {
    start = new Date(now.getFullYear(), now.getMonth() - 3, 1)
  } else if (period === 'este_ano') {
    start = new Date(now.getFullYear(), 0, 1)
  } else if (period === 'todos') {
    start = new Date(2000, 0, 1)
  }

  return { start, end }
}

const chartConfig = {
  aprovada: { label: 'Aprovada', color: '#10b981' },
  em_analise: { label: 'Em Análise', color: '#f59e0b' },
  recusada: { label: 'Recusada', color: '#ef4444' },
  excluida: { label: 'Excluída', color: '#64748b' },
}

export default function Dashboard() {
  const { user } = useAuth()

  const [notificacoes, setNotificacoes] = useState<any[]>([])
  const [eventos, setEventos] = useState<any[]>([])
  const [configs, setConfigs] = useState<Record<string, boolean>>({})
  const [period, setPeriod] = useState('este_mes')

  const [metrics, setMetrics] = useState({
    representativesRanking: [] as {
      name: string
      totalSales: number
      totalProposals: number
    }[],
    latestProposals: [] as any[],
    totalCriadas: 0,
    taxaAprovacao: 0,
    valorAprovado: 0,
    donutData: [] as any[],
  })

  const loadData = async () => {
    try {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const startTodayStr = todayStart.toISOString().replace('T', ' ')

      let filterStr = ''
      if (period !== 'todos') {
        const { start, end } = getDateRange(period)
        const startStr = start.toISOString().replace('T', ' ')
        if (period === 'mes_passado') {
          const endStr = end.toISOString().replace('T', ' ')
          filterStr = `created >= "${startStr}" && created <= "${endStr}"`
        } else {
          filterStr = `created >= "${startStr}"`
        }
      }

      const todasPropostas = await pb.collection('propostas').getFullList({
        filter: filterStr,
        expand: 'representante,cliente',
        sort: '-created',
      })

      const repStats: Record<string, { name: string; totalSales: number; totalProposals: number }> =
        {}
      let totalAprovada = 0
      let valorAprovado = 0
      const statusCount: Record<string, number> = {}

      todasPropostas.forEach((p) => {
        const repId = p.representante
        const repName = p.expand?.representante?.fantasia

        statusCount[p.status] = (statusCount[p.status] || 0) + 1

        if (p.status === 'Aprovada') {
          totalAprovada++
          valorAprovado += p.valor_final || 0
        }

        if (repId && repName) {
          if (!repStats[repId]) {
            repStats[repId] = { name: repName, totalSales: 0, totalProposals: 0 }
          }
          repStats[repId].totalProposals += 1
          if (p.status === 'Aprovada') {
            repStats[repId].totalSales += p.valor_final || 0
          }
        }
      })

      const ranking = Object.values(repStats)
        .sort((a, b) => b.totalSales - a.totalSales || b.totalProposals - a.totalProposals)
        .slice(0, 10)

      const taxaAprovacao =
        todasPropostas.length > 0 ? (totalAprovada / todasPropostas.length) * 100 : 0

      const donutDataRaw = [
        { name: 'Aprovada', value: statusCount['Aprovada'] || 0, fill: chartConfig.aprovada.color },
        {
          name: 'Em Análise',
          value: statusCount['Em Análise'] || 0,
          fill: chartConfig.em_analise.color,
        },
        { name: 'Recusada', value: statusCount['Recusada'] || 0, fill: chartConfig.recusada.color },
        { name: 'Excluída', value: statusCount['Excluída'] || 0, fill: chartConfig.excluida.color },
      ].filter((d) => d.value > 0)

      setMetrics({
        representativesRanking: ranking,
        latestProposals: todasPropostas.slice(0, 5),
        totalCriadas: todasPropostas.length,
        taxaAprovacao,
        valorAprovado,
        donutData: donutDataRaw,
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
  }, [user, period])

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
        <div className="w-full sm:w-64">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-full bg-white dark:bg-slate-900">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="este_mes">Este Mês</SelectItem>
              <SelectItem value="mes_passado">Mês Passado</SelectItem>
              <SelectItem value="ultimos_3_meses">Últimos 3 Meses</SelectItem>
              <SelectItem value="este_ano">Este Ano</SelectItem>
              <SelectItem value="todos">Todo o Período</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-2xl shadow-sm border-slate-200 dark:border-slate-800">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-brand-blue/10 dark:bg-brand-blue/20 rounded-full">
              <FileText className="h-6 w-6 text-brand-blue" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Propostas Criadas
              </p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {metrics.totalCriadas}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border-slate-200 dark:border-slate-800">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-brand-green/10 dark:bg-brand-green/20 rounded-full">
              <Percent className="h-6 w-6 text-brand-green" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Taxa de Aprovação
              </p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {metrics.taxaAprovacao.toFixed(1)}%
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border-slate-200 dark:border-slate-800">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-brand-orange/10 dark:bg-brand-orange/20 rounded-full">
              <DollarSign className="h-6 w-6 text-brand-orange" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Valor Aprovado
              </p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                  metrics.valorAprovado,
                )}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4">
        <CurrencyWidget />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="rounded-2xl shadow-sm border-slate-200 dark:border-slate-800 lg:col-span-1 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-brand-blue" />
              Status das Propostas
            </CardTitle>
            <CardDescription>Distribuição no período</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center min-h-[250px]">
            {metrics.donutData.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum dado disponível.</p>
            ) : (
              <ChartContainer
                config={chartConfig}
                className="w-full h-full aspect-square max-h-[250px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metrics.donutData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                    >
                      {metrics.donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <RechartsTooltip content={<ChartTooltipContent />} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border-slate-200 dark:border-slate-800 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-brand-orange" />
              Ranking de Representantes
            </CardTitle>
            <CardDescription>
              Top 10 representantes com maior volume de vendas em propostas aprovadas no período
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            {metrics.representativesRanking.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum dado disponível.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-800">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                    <TableRow>
                      <TableHead className="w-[100px]">Posição</TableHead>
                      <TableHead>Representante</TableHead>
                      <TableHead className="text-center">Propostas (Qtd.)</TableHead>
                      <TableHead className="text-right">Volume Aprovado</TableHead>
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
                        <TableCell className="text-center text-slate-600 dark:text-slate-400">
                          {rep.totalProposals}
                        </TableCell>
                        <TableCell className="text-right font-bold text-[#f59e0b]">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(rep.totalSales)}
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

      <Card className="rounded-2xl shadow-sm border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-brand-blue" />
            Últimas Propostas
          </CardTitle>
          <CardDescription>As 5 propostas mais recentes do período selecionado</CardDescription>
        </CardHeader>
        <CardContent>
          {metrics.latestProposals.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhuma proposta recente.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-800">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                  <TableRow>
                    <TableHead>Número</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Representante</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.latestProposals.map((p) => (
                    <TableRow
                      key={p.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30"
                    >
                      <TableCell className="font-medium text-brand-blue">
                        {p.numero_proposta}
                      </TableCell>
                      <TableCell className="text-slate-700 dark:text-slate-300">
                        {p.expand?.cliente?.fantasia || 'N/A'}
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">
                        {p.expand?.representante?.fantasia || 'N/A'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(p.valor_final || 0)}
                      </TableCell>
                      <TableCell className="text-center">
                        <StatusBadge status={p.status} />
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
