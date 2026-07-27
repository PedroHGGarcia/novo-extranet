import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Link } from 'react-router-dom'
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
  DollarSign,
  Percent,
  BarChart3,
  TrendingDown,
  ArrowRight,
  ExternalLink,
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
import { ProjectsWidget } from '@/components/ProjectsWidget'
import { AdvanceProposalDialog } from '@/components/AdvanceProposalDialog'
import { ProposalHistory } from '@/components/ProposalHistory'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { updateProposta } from '@/services/propostas'
import { getRepresentantes } from '@/services/cadastros'
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'

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
    end = new Date(now.getFullYear(), now.getMonth(), 0)
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
  outros: { label: 'Outros Status', color: '#94a3b8' },
}

export default function Dashboard() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [notificacoes, setNotificacoes] = useState<any[]>([])
  const [eventos, setEventos] = useState<any[]>([])
  const [configs, setConfigs] = useState<Record<string, boolean>>({})
  const [period, setPeriod] = useState('este_mes')
  const [representantes, setRepresentantes] = useState<any[]>([])
  const [selectedRepresentante, setSelectedRepresentante] = useState<string>('todos')
  const [selectedProposta, setSelectedProposta] = useState<any>(null)
  const [avancarPropostaItem, setAvancarPropostaItem] = useState<any>(null)
  const [novoStatus, setNovoStatus] = useState<string>('')

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
    monthlyRevenueData: [] as { month: string; aprovada: number; outros: number }[],
    avgDesconto: 0,
    totalSemDesconto: 0,
    totalFinal: 0,
  })

  useEffect(() => {
    const loadRepresentantes = async () => {
      try {
        const reps = await getRepresentantes()
        setRepresentantes(reps.filter((r: any) => r.status === 'Ativo'))
      } catch (err) {
        console.error(err)
      }
    }
    loadRepresentantes()
  }, [])

  const loadData = async () => {
    try {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const startTodayStr = format(todayStart, 'yyyy-MM-dd')

      let filterStr = ''
      if (period !== 'todos') {
        const { start, end } = getDateRange(period)
        const startStr = format(start, 'yyyy-MM-dd')
        if (period === 'mes_passado') {
          const endStr = format(end, 'yyyy-MM-dd')
          filterStr = `dt_cad >= "${startStr}" && dt_cad <= "${endStr}"`
        } else {
          filterStr = `dt_cad >= "${startStr}"`
        }
      }

      if (selectedRepresentante !== 'todos') {
        filterStr = filterStr
          ? `${filterStr} && representante = "${selectedRepresentante}"`
          : `representante = "${selectedRepresentante}"`
      }

      const todasPropostas = await pb.collection('propostas').getFullList({
        filter: filterStr,
        expand: 'representante,cliente,user,ultimo_usuario_status',
        sort: '-dt_cad',
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

      const monthlyMap: Record<string, { aprovada: number; outros: number }> = {}
      todasPropostas.forEach((p) => {
        const rawDate = p.dt_cad || p.created
        const date = new Date(rawDate)
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        if (!monthlyMap[monthKey]) monthlyMap[monthKey] = { aprovada: 0, outros: 0 }
        if (p.status === 'Aprovada') {
          monthlyMap[monthKey].aprovada += p.valor_final || 0
        } else {
          monthlyMap[monthKey].outros += p.valor_final || 0
        }
      })
      const monthlyRevenueData = Object.entries(monthlyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-6)
        .map(([month, values]) => ({
          month: new Date(month + '-01').toLocaleDateString('pt-BR', {
            month: 'short',
            year: '2-digit',
          }),
          aprovada: values.aprovada,
          outros: values.outros,
        }))

      const propostasComDesconto = todasPropostas.filter(
        (p) => p.percentual_desconto != null && p.percentual_desconto !== 0,
      )
      const avgDesconto =
        propostasComDesconto.length > 0
          ? propostasComDesconto.reduce((acc, p) => acc + (p.percentual_desconto || 0), 0) /
            propostasComDesconto.length
          : 0
      const totalSemDesconto = todasPropostas.reduce(
        (acc, p) => acc + (p.valor_sem_desconto || 0),
        0,
      )
      const totalFinal = todasPropostas.reduce((acc, p) => acc + (p.valor_final || 0), 0)

      setMetrics({
        representativesRanking: ranking,
        latestProposals: todasPropostas.slice(0, 10),
        totalCriadas: todasPropostas.length,
        taxaAprovacao,
        valorAprovado,
        donutData: donutDataRaw,
        monthlyRevenueData,
        avgDesconto,
        totalSemDesconto,
        totalFinal,
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
  }, [user, period, selectedRepresentante])

  useRealtime('eventos', () => loadData())
  useRealtime('notificacoes', () => loadData())
  useRealtime('configuracoes_dashboard', () => loadData())
  useRealtime('propostas', () => loadData())

  const isVisible = (componente: string) => configs[componente] !== false

  const handleAvancarProposta = async () => {
    if (!avancarPropostaItem) return
    try {
      await updateProposta(avancarPropostaItem.id, {
        status: novoStatus,
        ultimo_usuario_status: user?.id,
        data_alteracao_status: format(new Date(), 'yyyy-MM-dd'),
      })
      toast({ title: 'Status da proposta atualizado com sucesso' })
      setAvancarPropostaItem(null)
      loadData()
    } catch (e) {
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' })
    }
  }

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
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="w-full sm:w-56">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1 block">
              Representante
            </span>
            <Select value={selectedRepresentante} onValueChange={setSelectedRepresentante}>
              <SelectTrigger className="w-full bg-white dark:bg-slate-900">
                <SelectValue placeholder="Selecione o representante" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {representantes.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.fantasia || r.razao_social || 'Sem nome'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-full sm:w-48">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1 block">
              Período
            </span>
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

      <CurrencyWidget />
      <ProjectsWidget />

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
              Top 10 representantes com maior volume de vendas aprovadas no período
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

      {isVisible('grafico_vendas_mensal') && (
        <Card className="rounded-2xl shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-brand-blue" />
              Volume de Vendas por Mês
            </CardTitle>
            <CardDescription>
              Valor total de propostas nos últimos 6 meses, segmentado por status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.monthlyRevenueData.length === 0 ? (
              <p className="text-sm text-slate-500">Nenhum dado disponível.</p>
            ) : (
              <ChartContainer config={chartConfig} className="w-full h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics.monthlyRevenueData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      tickFormatter={(v: number) =>
                        v >= 1000 ? `R$ ${(v / 1000).toFixed(0)}k` : `R$ ${v.toFixed(0)}`
                      }
                    />
                    <RechartsTooltip
                      content={<ChartTooltipContent />}
                      formatter={(value: number) =>
                        new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(value)
                      }
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Bar
                      dataKey="aprovada"
                      name="Aprovada"
                      fill={chartConfig.aprovada.color}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={50}
                    />
                    <Bar
                      dataKey="outros"
                      name="Outros Status"
                      fill={chartConfig.outros.color}
                      radius={[4, 4, 0, 0]}
                      maxBarSize={50}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      )}

      {isVisible('analise_margem') && (
        <Card className="rounded-2xl shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-brand-orange" />
              Análise de Margem
            </CardTitle>
            <CardDescription>
              Monitoramento de descontos e impacto na margem de lucro
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2 mb-2">
                  <Percent className="h-4 w-4 text-brand-orange" />
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Desconto Médio
                  </span>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {metrics.avgDesconto.toFixed(1)}%
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Média de desconto aplicado nas propostas
                </p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-brand-blue" />
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Valor Sem Desconto
                  </span>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    metrics.totalSemDesconto,
                  )}
                </p>
                <p className="text-xs text-slate-500 mt-1">Soma total dos valores originais</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-brand-green" />
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Valor Final
                  </span>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    metrics.totalFinal,
                  )}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Impacto total de desconto:{' '}
                  <span className="font-semibold text-brand-orange">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      metrics.totalSemDesconto - metrics.totalFinal,
                    )}
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-2xl shadow-sm border-slate-200 dark:border-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-brand-blue" />
            Últimas Propostas
          </CardTitle>
          <CardDescription>
            As 10 propostas mais recentes do período selecionado — clique para ver o histórico
          </CardDescription>
        </CardHeader>
        <CardContent>
          {metrics.latestProposals.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhuma proposta recente.</p>
          ) : (
            <div className="space-y-3">
              {metrics.latestProposals.map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col p-4 border border-slate-100 dark:border-slate-800 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                  onClick={() => setSelectedProposta(p)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                        {p.numero_proposta}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[200px]">
                        {p.expand?.cliente?.fantasia || 'Cliente não informado'}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {p.expand?.representante?.fantasia || 'N/A'}
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1.5">
                      <StatusBadge status={p.status || 'Em Análise'} />
                      <div className="text-[10px] text-slate-400 font-medium">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(p.valor_final || p.valor_atual || 0)}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2.5 flex items-center gap-3">
                    {p.status !== 'Excluída' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setAvancarPropostaItem(p)
                          setNovoStatus(
                            p.status === 'Em Análise' ? 'Aprovada' : p.status || 'Em Análise',
                          )
                        }}
                        className="text-[11px] text-amber-500 font-medium flex items-center hover:text-amber-600 transition-colors"
                      >
                        <ArrowRight className="w-3 h-3 mr-1" /> Avançar Proposta
                      </button>
                    )}
                    <Link
                      to="/controle-propostas/propostas-criadas"
                      onClick={(e) => e.stopPropagation()}
                      className="text-[11px] text-brand-blue font-medium flex items-center hover:text-blue-700 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" /> Ver / Editar
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!selectedProposta} onOpenChange={(o) => !o && setSelectedProposta(null)}>
        <SheetContent className="sm:max-w-md w-[90vw] overflow-y-auto">
          <SheetHeader className="pb-4 border-b dark:border-slate-800">
            <SheetTitle>Proposta {selectedProposta?.numero_proposta}</SheetTitle>
            <SheetDescription className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Cliente: {selectedProposta?.expand?.cliente?.fantasia || 'Não informado'}
              <br />
              Data:{' '}
              {selectedProposta?.dt_cad
                ? format(new Date(selectedProposta.dt_cad), 'dd/MM/yyyy')
                : ''}
              {selectedProposta?.expand?.ultimo_usuario_status?.name && (
                <>
                  <br />
                  Última alteração por:{' '}
                  <span className="font-medium text-slate-900 dark:text-slate-200">
                    {selectedProposta.expand.ultimo_usuario_status.name}
                  </span>
                </>
              )}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <ProposalHistory proposalId={selectedProposta?.id} />
          </div>
        </SheetContent>
      </Sheet>

      <AdvanceProposalDialog
        open={!!avancarPropostaItem}
        onOpenChange={(open) => !open && setAvancarPropostaItem(null)}
        proposta={avancarPropostaItem}
        novoStatus={novoStatus}
        onStatusChange={setNovoStatus}
        onConfirm={handleAvancarProposta}
      />
    </div>
  )
}
