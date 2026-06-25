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
import { FileText, CheckCircle2, DollarSign } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'

export default function DashboardPropostas() {
  const [propostas, setPropostas] = useState<any[]>([])
  const [selectedMonth, setSelectedMonth] = useState<Date>(startOfMonth(new Date()))
  const [selectedProposta, setSelectedProposta] = useState<any>(null)

  const months = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => {
      const d = subMonths(new Date(), i)
      return startOfMonth(d)
    })
  }, [])

  const loadData = async () => {
    try {
      const startStr = format(startOfMonth(selectedMonth), 'yyyy-MM-dd 00:00:00')
      const endStr = format(endOfMonth(selectedMonth), 'yyyy-MM-dd 23:59:59')

      const records = await pb.collection('propostas').getFullList({
        filter: `created >= "${startStr}" && created <= "${endStr}"`,
        expand: 'cliente,versao,user,ultimo_usuario_status',
      })
      setPropostas(records)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedMonth])

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
      const status = p.status || 'Em Análise' // Defaulting to 'Em Análise' if empty
      acc[status] = (acc[status] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const chartData = Object.entries(statusCount).map(([name, value]) => ({ name, value }))

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
    <div className="space-y-6 animate-fade-in p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Performance de Propostas
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Acompanhe as métricas de sucesso das propostas emitidas.
          </p>
        </div>

        <Select
          value={selectedMonth.toISOString()}
          onValueChange={(val) => setSelectedMonth(new Date(val))}
        >
          <SelectTrigger className="w-[200px] bg-white dark:bg-slate-950">
            <SelectValue placeholder="Selecione o mês" />
          </SelectTrigger>
          <SelectContent>
            {months.map((m) => (
              <SelectItem key={m.toISOString()} value={m.toISOString()} className="capitalize">
                {format(m, 'MMMM yyyy', { locale: ptBR })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Total Criadas
            </CardTitle>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded-full">
              <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {totalPropostas}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Neste mês</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Taxa de Aprovação
            </CardTitle>
            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-full">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {taxaAprovacao.toFixed(1)}%
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {aprovadas.length} aprovadas
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-violet-500 shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Valor Aprovado
            </CardTitle>
            <div className="bg-violet-50 dark:bg-violet-900/20 p-2 rounded-full">
              <DollarSign className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                valorAprovado,
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Acumulado do mês</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Distribuição de Status</CardTitle>
            <CardDescription>Proporção dos status atuais das propostas</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {chartData.length > 0 ? (
              <ChartContainer config={chartConfig} className="w-full h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[entry.name] || COLORS['Sem Status']}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Legend verticalAlign="bottom" height={36} />
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

        <Card className="shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle>Últimas Propostas do Mês</CardTitle>
            <CardDescription>Clique para visualizar o histórico de status</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto max-h-[300px] pr-2">
            <div className="space-y-3">
              {propostas.slice(0, 10).map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                  onClick={() => setSelectedProposta(p)}
                >
                  <div>
                    <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                      {p.numero_proposta}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-[200px] truncate">
                      {p.expand?.cliente?.fantasia || 'Cliente não informado'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge
                      variant="outline"
                      style={{
                        backgroundColor: (COLORS[p.status] || COLORS['Sem Status']) + '15',
                        color: COLORS[p.status] || COLORS['Sem Status'],
                        borderColor: (COLORS[p.status] || COLORS['Sem Status']) + '40',
                      }}
                    >
                      {p.status || 'Novo'}
                    </Badge>
                    <p className="text-[10px] text-slate-400">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(p.valor_final || p.valor_atual || 0)}
                    </p>
                  </div>
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
    </div>
  )
}
