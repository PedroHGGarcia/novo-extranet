import { useState, useEffect } from 'react'
import { CalendarDays, Filter, X, CalendarIcon, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { DateRange } from 'react-day-picker'
import pb from '@/lib/pocketbase/client'
import { useRealtime } from '@/hooks/use-realtime'
import { Badge } from '@/components/ui/badge'

interface Evento {
  id: string
  titulo: string
  data: string
  categoria: string
  descricao: string
  status: string
}

export default function Eventos() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [categoria, setCategoria] = useState<string>('todas')
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const conditions: string[] = []

      if (categoria && categoria !== 'todas') {
        conditions.push(`categoria = '${categoria}'`)
      }

      if (dateRange?.from) {
        const fromStr = dateRange.from.toISOString().replace('T', ' ').substring(0, 19)
        conditions.push(`data >= '${fromStr}'`)
      }

      if (dateRange?.to) {
        const toDate = new Date(dateRange.to)
        toDate.setHours(23, 59, 59, 999)
        const toStr = toDate.toISOString().replace('T', ' ').substring(0, 19)
        conditions.push(`data <= '${toStr}'`)
      }

      const filterStr = conditions.length > 0 ? conditions.join(' && ') : ''

      const records = await pb.collection('eventos').getFullList<Evento>({
        sort: '-data',
        filter: filterStr,
      })
      setEventos(records)
    } catch (err) {
      console.error('Erro ao carregar eventos:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [dateRange, categoria])

  useRealtime('eventos', () => {
    loadData()
  })

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-brand-green/10 rounded-xl">
          <CalendarDays className="h-7 w-7 text-brand-green" />
        </div>
        <div>
          <h1 className="!mb-0 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Controle de Eventos
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Gerencie e filtre eventos, visitas e reuniões.
          </p>
        </div>
      </div>

      <Card className="rounded-2xl border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Filter className="h-5 w-5 text-brand-green" />
              Filtros Avançados
            </CardTitle>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <Select value={categoria} onValueChange={setCategoria}>
                <SelectTrigger className="w-full sm:w-[180px] bg-white rounded-xl transition-all duration-300 border-slate-200 focus:ring-brand-green">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="todas">Todas as Categorias</SelectItem>
                  <SelectItem value="Reunião">Reunião</SelectItem>
                  <SelectItem value="Venda">Venda</SelectItem>
                  <SelectItem value="Visita">Visita</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full sm:w-[260px] justify-start text-left font-normal bg-white rounded-xl transition-all duration-300 hover:bg-slate-50 active:scale-95 border-slate-200',
                      !dateRange && 'text-muted-foreground',
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-brand-green" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'dd/MM/yyyy')} -{' '}
                          {format(dateRange.to, 'dd/MM/yyyy')}
                        </>
                      ) : (
                        format(dateRange.from, 'dd/MM/yyyy')
                      )
                    ) : (
                      <span>Filtrar por data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-xl" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={2}
                    locale={ptBR}
                    className="rounded-xl"
                  />
                </PopoverContent>
              </Popover>

              {(dateRange || categoria !== 'todas') && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setDateRange(undefined)
                    setCategoria('todas')
                  }}
                  className="px-3 rounded-xl text-slate-500 hover:text-slate-900 transition-all duration-300 active:scale-95"
                >
                  <X className="h-4 w-4 mr-2" />
                  Limpar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin text-brand-green mb-4" />
              <p>Carregando eventos...</p>
            </div>
          ) : eventos.length === 0 ? (
            <div className="p-16 text-center text-slate-500">
              Nenhum evento encontrado para os filtros selecionados.
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {eventos.map((evento) => (
                <div
                  key={evento.id}
                  className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors duration-200"
                >
                  <div className="space-y-1.5">
                    <h3 className="font-semibold text-slate-900 text-base">{evento.titulo}</h3>
                    <p className="text-sm text-slate-500 line-clamp-2 max-w-2xl">
                      {evento.descricao}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 shrink-0">
                    <Badge
                      variant="outline"
                      className={cn(
                        'rounded-lg font-medium px-2.5 py-0.5',
                        evento.categoria === 'Reunião' &&
                          'bg-blue-50 text-blue-700 border-blue-200',
                        evento.categoria === 'Venda' &&
                          'bg-green-50 text-green-700 border-green-200',
                        evento.categoria === 'Visita' &&
                          'bg-orange-50 text-orange-700 border-orange-200',
                        evento.categoria === 'Outros' &&
                          'bg-slate-100 text-slate-700 border-slate-200',
                      )}
                    >
                      {evento.categoria}
                    </Badge>
                    <div className="text-sm font-medium text-slate-600 bg-slate-100/80 px-3 py-1.5 rounded-lg border border-slate-200/60 shadow-sm">
                      {format(new Date(evento.data), "dd 'de' MMM, yyyy", { locale: ptBR })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
