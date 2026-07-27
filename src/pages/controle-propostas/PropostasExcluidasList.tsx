import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { RotateCcw, Trash2, ArrowDownUp, ArrowUp, ArrowDown, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getPropostasPaginated, updateProposta, type Proposta } from '@/services/propostas'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import pb from '@/lib/pocketbase/client'
import { formatCurrency } from './utils'

export function PropostasExcluidasList() {
  const { user } = useAuth()
  const { toast } = useToast()

  const [page, setPage] = useState(1)
  const [perPage] = useState(50)
  const [sortField, setSortField] = useState<string>('updated')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [data, setData] = useState<Proposta[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [restoreItem, setRestoreItem] = useState<Proposta | null>(null)
  const [deleteItem, setDeleteItem] = useState<Proposta | null>(null)

  const loadData = async () => {
    try {
      setIsLoading(true)
      const sortParam = sortDirection === 'desc' ? `-${sortField}` : sortField
      const res = await getPropostasPaginated(page, perPage, sortParam, "status = 'Excluída'")
      setData(res.items)
      setTotalItems(res.totalItems)
    } catch (error) {
      console.error('Failed to load excluded propostas', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [page, perPage, sortField, sortDirection])
  useRealtime('propostas', () => {
    loadData()
  })

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    setPage(1)
  }

  const renderSortableHead = (label: string, field: string) => {
    const isActive = sortField === field
    return (
      <TableHead className="text-[#337ab7] font-normal text-[11px] whitespace-nowrap bg-white border-b-2 border-slate-200 py-3 px-3 h-auto">
        <div
          className="flex items-center gap-1 cursor-pointer hover:underline"
          onClick={() => handleSort(field)}
        >
          {label}
          {isActive ? (
            sortDirection === 'asc' ? (
              <ArrowUp className="w-3 h-3" />
            ) : (
              <ArrowDown className="w-3 h-3" />
            )
          ) : (
            <ArrowDownUp className="w-3 h-3 opacity-50" />
          )}
        </div>
      </TableHead>
    )
  }

  const handleRestore = async () => {
    if (!restoreItem) return
    try {
      await updateProposta(restoreItem.id, {
        status: 'Em Análise',
        ultimo_usuario_status: user?.id,
        data_alteracao_status: format(new Date(), 'yyyy-MM-dd'),
      })
      toast({ title: 'Proposta restaurada com sucesso' })
      setRestoreItem(null)
      loadData()
    } catch {
      toast({ title: 'Erro ao restaurar proposta', variant: 'destructive' })
    }
  }

  const handlePermanentDelete = async () => {
    if (!deleteItem) return
    try {
      await pb.collection('propostas').delete(deleteItem.id)
      toast({ title: 'Proposta excluída permanentemente' })
      setDeleteItem(null)
      loadData()
    } catch {
      toast({ title: 'Erro ao excluir proposta', variant: 'destructive' })
    }
  }

  const totalPages = Math.ceil(totalItems / perPage) || 1
  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1)
  const start = totalItems === 0 ? 0 : (page - 1) * perPage + 1
  const end = Math.min(page * perPage, totalItems)

  return (
    <div className="flex flex-col h-full bg-white text-slate-700 font-sans overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2 shrink-0">
        <h2 className="text-[#337ab7] text-sm font-medium">Propostas Excluídas ({totalItems})</h2>
        <div className="flex items-center text-[11px] text-[#337ab7] gap-4">
          <div className="flex items-center space-x-1">
            {pages.map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={cn(
                  'px-2 py-1 min-w-[24px] text-center rounded-sm transition-colors',
                  p === page ? 'bg-[#337ab7] text-white' : 'hover:bg-slate-100',
                )}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-1 py-1 hover:bg-slate-100 rounded-sm"
              disabled={page === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <span className="text-slate-600">
            {start}-{end} de {totalItems.toLocaleString('pt-BR')}
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
            <TableRow className="border-b-2 border-slate-200 hover:bg-transparent">
              {renderSortableHead('Proposta', 'numero_proposta')}
              {renderSortableHead('Cliente', 'cliente_original')}
              {renderSortableHead('Valor', 'valor_final')}
              {renderSortableHead('Data Exclusão', 'data_alteracao_status')}
              <TableHead className="text-[#337ab7] font-normal text-[11px] whitespace-nowrap bg-white border-b-2 border-slate-200 py-3 px-3 h-auto">
                Notas
              </TableHead>
              <TableHead className="text-[#337ab7] font-normal text-[11px] whitespace-nowrap bg-white border-b-2 border-slate-200 py-3 px-3 h-auto text-center">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500 text-sm">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-slate-500 text-sm">
                  Nenhuma proposta excluída encontrada.
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow key={item.id} className="hover:bg-slate-50 border-b border-slate-200">
                  <TableCell className="align-top py-2.5 px-3 min-w-[100px]">
                    <div className="text-slate-600 text-xs mb-1 font-medium">
                      {item.numero_proposta}
                    </div>
                    {item.revisao && (
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1 py-0 h-4 bg-slate-50 text-slate-500 border-slate-200"
                      >
                        Rev {item.revisao}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell
                    className="align-top py-2.5 px-3 text-slate-700 text-[10px] uppercase max-w-[200px] truncate"
                    title={
                      item.expand?.cliente?.razao_social ||
                      item.expand?.cliente?.fantasia ||
                      item.cliente_original
                    }
                  >
                    {item.expand?.cliente?.razao_social ||
                      item.expand?.cliente?.fantasia ||
                      item.cliente_original ||
                      '-'}
                  </TableCell>
                  <TableCell className="align-top py-2.5 px-3 text-slate-700 text-[10px] whitespace-nowrap font-medium">
                    {formatCurrency(item.valor_final, item.moeda)}
                  </TableCell>
                  <TableCell className="align-top py-2.5 px-3 text-slate-700 text-[10px] whitespace-nowrap">
                    {item.data_alteracao_status
                      ? item.data_alteracao_status.substring(0, 10).split('-').reverse().join('/')
                      : '-'}
                  </TableCell>
                  <TableCell
                    className="align-top py-2.5 px-3 text-slate-500 text-[10px] max-w-[200px] truncate"
                    title={item.notas_internas || item.motivo_perda || ''}
                  >
                    {item.notas_internas || item.motivo_perda || '-'}
                  </TableCell>
                  <TableCell className="align-top py-2.5 px-3">
                    <div className="flex items-center gap-2 justify-center">
                      <button
                        onClick={() => setRestoreItem(item)}
                        className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700 hover:underline text-[11px] font-medium"
                        title="Restaurar proposta"
                      >
                        <RotateCcw className="h-3.5 w-3.5" /> Restaurar
                      </button>
                      <button
                        onClick={() => setDeleteItem(item)}
                        className="flex items-center gap-1 text-rose-600 hover:text-rose-700 hover:underline text-[11px] font-medium"
                        title="Excluir permanentemente"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Excluir
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!restoreItem} onOpenChange={(open) => !open && setRestoreItem(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Restaurar Proposta</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-600">
              Tem certeza que deseja restaurar a proposta{' '}
              <strong className="text-slate-900">{restoreItem?.numero_proposta}</strong>? A proposta
              voltará para o status "Em Análise".
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRestoreItem(null)}>
              Cancelar
            </Button>
            <Button onClick={handleRestore} className="bg-emerald-600 hover:bg-emerald-700">
              Restaurar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Excluir Permanentemente</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-600">
              Tem certeza que deseja excluir{' '}
              <strong className="text-rose-600">permanentemente</strong> a proposta{' '}
              <strong className="text-slate-900">{deleteItem?.numero_proposta}</strong>? Esta ação
              não pode ser desfeita.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteItem(null)}>
              Cancelar
            </Button>
            <Button onClick={handlePermanentDelete} className="bg-rose-600 hover:bg-rose-700">
              Excluir Permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
