import { useState, useEffect, useMemo } from 'react'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { FileText, CheckCircle2, DollarSign, ArrowRight, TrendingDown } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { ProposalHistory } from '@/components/ProposalHistory'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { useAuth } from '@/hooks/use-auth'
import { updateProposta } from '@/services/propostas'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { getRepresentantes } from '@/services/cadastros'

export default function DashboardPropostas() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [propostas, setPropostas] = useState<any[]>([])
  const [selectedMonth, setSelectedMonth] = useState<Date>(startOfMonth(new Date()))
  const [selectedProposta, setSelectedProposta] = useState<any>(null)

  const [avancarPropostaItem, setAvancarPropostaItem] = useState<any>(null)
  const [novoStatus, setNovoStatus] = useState<string>('')
  const [representantes, setRepresentantes] = useState<any[]>([])
  const [selectedRepresentante, setSelectedRepresentante] = useState<string>('todos')

  const months = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => {
      const d = subMonths(new Date(), i)
      return startOfMonth(d)
    })
  }, [])

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
      const startStr = format(startOfMonth(selectedMonth), 'yyyy-MM-dd')
      const endStr = format(endOfMonth(selectedMonth), 'yyyy-MM-dd')

      let filter = `dt_cad >= "${startStr}" && dt_cad <= "${endStr}"`
      if (selectedRepresentante !== 'todos') {
        filter += ` && representante = "${selectedRepresentante}"`
      }

      const records = await pb.collection('propostas').getFullList({
        filter,
        expand: 'cliente,versao,user,ultimo_usuario_status,representante',
        sort: '-created',
      })
      setPropostas(records)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedMonth, selectedRepresentante])

  useRealtime('propostas', () => loadData())

  const totalPropostas = propostas.length
  const aprovadas = propostas.filter((p) => p.status === 'Aprovada')
  const taxaAprovacao = totalPropostas > 0 ? (aprovadas.length / totalPropostas) * 100 : 0
  const valorAprovado = aprovadas.reduce(
    (acc, p) => acc + (p.valor_final || p.valor_atual || p.valor_sem_desconto || 0),
    0,
  )

  const statusCount = propostas.reduce(
    (acc, p) => {
      const status = p.status || 'Em Análise'
      acc[status] = (acc[status] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const chartData = Object.entries(statusCount).map(([name, value]) => ({ name, value }))

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

  const COLORS: Record<string, string> = {
    Aprovada: '#10b981',
    Recusada: '#ef4444',
    'Em Análise': '#f59e0b',
    'Sem Status': '#94a3b8',
  }

  const chartConfig = {
    value: { label: 'Propostas' },
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Performance de Propostas
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Acompanhe as métricas de sucesso das propostas emitidas.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Representante
            </span>
            <Select
              value={selectedRepresentante}
              onValueChange={(val) => setSelectedRepresentante(val)}
            >
              <SelectTrigger className="w-[200px] bg-white dark:bg-slate-950 text-sm">
                <SelectValue placeholder="Selecione o representante" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos" className="text-sm">
                  Todos
                </SelectItem>
                {representantes.map((r) => (
                  <SelectItem key={r.id} value={r.id} className="text-sm">
                    {r.fantasia || r.razao_social || 'Sem nome'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Mês</span>
            <Select
              value={selectedMonth.toISOString()}
              onValueChange={(val) => setSelectedMonth(new Date(val))}
            >
              <SelectTrigger className="w-[180px] bg-white dark:bg-slate-950 text-sm">
                <SelectValue placeholder="Selecione o mês" />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem
                    key={m.toISOString()}
                    value={m.toISOString()}
                    className="capitalize text-sm"
                  >
                    {format(m, 'MMMM yyyy', { locale: ptBR })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="rounded-2xl shadow-sm border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4">
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 font-bold text-lg shrink-0">
            $
          </div>
          <div className="flex flex-col flex-1">
            <span className="text-[13px] text-slate-500 font-medium">Dólar Americano</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                R$ 5.1859
              </span>
              <span className="text-[11px] text-rose-500 font-medium flex items-center">
                <TrendingDown className="h-3 w-3 mr-0.5" /> 0.16%
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1">Fechamento anterior: R$ 5.1941</span>
          </div>
        </Card>

        <Card className="rounded-2xl shadow-sm border-slate-200 dark:border-slate-800 p-5 flex items-center gap-4">
          <div className="flex items-center justify-center h-10 w-10 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-500 dark:text-blue-400 font-bold text-lg shrink-0">
            €
          </div>
          <div className="flex flex-col flex-1">
            <span className="text-[13px] text-slate-500 font-medium">Euro</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                R$ 5.8997
              </span>
              <span className="text-[11px] text-rose-500 font-medium flex items-center">
                <TrendingDown className="h-3 w-3 mr-0.5" /> 0.00%
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1">Fechamento anterior: R$ 5.8997</span>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-2xl shadow-sm border-slate-200 dark:border-slate-800 relative overflow-hidden flex flex-col justify-between p-5">
          <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-blue-500"></div>
          <div className="flex justify-between items-start mb-4">
            <span className="text-[13px] font-medium text-slate-600 dark:text-slate-400">
              Total Criadas
            </span>
            <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-500 p-1.5 rounded-md">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {totalPropostas}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Neste mês</p>
          </div>
        </Card>

        <Card className="rounded-2xl shadow-sm border-slate-200 dark:border-slate-800 relative overflow-hidden flex flex-col justify-between p-5">
          <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-emerald-500"></div>
          <div className="flex justify-between items-start mb-4">
            <span className="text-[13px] font-medium text-slate-600 dark:text-slate-400">
              Taxa de Aprovação
            </span>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 p-1.5 rounded-md">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {taxaAprovacao.toFixed(1)}%
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {aprovadas.length} aprovadas
            </p>
          </div>
        </Card>

        <Card className="rounded-2xl shadow-sm border-slate-200 dark:border-slate-800 relative overflow-hidden flex flex-col justify-between p-5">
          <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-violet-400"></div>
          <div className="flex justify-between items-start mb-4">
            <span className="text-[13px] font-medium text-slate-600 dark:text-slate-400">
              Valor Aprovado
            </span>
            <div className="bg-violet-50 dark:bg-violet-900/20 text-violet-500 p-1.5 rounded-md">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                valorAprovado,
              )}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Acumulado do mês</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="rounded-2xl shadow-sm border-slate-200 dark:border-slate-800">
          <CardHeader className="px-5 pt-5 pb-2">
            <CardTitle className="text-lg">Distribuição de Status</CardTitle>
            <CardDescription className="text-xs">
              Proporção dos status atuais das propostas
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[280px] pb-2 px-2">
            {chartData.length > 0 ? (
              <ChartContainer config={chartConfig} className="w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="45%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[entry.name] || COLORS['Sem Status']}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="square"
                      iconSize={8}
                      wrapperStyle={{ fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                Nenhum dado para exibir
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm border-slate-200 dark:border-slate-800 flex flex-col h-full">
          <CardHeader className="px-5 pt-5 pb-3">
            <CardTitle className="text-lg">Últimas Propostas do Mês</CardTitle>
            <CardDescription className="text-xs">
              Clique para visualizar o histórico de status
            </CardDescription>
          </CardHeader>
          <CardContent className="px-5 pb-5 pt-0 flex-1 overflow-auto max-h-[280px]">
            <div className="space-y-3">
              {propostas.slice(0, 10).map((p) => (
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
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <span className="inline-flex items-center justify-center px-3 py-0.5 rounded-full text-[10px] font-medium bg-white border border-slate-200 text-slate-500 dark:bg-slate-900 dark:border-slate-700 dark:text-slate-400 shadow-sm">
                        {p.status || 'Novo'}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-1.5 font-medium">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(p.valor_final || p.valor_atual || 0)}
                      </div>
                    </div>
                  </div>
                  {p.status !== 'Excluída' && (
                    <div className="mt-2.5">
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
                    </div>
                  )}
                </div>
              ))}
              {propostas.length === 0 && (
                <div className="flex items-center justify-center h-full text-slate-500 text-sm py-8">
                  Nenhuma proposta encontrada
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Sheet open={!!selectedProposta} onOpenChange={(o) => !o && setSelectedProposta(null)}>
        <SheetContent className="sm:max-w-md w-[90vw] overflow-y-auto">
          <SheetHeader className="pb-4 border-b dark:border-slate-800">
            <SheetTitle>Proposta {selectedProposta?.numero_proposta}</SheetTitle>
            <SheetDescription className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Cliente: {selectedProposta?.expand?.cliente?.fantasia || 'Não informado'}
              <br />
              Data:{' '}
              {selectedProposta?.created
                ? format(new Date(selectedProposta.created), 'dd/MM/yyyy')
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

      <Dialog
        open={!!avancarPropostaItem}
        onOpenChange={(open) => !open && setAvancarPropostaItem(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Avançar Proposta</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-600 mb-4">
              Selecione o novo status para a proposta{' '}
              <strong className="text-slate-900">{avancarPropostaItem?.numero_proposta}</strong>:
            </p>
            <div className="flex bg-slate-100 rounded-sm p-1 gap-1 border border-slate-200">
              {['Em Análise', 'Aprovada', 'Recusada', 'Excluída'].map((statusOption) => {
                const isSelected = novoStatus === statusOption
                return (
                  <button
                    key={statusOption}
                    onClick={() => setNovoStatus(statusOption)}
                    className={cn(
                      'flex-1 text-[11px] font-medium py-1.5 rounded-sm transition-all',
                      isSelected
                        ? statusOption === 'Aprovada'
                          ? 'bg-emerald-500 text-white shadow-sm'
                          : statusOption === 'Recusada'
                            ? 'bg-rose-500 text-white shadow-sm'
                            : statusOption === 'Excluída'
                              ? 'bg-slate-500 text-white shadow-sm'
                              : 'bg-amber-500 text-white shadow-sm'
                        : 'text-slate-500 hover:bg-slate-200 hover:shadow-sm',
                    )}
                  >
                    {statusOption}
                  </button>
                )
              })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAvancarPropostaItem(null)}>
              Cancelar
            </Button>
            <Button
              onClick={handleAvancarProposta}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
