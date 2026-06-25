import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Bell, Calendar, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function Dashboard() {
  const { user } = useAuth()

  const [notificacoes, setNotificacoes] = useState<any[]>([])
  const [eventos, setEventos] = useState<any[]>([])
  const [configs, setConfigs] = useState<Record<string, boolean>>({})

  const [metrics, setMetrics] = useState({
    representativesRanking: [] as {
      name: string
      totalSales: number
    }[],
  })

  const loadData = async () => {
    try {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const startTodayStr = todayStart.toISOString().replace('T', ' ')

      const propostasAprovadas = await pb.collection('propostas').getFullList({
        filter: `status = "Aprovada"`,
        expand: 'representante',
      })

      const repStats: Record<string, { name: string; totalSales: number }> = {}

      propostasAprovadas.forEach((p) => {
        const repId = p.representante
        const repName = p.expand?.representante?.fantasia
        if (!repId || !repName) return

        if (!repStats[repId]) {
          repStats[repId] = { name: repName, totalSales: 0 }
        }
        repStats[repId].totalSales += p.valor_final || 0
      })

      const ranking = Object.values(repStats)
        .sort((a, b) => b.totalSales - a.totalSales)
        .slice(0, 10)

      setMetrics({
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="rounded-2xl shadow-sm border-slate-200 dark:border-slate-800 lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-brand-orange" />
              Ranking de Representantes (Vendas)
            </CardTitle>
            <CardDescription>
              Top 10 representantes com maior volume de vendas em propostas aprovadas
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
                      <TableHead className="text-right">Volume de Vendas</TableHead>
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
    </div>
  )
}
