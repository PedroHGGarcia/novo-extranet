import { useState, useEffect } from 'react'
import { Monitor, Users, MapPin, Activity, LayoutDashboard, Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import pb from '@/lib/pocketbase/client'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

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
      className="absolute -bottom-6 -right-4 h-32 w-32 opacity-20 transition-transform duration-500 hover:scale-110"
      strokeWidth={1.5}
    />
  </div>
)

export default function Index() {
  const { user } = useAuth()

  const [totalClientes, setTotalClientes] = useState(0)
  const [activeRepresentantes, setActiveRepresentantes] = useState(0)
  const [totalRegioes, setTotalRegioes] = useState(0)
  const [recentEventsCount, setRecentEventsCount] = useState(0)
  const [eventsTrend, setEventsTrend] = useState<{ date: string; count: number }[]>([])

  const loadData = async () => {
    try {
      const [clientesRes, repsRes, regioesRes, eventsRes] = await Promise.all([
        pb.collection('clientes').getList(1, 1),
        pb
          .collection('representantes')
          .getList(1, 1, { filter: "status ~ 'ativ' || status ~ 'Ativ'" }),
        pb.collection('regioes').getList(1, 1),
        pb.collection('eventos').getList(1, 1),
      ])

      setTotalClientes(clientesRes.totalItems)
      setActiveRepresentantes(repsRes.totalItems)
      setTotalRegioes(regioesRes.totalItems)
      setRecentEventsCount(eventsRes.totalItems)

      // Chart data
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
      sevenDaysAgo.setHours(0, 0, 0, 0)
      const filterDate = sevenDaysAgo.toISOString().replace('T', ' ')

      const records = await pb.collection('auditoria').getFullList({
        filter: `created >= "${filterDate}"`,
        sort: '+created',
      })

      const grouped = records.reduce(
        (acc, curr) => {
          const date = curr.created.split(' ')[0]
          acc[date] = (acc[date] || 0) + 1
          return acc
        },
        {} as Record<string, number>,
      )

      // Fill missing days
      const trendData = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().split('T')[0]
        trendData.push({
          date: dateStr,
          count: grouped[dateStr] || 0,
        })
      }

      setEventsTrend(trendData)
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('auditoria', () => {
    loadData()
  })
  useRealtime('clientes', () => {
    loadData()
  })
  useRealtime('representantes', () => {
    loadData()
  })
  useRealtime('regioes', () => {
    loadData()
  })
  useRealtime('eventos', () => {
    loadData()
  })

  const chartConfig = {
    count: {
      label: 'Ações do Sistema',
      color: 'hsl(var(--brand-blue))',
    },
  }

  const handleExportCSV = async () => {
    try {
      const eventos = await pb.collection('eventos').getFullList()
      let csv = `Indicadores do Dashboard\n`
      csv += `Total de Clientes,${totalClientes}\n`
      csv += `Representantes Ativos,${activeRepresentantes}\n`
      csv += `Cobertura Regional,${totalRegioes}\n`
      csv += `Eventos Registrados,${recentEventsCount}\n\n`

      csv += 'Detalhes dos Eventos\n'
      csv += 'Titulo,Categoria,Data,Status\n'
      eventos.forEach((e: any) => {
        csv += `"${e.titulo}",${e.categoria},${e.data},${e.status}\n`
      })

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `relatorio_dashboard_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting CSV:', error)
    }
  }

  const handleExportPDF = () => {
    window.print()
  }

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-blue/10 rounded-xl">
            <LayoutDashboard className="h-7 w-7 text-brand-blue" />
          </div>
          <div>
            <h1 className="!mb-0 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Painel Principal
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Visão geral e indicadores de performance do sistema.
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="gap-2 rounded-xl transition-all duration-300 active:scale-95 border-slate-200 bg-white hover:bg-slate-50"
            >
              <Download className="h-4 w-4 text-brand-blue" />
              Exportar Relatório
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl p-1">
            <DropdownMenuItem onClick={handleExportCSV} className="cursor-pointer rounded-lg">
              Exportar CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportPDF} className="cursor-pointer rounded-lg">
              Exportar PDF (Imprimir)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total de Clientes"
          value={totalClientes}
          colorClass="bg-brand-blue"
          icon={Users}
        />
        <MetricCard
          title="Representantes Ativos"
          value={activeRepresentantes}
          colorClass="bg-brand-cyan"
          icon={Monitor}
        />
        <MetricCard
          title="Cobertura Regional"
          value={totalRegioes}
          colorClass="bg-brand-orange"
          icon={MapPin}
        />
        <MetricCard
          title="Eventos Registrados"
          value={recentEventsCount}
          colorClass="bg-brand-green"
          icon={Activity}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2 rounded-2xl shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Atividade do Sistema</CardTitle>
            <CardDescription>
              Volume de ações registradas na auditoria nos últimos 7 dias.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full mt-4">
              <ChartContainer config={chartConfig} className="h-full w-full">
                <AreaChart data={eventsTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-count)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--color-count)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--muted-foreground)/0.2)"
                  />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={12}
                    tickFormatter={(value) => {
                      const date = new Date(value + 'T00:00:00')
                      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
                    }}
                    className="text-xs font-medium text-slate-500"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={12}
                    className="text-xs font-medium text-slate-500"
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="var(--color-count)"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorCount)"
                  />
                </AreaChart>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
          <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-xl font-semibold">Informações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <div className="divide-y divide-slate-100 dark:divide-slate-800 h-full flex flex-col">
              <div className="p-5 flex items-start gap-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50 flex-1">
                <div className="p-2.5 rounded-xl bg-brand-blue/10 text-brand-blue shrink-0">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Novos Clientes
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    Mantenha sua base atualizada para melhores resultados e insights.
                  </p>
                </div>
              </div>
              <div className="p-5 flex items-start gap-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50 flex-1">
                <div className="p-2.5 rounded-xl bg-brand-orange/10 text-brand-orange shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Expansão Regional
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    Monitore o alcance das suas representações em todo o território.
                  </p>
                </div>
              </div>
              <div className="p-5 flex items-start gap-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-900/50 flex-1">
                <div className="p-2.5 rounded-xl bg-brand-green/10 text-brand-green shrink-0">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Auditoria Contínua
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    Toda atividade do sistema é registrada para segurança e compliance.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
