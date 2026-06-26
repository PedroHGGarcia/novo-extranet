import { useState, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { getPropostasPaginated, type Proposta } from '@/services/propostas'
import { useRealtime } from '@/hooks/use-realtime'
import { cn } from '@/lib/utils'
import { ArrowDownUp, ArrowUp, ArrowDown, ChevronRight, Eye } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ProposalHistory } from '@/components/ProposalHistory'

const formatCurrency = (value: number | undefined, currency: string = 'BRL') => {
  if (value === undefined) return '-'
  try {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency === 'US$' ? 'USD' : currency || 'BRL',
    }).format(value)
  } catch (e) {
    return `${currency} ${value}`
  }
}

export default function PropostasAvancadas() {
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(50)
  const [sortField, setSortField] = useState<string>('updated')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [data, setData] = useState<Proposta[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [viewProposta, setViewProposta] = useState<Proposta | null>(null)

  const loadData = async () => {
    try {
      setIsLoading(true)
      const sortParam = sortDirection === 'desc' ? `-${sortField}` : sortField
      const filterParam = "(status = 'Aprovada' || status = 'Recusada')"
      const res = await getPropostasPaginated(page, perPage, sortParam, filterParam)
      setData(res.items)
      setTotalItems(res.totalItems)
    } catch (error) {
      console.error('Failed to load propostas', error)
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

  const handleView = (item: Proposta) => {
    setViewProposta(item)
    setIsViewModalOpen(true)
  }

  const printProposal = (item: Proposta) => {
    window.open(`/controle-propostas/proposta-pdf/${item.id}`, '_blank')
  }

  const renderTopPagination = () => {
    const totalPages = Math.ceil(totalItems / perPage) || 1
    const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1)
    const start = totalItems === 0 ? 0 : (page - 1) * perPage + 1
    const end = Math.min(page * perPage, totalItems)

    return (
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
        <div className="flex items-center gap-2 text-slate-600">
          <span>
            {start}-{end} de {totalItems.toLocaleString('pt-BR')}
          </span>
          <div className="flex items-center gap-1 border border-slate-200 rounded-sm bg-white px-1">
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value))
                setPage(1)
              }}
              className="border-none bg-transparent outline-none cursor-pointer text-slate-600 text-xs py-0.5 pl-1"
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>
    )
  }

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

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] bg-white text-slate-700 font-sans pt-2 rounded-md shadow-sm border border-slate-200 overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 shrink-0">
        <h2 className="text-[#337ab7] text-[15px] font-normal">Propostas Avançadas</h2>
        {renderTopPagination()}
      </div>

      <div className="flex-1 min-h-0 m-0 overflow-y-auto outline-none">
        <Table>
          <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
            <TableRow className="border-b-2 border-slate-200 hover:bg-transparent">
              {renderSortableHead('Proposta', 'numero_proposta')}
              {renderSortableHead('Cliente', 'cliente_original')}
              {renderSortableHead('Status', 'status')}
              {renderSortableHead('Valor Final', 'valor_final')}
              {renderSortableHead('Dt. Cad', 'dt_cad')}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500 text-sm">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500 text-sm">
                  Nenhuma proposta avançada encontrada.
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow
                  key={item.id}
                  className="hover:bg-slate-50 border-b border-slate-200 group"
                >
                  <TableCell className="align-top py-2.5 px-3 min-w-[120px] border-r border-slate-100">
                    <div className="text-slate-600 text-xs mb-1 font-medium">
                      {item.numero_proposta}
                    </div>
                    <div className="flex flex-col gap-1 mt-1">
                      <button
                        onClick={() => handleView(item)}
                        className="flex items-center text-[#337ab7] hover:underline text-[11px] w-fit"
                      >
                        <Eye className="h-3 w-3 mr-1" /> Visualizar
                      </button>
                      <button
                        onClick={() => printProposal(item)}
                        className="flex items-center text-emerald-600 hover:text-emerald-700 hover:underline text-[11px] w-fit mt-1"
                      >
                        Gerar PDF
                      </button>
                    </div>
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
                  <TableCell className="align-top py-2.5 px-3">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] font-normal border whitespace-nowrap px-1.5 py-0',
                        item.status === 'Aprovada' &&
                          'bg-emerald-50 text-emerald-700 border-emerald-200',
                        item.status === 'Recusada' && 'bg-rose-50 text-rose-700 border-rose-200',
                      )}
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="align-top py-2.5 px-3 text-slate-700 text-[10px] whitespace-nowrap font-medium">
                    {formatCurrency(item.valor_final, item.moeda)}
                  </TableCell>
                  <TableCell className="align-top py-2.5 px-3 text-slate-700 text-[10px] whitespace-nowrap">
                    {item.dt_cad
                      ? item.dt_cad.substring(0, 10).split('-').reverse().join('/')
                      : '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2 shrink-0">
            <DialogTitle className="text-xl font-normal text-[#337ab7]">
              Visualizar Proposta: {viewProposta?.numero_proposta}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6 pt-2">
            {viewProposta && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm text-slate-700">
                <div className="flex flex-col border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Cliente
                  </span>
                  <span className="font-medium">
                    {viewProposta.expand?.cliente?.fantasia ||
                      viewProposta.expand?.cliente?.razao_social ||
                      viewProposta.cliente_original ||
                      '-'}
                  </span>
                </div>
                <div className="flex flex-col border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Contato
                  </span>
                  <span className="font-medium">{viewProposta.contato || '-'}</span>
                </div>
                <div className="flex flex-col border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Telefone
                  </span>
                  <span className="font-medium">{viewProposta.telefone || '-'}</span>
                </div>
                <div className="flex flex-col border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Versão
                  </span>
                  <span className="font-medium">
                    {viewProposta.expand?.versao?.nome || viewProposta.versao_original || '-'}
                  </span>
                </div>
                <div className="flex flex-col border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Representante
                  </span>
                  <span className="font-medium">
                    {viewProposta.expand?.representante?.fantasia ||
                      viewProposta.representante_original ||
                      '-'}
                  </span>
                </div>
                <div className="flex flex-col border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Gerente
                  </span>
                  <span className="font-medium">
                    {viewProposta.expand?.gerente?.nome || viewProposta.gerente_original || '-'}
                  </span>
                </div>
                <div className="flex flex-col border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Status
                  </span>
                  <span className="font-medium">{viewProposta.status}</span>
                </div>
                <div className="flex flex-col border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Moeda
                  </span>
                  <span className="font-medium">{viewProposta.moeda || '-'}</span>
                </div>
                <div className="flex flex-col border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Valor Final
                  </span>
                  <span className="font-medium text-[#337ab7] text-base">
                    {formatCurrency(viewProposta.valor_final, viewProposta.moeda)}
                  </span>
                </div>
                <div className="flex flex-col border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Prazo de Entrega
                  </span>
                  <span className="font-medium">{viewProposta.prazo_entrega || '-'}</span>
                </div>
                <div className="flex flex-col border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Condições de Pagamento
                  </span>
                  <span className="font-medium">{viewProposta.condicoes_pagamento || '-'}</span>
                </div>

                <div className="col-span-1 md:col-span-2 mt-6">
                  <h4 className="text-sm font-bold text-[#337ab7] mb-3">Histórico da Proposta</h4>
                  <ProposalHistory proposalId={viewProposta.id} />
                </div>
              </div>
            )}
          </div>
          <div className="p-4 border-t border-slate-100 flex justify-end shrink-0">
            <Button variant="outline" onClick={() => setIsViewModalOpen(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
