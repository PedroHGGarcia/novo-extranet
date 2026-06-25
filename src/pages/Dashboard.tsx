import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Bell,
  Calendar,
  Package,
  Users,
  Briefcase,
  CheckCircle2,
  DollarSign,
  Trophy,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from 'recharts'
import { ChartContainer, ChartTooltip } from '@/components/ui/chart'

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
      <span className="text-5xl font-bold tracking-tight">{value}</span>
      <span className="text-sm font-medium opacity-90">{title}</span>
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

  const [totalClientes, setTotalClientes] = useState(0)
  const [produtosAtivos, setProdutosAtivos] = useState(0)
  const [totalRepresentantes, setTotalRepresentantes] = useState(0)
  const [eventosHoje, setEventosHoje] = useState(0)

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
      const todayEnd = new Date()
      todayEnd.setHours(23, 59, 59, 999)
      const startStr = todayStart.toISOString().replace('T', ' ')
      const endStr = todayEnd.toISOString().replace('T', ' ')

      const [clientesRes, prodRes, repsRes, eventosRes, propostasRes] = await Promise.all([
        pb.collection('clientes').getList(1, 1),
        pb.collection('produtos').getList(1, 1, { filter: "status = 'Ativo'" }),
        pb.collection('representantes').getList(1, 1),
        pb
          .collection('eventos')
          .getList(1, 1, { filter: `data >= "${startStr}" && data <= "${endStr}"` }),
        pb.collection('propostas').getFullList({ expand: 'representante' }),
      ])

      setTotalClientes(clientesRes.totalItems)
      setProdutosAtivos(prodRes.totalItems)
      setTotalRepresentantes(repsRes.totalItems)
      setEventosHoje(eventosRes.totalItems)

      const approved = propostasRes.filter((p) => p.status === 'Aprovada')
      const consolidatedValue = approved.reduce((acc, p) => acc + (p.valor_final || 0), 0)

      const repStats: Record<string, { name: string; approved: number; total: number }> = {}

      propostasRes.forEach((p) => {
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
          conversionRate: (r.approved / r.total) * 100,
        }))
        .sort((a, b) => b.conversionRate - a.conversionRate)
        .slice(0, 10)

      setMetrics({
        totalProposals: propostasRes.length,
        approvedProposals: approved.length,
        approvalRate: propostasRes.length ? (approved.length / propostasRes.length) * 100 : 0,
        consolidatedValue,
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
        filter: `data >= "${startStr}"`,
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

  useRealtime('clientes', () => loadData())
  useRealtime('produtos', () => loadData())
  useRealtime('representantes', () => loadData())
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
            Aqui está o resumo das suas atividades e informações importantes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="border-t-4 border-t-emerald-500 shadow-sm rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center justify-between">
              Taxa de Aprovação Global
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">
              {metrics.approvalRate.toFixed(1)}%
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {metrics.approvedProposals} aprovadas de {metrics.totalProposals} totais
            </p>
          </CardContent>
        </Card>

        <Card className="border-t-4 border-t-blue-500 shadow-sm rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center justify-between">
              Volume de Negócios
              <DollarSign className="h-4 w-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-800 dark:text-slate-100">
              {formatCurrency(metrics.consolidatedValue)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Soma do valor final das propostas aprovadas
            </p>
          </CardContent>
        </Card>
      </div>

      {isVisible('cards_resumo') && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Clientes"
            value={totalClientes}
            colorClass="bg-brand-blue"
            icon={Users}
          />
          <MetricCard
            title="Produtos Ativos"
            value={produtosAtivos}
            colorClass="bg-brand-cyan"
            icon={Package}
          />
          <MetricCard
            title="Representantes"
            value={totalRepresentantes}
            colorClass="bg-brand-orange"
            icon={Briefcase}
          />
          <MetricCard
            title="Eventos Hoje"
            value={eventosHoje}
            colorClass="bg-brand-green"
            icon={Calendar}
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
              Top 10 representantes com maior taxa de conversão (Propostas Aprovadas / Total)
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 pl-0">
            {metrics.representativesRanking.length === 0 ? (
              <p className="text-sm text-slate-500 pl-6">Nenhum dado de conversão disponível.</p>
            ) : (
              <ChartContainer
                config={{
                  conversionRate: { label: 'Taxa de Conversão (%)', color: 'hsl(var(--primary))' },
                }}
                className="h-[350px] w-full"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={metrics.representativesRanking}
                    layout="vertical"
                    margin={{ top: 0, right: 30, left: 40, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis
                      type="number"
                      unit="%"
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 100]}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tickLine={false}
                      axisLine={false}
                      width={120}
                    />
                    <ChartTooltip
                      cursor={{ fill: 'transparent' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-lg shadow-sm text-sm">
                              <p className="font-bold text-slate-900 dark:text-slate-100">
                                {data.name}
                              </p>
                              <div className="mt-2 space-y-1">
                                <p className="text-slate-600 dark:text-slate-400">
                                  Conversão:{' '}
                                  <span className="font-semibold text-brand-orange">
                                    {data.conversionRate.toFixed(1)}%
                                  </span>
                                </p>
                                <p className="text-slate-600 dark:text-slate-400">
                                  Propostas Aprovadas:{' '}
                                  <span className="font-medium text-slate-900 dark:text-slate-100">
                                    {data.approved}
                                  </span>
                                </p>
                                <p className="text-slate-600 dark:text-slate-400">
                                  Total Propostas:{' '}
                                  <span className="font-medium text-slate-900 dark:text-slate-100">
                                    {data.total}
                                  </span>
                                </p>
                              </div>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Bar
                      dataKey="conversionRate"
                      fill="var(--color-conversionRate)"
                      radius={[0, 4, 4, 0]}
                      barSize={24}
                    >
                      {metrics.representativesRanking.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill="var(--color-conversionRate)" />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
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
