import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import {
  Pencil,
  Eye,
  History,
  ArrowRight,
  ArrowDownUp,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  Search,
  List,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { ProposalHistory } from '@/components/ProposalHistory'
import { formatCurrency } from './utils'

interface PropostasCriadasListProps {
  onEdit: (proposta: Proposta) => void
}

export function PropostasCriadasList({ onEdit }: PropostasCriadasListProps) {
  const { user } = useAuth()
  const { toast } = useToast()

  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(50)
  const [sortField, setSortField] = useState<string>('created')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [data, setData] = useState<Proposta[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [sectorFilter, setSectorFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [setores, setSetores] = useState<string[]>([])
  const [debouncedSearch, setDebouncedSearch] = useState<string>('')

  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [viewProposta, setViewProposta] = useState<Proposta | null>(null)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  const [historyProposta, setHistoryProposta] = useState<Proposta | null>(null)
  const [avancarPropostaItem, setAvancarPropostaItem] = useState<Proposta | null>(null)
  const [novoStatus, setNovoStatus] = useState<string>('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    pb.collection('users')
      .getFullList()
      .then((users) => {
        const uniqueSetores = Array.from(
          new Set(users.map((u: any) => u.setor).filter(Boolean)),
        ).sort()
        setSetores(uniqueSetores)
      })
      .catch(() => {})
  }, [])

  const loadData = async () => {
    try {
      setIsLoading(true)
      const sortParam = sortDirection === 'desc' ? `-${sortField}` : sortField
      const filters: string[] = []

      if (statusFilter && statusFilter !== 'all') {
        if (statusFilter === 'Em Análise') {
          filters.push("(status = 'Em Análise' || status = '')")
        } else {
          filters.push(`status = "${statusFilter}"`)
        }
      } else {
        filters.push("status != 'Excluída'")
      }

      if (sectorFilter) {
        const sectorUsers = await pb
          .collection('users')
          .getFullList({ filter: `setor = "${sectorFilter}"` })
        if (sectorUsers.length > 0) {
          const userFilter = sectorUsers.map((u: any) => `user = "${u.id}"`).join(' || ')
          filters.push(`(${userFilter})`)
        } else {
          filters.push('id = "nonexistent"')
        }
      }

      if (debouncedSearch.trim()) {
        const term = debouncedSearch.trim()
        const matchingUsers = await pb.collection('users').getList(1, 50, {
          filter: `name ~ "${term}"`,
        })
        const matchingClientes = await pb.collection('clientes').getList(1, 50, {
          filter: `fantasia ~ "${term}" || razao_social ~ "${term}"`,
        })

        const searchOrs: string[] = [`numero_proposta ~ "${term}"`, `cliente_original ~ "${term}"`]
        if (matchingUsers.items.length > 0) {
          const uFilter = matchingUsers.items.map((u: any) => `user = "${u.id}"`).join(' || ')
          searchOrs.push(`(${uFilter})`)
        }
        if (matchingClientes.items.length > 0) {
          const cFilter = matchingClientes.items.map((c: any) => `cliente = "${c.id}"`).join(' || ')
          searchOrs.push(`(${cFilter})`)
        }

        filters.push(`(${searchOrs.join(' || ')})`)
      }

      const filterString = filters.join(' && ')
      const res = await getPropostasPaginated(page, perPage, sortParam, filterString)
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
  }, [page, perPage, sortField, sortDirection, sectorFilter, statusFilter, debouncedSearch])
  useRealtime('propostas', () => {
    loadData()
  })
  useRealtime('users', () => {
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
      <TableHead className="text-primary font-normal text-[11px] whitespace-nowrap bg-white border-b-2 border-slate-200 py-3 px-3 h-auto">
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

  const toggleSelectAll = (checked: boolean) =>
    setSelectedIds(checked ? new Set(data.map((i) => i.id)) : new Set())
  const toggleSelect = (id: string, checked: boolean) => {
    const next = new Set(selectedIds)
    if (checked) next.add(id)
    else next.delete(id)
    setSelectedIds(next)
  }

  const handleView = (item: Proposta) => {
    setViewProposta(item)
    setIsViewModalOpen(true)
  }
  const handleHistory = (item: Proposta) => {
    setHistoryProposta(item)
    setIsHistoryModalOpen(true)
  }
  const printProposal = (item: Proposta) => {
    if (!item.id) {
      toast({ title: 'Salve a proposta antes de gerar o PDF', variant: 'default' })
      return
    }
    window.open(`/controle-propostas/proposta-pdf/${item.id}`, '_blank')
  }

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
    } catch {
      toast({ title: 'Erro ao atualizar status', variant: 'destructive' })
    }
  }

  const handleExclude = async (item: Proposta) => {
    try {
      await updateProposta(item.id, {
        status: 'Excluída',
        ultimo_usuario_status: user?.id,
        data_alteracao_status: format(new Date(), 'yyyy-MM-dd'),
      })
      toast({ title: 'Proposta excluída com sucesso' })
      loadData()
    } catch {
      toast({ title: 'Erro ao excluir proposta', variant: 'destructive' })
    }
  }

  const renderTopPagination = () => {
    const totalPages = Math.ceil(totalItems / perPage) || 1
    const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1)
    const start = totalItems === 0 ? 0 : (page - 1) * perPage + 1
    const end = Math.min(page * perPage, totalItems)
    return (
      <div className="flex items-center text-[11px] text-primary gap-4">
        <div className="flex items-center space-x-1">
          {pages.map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={cn(
                'px-2 py-1 min-w-[24px] text-center rounded-sm transition-colors',
                p === page ? 'bg-primary text-primary-foreground' : 'hover:bg-slate-100',
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

  return (
    <div className="flex flex-col h-full bg-white text-slate-700 font-sans overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-2 shrink-0">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nº, cliente ou responsável..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              className="pl-8 pr-3 py-2 text-sm border border-input rounded-md bg-background outline-none focus:border-primary focus:ring-1 focus:ring-ring min-w-[240px] transition-colors"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            className="text-sm border border-input rounded-md bg-background px-3 py-2 outline-none focus:border-primary focus:ring-1 focus:ring-ring cursor-pointer transition-colors"
          >
            <option value="all">Todos os Status</option>
            <option value="Em Análise">Em Análise</option>
            <option value="Aprovada">Aprovada</option>
            <option value="Recusada">Recusada</option>
            <option value="Excluída">Excluídas (Lixeira)</option>
          </select>
          <select
            value={sectorFilter}
            onChange={(e) => {
              setSectorFilter(e.target.value)
              setPage(1)
            }}
            className="text-sm border border-input rounded-md bg-background px-3 py-2 outline-none focus:border-primary focus:ring-1 focus:ring-ring cursor-pointer transition-colors"
          >
            <option value="">Todos os setores</option>
            {setores.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        {renderTopPagination()}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <Table>
          <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
            <TableRow className="border-b-2 border-slate-200 hover:bg-transparent">
              <TableHead className="w-[40px] px-3 py-3 bg-white h-auto border-b-2 border-slate-200">
                <Checkbox
                  className="border-slate-300 rounded-[2px] data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                  checked={data.length > 0 && selectedIds.size === data.length}
                  onCheckedChange={(checked) => toggleSelectAll(!!checked)}
                />
              </TableHead>
              {renderSortableHead('Proposta', 'numero_proposta')}
              {renderSortableHead('Razão Social', 'cliente_original')}
              {renderSortableHead('Contato', 'contato')}
              {renderSortableHead('Telefone', 'telefone')}
              {renderSortableHead('Versão', 'versao_original')}
              {renderSortableHead('Rep. (Externo)', 'representante_original')}
              {renderSortableHead('Status', 'status')}
              {renderSortableHead('Valor', 'valor_final')}
              {renderSortableHead('Dt. Cad', 'dt_cad')}
              {renderSortableHead('Responsável', 'created')}
              <TableHead className="text-primary font-normal text-[11px] whitespace-nowrap bg-white border-b-2 border-slate-200 py-3 px-3 h-auto">
                Setor
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center py-8 text-slate-500">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center py-8 text-slate-500">
                  Nenhuma proposta encontrada.
                </TableCell>
              </TableRow>
            ) : (
              data.map((item) => (
                <TableRow
                  key={item.id}
                  className="hover:bg-slate-50 border-b border-slate-200 group"
                >
                  <TableCell className="align-top py-2.5 px-3">
                    <Checkbox
                      className="border-slate-300 rounded-[2px] data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      checked={selectedIds.has(item.id)}
                      onCheckedChange={(checked) => toggleSelect(item.id, !!checked)}
                    />
                  </TableCell>
                  <TableCell className="align-top py-2 px-3 min-w-[100px] border-r border-slate-100">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className="text-slate-600 text-xs">{item.numero_proposta}</span>
                      {item.modelo_licitacao && (
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1 py-0 h-4 bg-purple-50 text-purple-700 border-purple-200 uppercase"
                        >
                          Licitação
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-col gap-1 mt-1">
                      <button
                        onClick={() => onEdit(item)}
                        className="flex items-center text-primary hover:underline text-[11px] w-fit"
                      >
                        <Pencil className="h-3 w-3 mr-1" fill="currentColor" /> Editar
                      </button>
                      <button
                        onClick={() => handleView(item)}
                        className="flex items-center text-primary hover:underline text-[11px] w-fit"
                      >
                        <Eye className="h-3 w-3 mr-1" /> Visualizar
                      </button>
                      <button
                        onClick={() => handleHistory(item)}
                        className="flex items-center text-primary hover:underline text-[11px] w-fit"
                      >
                        <History className="h-3 w-3 mr-1" /> Histórico
                      </button>
                      <button
                        onClick={() => printProposal(item)}
                        className="flex items-center text-emerald-600 hover:text-emerald-700 hover:underline text-[11px] w-fit font-medium mt-1"
                      >
                        Gerar PDF
                      </button>
                      {item.status !== 'Excluída' && user?.id === item.user && (
                        <>
                          <button
                            onClick={() => {
                              setAvancarPropostaItem(item)
                              setNovoStatus(
                                item.status === 'Em Análise'
                                  ? 'Aprovada'
                                  : item.status || 'Em Análise',
                              )
                            }}
                            className="flex items-center text-amber-600 hover:text-amber-700 hover:underline text-[11px] w-fit font-medium mt-1"
                          >
                            <ArrowRight className="h-3 w-3 mr-1" /> Avançar Proposta
                          </button>
                          <button
                            onClick={() => handleExclude(item)}
                            className="flex items-center text-rose-600 hover:text-rose-700 hover:underline text-[11px] w-fit font-medium"
                          >
                            Excluir
                          </button>
                        </>
                      )}
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
                  <TableCell className="align-top py-2.5 px-3 text-slate-700 text-[10px]">
                    {item.contato || '-'}
                  </TableCell>
                  <TableCell className="align-top py-2.5 px-3 text-slate-700 text-[10px] whitespace-nowrap">
                    {item.telefone || '-'}
                  </TableCell>
                  <TableCell
                    className="align-top py-2.5 px-3 text-slate-700 text-[10px] uppercase max-w-[300px] whitespace-normal leading-relaxed"
                    title={item.expand?.versao?.nome || item.versao_original}
                  >
                    {item.expand?.versao?.nome || item.versao_original || '-'}
                  </TableCell>
                  <TableCell className="align-top py-2.5 px-3 text-slate-700 text-[10px] uppercase">
                    {item.expand?.representante?.fantasia || item.representante_original || '-'}
                  </TableCell>
                  <TableCell className="align-top py-2 px-3">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] font-normal border whitespace-nowrap px-1.5 py-0',
                        item.status === 'Aprovada' &&
                          'bg-emerald-50 text-emerald-700 border-emerald-200',
                        item.status === 'Recusada' && 'bg-rose-50 text-rose-700 border-rose-200',
                        item.status === 'Excluída' &&
                          'bg-slate-100 text-slate-500 border-slate-300',
                        (!item.status || item.status === 'Em Análise') &&
                          'bg-amber-50 text-amber-700 border-amber-200',
                      )}
                    >
                      {item.status || 'Em Análise'}
                    </Badge>
                  </TableCell>
                  <TableCell className="align-top py-2.5 px-3 text-slate-700 text-[10px] whitespace-nowrap">
                    {formatCurrency(item.valor_final, item.moeda)}
                  </TableCell>
                  <TableCell className="align-top py-2.5 px-3 text-slate-700 text-[10px] whitespace-nowrap">
                    {item.dt_cad
                      ? item.dt_cad.substring(0, 10).split('-').reverse().join('/')
                      : '-'}
                  </TableCell>
                  <TableCell className="align-top py-2.5 px-3 text-slate-700 text-[10px] uppercase">
                    {item.expand?.user?.name || '-'}
                  </TableCell>
                  <TableCell className="align-top py-2.5 px-3 text-slate-700 text-[10px] uppercase">
                    {item.expand?.user?.setor || '-'}
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
            <DialogTitle className="text-xl font-normal text-primary">
              Visualizar Proposta: {viewProposta?.numero_proposta}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6 pt-2">
            {viewProposta && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm text-slate-700">
                <div className="col-span-1 md:col-span-2 mb-2 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                  <span className="text-xs font-bold text-primary uppercase tracking-wider">
                    Responsável Interno: {viewProposta.expand?.user?.name || '-'}{' '}
                    <span className="font-normal text-slate-500">
                      (Setor: {viewProposta.expand?.user?.setor || 'Comercial'})
                    </span>
                  </span>
                </div>
                {[
                  {
                    label: 'Cliente',
                    value:
                      viewProposta.expand?.cliente?.fantasia ||
                      viewProposta.expand?.cliente?.razao_social ||
                      viewProposta.cliente_original ||
                      '-',
                  },
                  { label: 'Contato', value: viewProposta.contato || '-' },
                  { label: 'Telefone', value: viewProposta.telefone || '-' },
                  {
                    label: 'Versão',
                    value: viewProposta.expand?.versao?.nome || viewProposta.versao_original || '-',
                  },
                  {
                    label: 'Representante',
                    value:
                      viewProposta.expand?.representante?.fantasia ||
                      viewProposta.representante_original ||
                      '-',
                  },
                  {
                    label: 'Gerente',
                    value:
                      viewProposta.expand?.gerente?.nome || viewProposta.gerente_original || '-',
                  },
                  { label: 'Status', value: viewProposta.status || 'Em Análise' },
                  { label: 'Moeda', value: viewProposta.moeda || '-' },
                  {
                    label: 'Valor Final',
                    value: formatCurrency(viewProposta.valor_final, viewProposta.moeda),
                    highlight: true,
                  },
                  { label: 'Prazo de Entrega', value: viewProposta.prazo_entrega || '-' },
                  {
                    label: 'Condições de Pagamento',
                    value: viewProposta.condicoes_pagamento || '-',
                  },
                ].map((f, i) => (
                  <div key={i} className="flex flex-col border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      {f.label}
                    </span>
                    <span className={cn('font-medium', f.highlight && 'text-primary text-base')}>
                      {f.value}
                    </span>
                  </div>
                ))}
                {viewProposta.expand?.projeto && (
                  <div className="flex flex-col border-b border-slate-100 pb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Projeto Vinculado
                    </span>
                    <Link
                      to={`/projetos/${viewProposta.expand.projeto.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {viewProposta.expand.projeto.nome}
                    </Link>
                  </div>
                )}
                {viewProposta.acessorios_proposta?.length > 0 && (
                  <div className="col-span-1 md:col-span-2 mt-6">
                    <h4 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                      <List className="w-4 h-4" />
                      Acessórios da Proposta
                    </h4>
                    <div className="border border-slate-200 rounded-sm overflow-hidden">
                      <table className="w-full text-left text-xs bg-white border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200">
                          <tr>
                            <th className="py-2 px-3 font-semibold text-slate-600">Acessório</th>
                            <th className="py-2 px-3 font-semibold text-slate-600">Tipo</th>
                            <th className="py-2 px-3 font-semibold text-slate-600">Valor</th>
                            <th className="py-2 px-3 font-semibold text-slate-600 text-center">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {viewProposta.acessorios_proposta.map((acc: any, i: number) => {
                            const estado =
                              acc.estado ||
                              (acc.incluir ? 'incluir' : acc.exibir ? 'exibir' : 'nao_exibir')
                            return (
                              <tr
                                key={i}
                                className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50"
                              >
                                <td className="py-2.5 px-3 text-slate-700">{acc.nome}</td>
                                <td className="py-2.5 px-3 text-slate-700">{acc.tipo || '-'}</td>
                                <td className="py-2.5 px-3 text-slate-700">
                                  {formatCurrency(acc.valor, acc.moeda)}
                                </td>
                                <td className="py-2.5 px-3 text-center">
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      'px-1 py-0 text-[10px]',
                                      estado === 'incluir' &&
                                        'bg-emerald-50 text-emerald-700 border-emerald-200',
                                      estado === 'exibir' &&
                                        'bg-blue-50 text-blue-700 border-blue-200',
                                      estado === 'nao_exibir' &&
                                        'bg-slate-50 text-slate-500 border-slate-200',
                                    )}
                                  >
                                    {estado === 'incluir'
                                      ? 'Incluir'
                                      : estado === 'exibir'
                                        ? 'Exibir'
                                        : 'Não exibir'}
                                  </Badge>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
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

      <Dialog open={isHistoryModalOpen} onOpenChange={setIsHistoryModalOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-6">
          <DialogHeader className="mb-4 shrink-0">
            <DialogTitle className="text-lg font-normal text-slate-700">
              Histórico da Proposta: {historyProposta?.numero_proposta}
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2">
            {historyProposta && <ProposalHistory proposalId={historyProposta.id} />}
          </div>
        </DialogContent>
      </Dialog>

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
              {['Em Análise', 'Aprovada', 'Recusada', 'Excluída'].map((statusOption) => (
                <button
                  key={statusOption}
                  onClick={() => setNovoStatus(statusOption)}
                  className={cn(
                    'flex-1 text-[11px] font-medium py-1.5 rounded-sm transition-all',
                    novoStatus === statusOption
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
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAvancarPropostaItem(null)}>
              Cancelar
            </Button>
            <Button onClick={handleAvancarProposta} className="bg-primary hover:bg-primary/90">
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
