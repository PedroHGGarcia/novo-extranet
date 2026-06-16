import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import pb from '@/lib/pocketbase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Bell, Calendar, Package, Users, Briefcase } from 'lucide-react'
import { cn } from '@/lib/utils'

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

  const loadData = async () => {
    try {
      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const todayEnd = new Date()
      todayEnd.setHours(23, 59, 59, 999)
      const startStr = todayStart.toISOString().replace('T', ' ')
      const endStr = todayEnd.toISOString().replace('T', ' ')

      const [clientesRes, prodRes, repsRes, eventosRes] = await Promise.all([
        pb.collection('clientes').getList(1, 1),
        pb.collection('produtos').getList(1, 1, { filter: "status = 'Ativo'" }),
        pb.collection('representantes').getList(1, 1),
        pb
          .collection('eventos')
          .getList(1, 1, { filter: `data >= "${startStr}" && data <= "${endStr}"` }),
      ])

      setTotalClientes(clientesRes.totalItems)
      setProdutosAtivos(prodRes.totalItems)
      setTotalRepresentantes(repsRes.totalItems)
      setEventosHoje(eventosRes.totalItems)

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
