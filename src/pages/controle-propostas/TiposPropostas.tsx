import { useState, useEffect } from 'react'
import {
  Edit,
  Copy,
  List,
  Search,
  ArrowUp,
  ArrowDown,
  ArrowDownUp,
  ChevronRight,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal'
import { cn } from '@/lib/utils'

import {
  TipoProposta,
  getTiposPropostaPaginated,
  createTipoProposta,
  updateTipoProposta,
  deleteTipoProposta,
} from '@/services/tipos-propostas'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

export default function TiposPropostas() {
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<'registros' | 'cadastro'>('registros')
  const [data, setData] = useState<TipoProposta[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(50)
  const [sortField, setSortField] = useState('nome')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)

  const [formData, setFormData] = useState<Partial<TipoProposta>>({
    status: 'Ativo',
    tem_fator: false,
    comissao: 0,
    frase_preco: '',
    frase_comissao: '',
    prazo_entrega: '',
    condicoes_pagamento: '',
    garantia: '',
    assistencia_tecnica: '',
    treinamento_tecnico: '',
    transporte_seguro: '',
    validade_oferta: '',
    imposto_ipi: '',
    imposto_icms: '',
    formas_pagamento_selecionadas: [],
  })
  const [selectedItem, setSelectedItem] = useState<TipoProposta | null>(null)

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const sortStr = sortDir === 'desc' ? `-${sortField}` : sortField
      let filterStr = ''
      if (searchTerm) {
        filterStr = `nome ~ "${searchTerm}"`
      }

      const res = await getTiposPropostaPaginated(page, perPage, sortStr, filterStr)
      setData(res.items)
      setTotalItems(res.totalItems)
      setSelectedIds(new Set())
    } catch (e) {
      toast({ title: 'Erro ao carregar tipos de propostas', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [page, perPage, sortField, sortDir, searchTerm])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
    setPage(1)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(data.map((d) => d.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    const next = new Set(selectedIds)
    if (checked) next.add(id)
    else next.delete(id)
    setSelectedIds(next)
  }

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return
    setIsDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    try {
      for (const id of selectedIds) {
        await deleteTipoProposta(id)
      }
      toast({ title: 'Itens excluídos com sucesso' })
      setIsDeleteModalOpen(false)
      loadData()
    } catch (e) {
      toast({ title: 'Erro ao excluir itens', variant: 'destructive' })
    }
  }

  const handleEdit = (item: TipoProposta) => {
    setSelectedItem(item)
    setFormData({
      ...item,
    })
    setActiveTab('cadastro')
  }

  const handleDuplicate = (item: TipoProposta) => {
    setSelectedItem(null)
    setFormData({
      ...item,
      id: undefined,
      nome: `${item.nome} - Cópia`,
      created: undefined,
      updated: undefined,
    })
    setActiveTab('cadastro')
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.nome) {
      toast({ title: 'Nome é obrigatório', variant: 'destructive' })
      return
    }

    try {
      if (selectedItem) {
        await updateTipoProposta(selectedItem.id, formData)
        toast({ title: 'Item atualizado com sucesso' })
      } else {
        await createTipoProposta(formData)
        toast({ title: 'Item criado com sucesso' })
      }
      setActiveTab('registros')
      setSelectedItem(null)
      setFormData({ status: 'Ativo', tem_fator: false })
      loadData()
    } catch (err) {
      const fieldErrs = extractFieldErrors(err)
      if (fieldErrs.nome) {
        toast({ title: 'Erro no nome: ' + fieldErrs.nome, variant: 'destructive' })
      } else {
        toast({ title: 'Erro ao salvar item', variant: 'destructive' })
      }
    }
  }

  const handleNew = () => {
    setSelectedItem(null)
    setFormData({ status: 'Ativo', tem_fator: false })
    setActiveTab('cadastro')
  }

  const handleSearchClick = () => {
    if (activeTab === 'cadastro') {
      setActiveTab('registros')
    } else {
      const p = prompt('Digite o termo para pesquisa:', searchTerm)
      if (p !== null) {
        setSearchTerm(p)
        setPage(1)
      }
    }
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
            sortDir === 'asc' ? (
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

  const totalPages = Math.ceil(totalItems / perPage) || 1
  const paginationRange = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
    let start = Math.max(1, page - 2)
    if (start + 4 > totalPages) start = Math.max(1, totalPages - 4)
    return start + i
  })

  const startItem = totalItems === 0 ? 0 : (page - 1) * perPage + 1
  const endItem = Math.min(page * perPage, totalItems)

  const inputClass =
    'w-full bg-white border border-slate-300 rounded-sm px-2 py-1.5 outline-none text-slate-700 text-xs focus:border-[#337ab7] min-h-[30px]'
  const labelClass = 'text-[11px] font-bold text-slate-700 mb-1'

  return (
    <div className="flex flex-col h-full bg-white font-sans rounded-md shadow-sm border border-slate-200">
      <div className="flex items-center gap-2 p-4 border-b border-slate-200 bg-white shrink-0">
        <List className="h-5 w-5 text-slate-500" />
        <h2 className="text-xl font-normal text-slate-700">Tipos de Propostas</h2>
      </div>

      <div className="p-4 border-b border-slate-200 bg-white shrink-0">
        <div className="flex gap-2">
          <Button
            onClick={handleSearchClick}
            className="bg-[#337ab7] hover:bg-[#286090] text-white rounded-[3px] text-xs font-normal h-8 px-4 uppercase shadow-none"
          >
            Pesquisar
          </Button>
          <Button
            onClick={handleNew}
            className="bg-[#337ab7] hover:bg-[#286090] text-white rounded-[3px] text-xs font-normal h-8 px-4 uppercase shadow-none"
          >
            Novo
          </Button>
          <Button
            onClick={handleDeleteSelected}
            disabled={selectedIds.size === 0}
            className="bg-[#337ab7] hover:bg-[#286090] text-white rounded-[3px] text-xs font-normal h-8 px-4 uppercase shadow-none disabled:opacity-50"
          >
            Excluir
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 px-4 pt-2 bg-white shrink-0">
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('registros')}
              className={cn(
                'px-2 py-2 text-sm transition-colors relative',
                activeTab === 'registros'
                  ? 'text-[#337ab7] font-normal after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-0.5 after:bg-[#337ab7]'
                  : 'text-slate-500 hover:text-slate-700',
              )}
            >
              Registros
            </button>
            <button
              onClick={() => setActiveTab('cadastro')}
              className={cn(
                'px-2 py-2 text-sm transition-colors relative',
                activeTab === 'cadastro'
                  ? 'text-[#337ab7] font-normal after:absolute after:bottom-[-1px] after:left-0 after:right-0 after:h-0.5 after:bg-[#337ab7]'
                  : 'text-slate-500 hover:text-slate-700',
              )}
            >
              Cadastro
            </button>
          </div>

          {activeTab === 'registros' && (
            <div className="flex items-center gap-4 text-xs text-[#337ab7] pb-1">
              <div className="flex items-center gap-1">
                {paginationRange.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={cn(
                      'px-2 py-1 rounded-[2px] min-w-[24px] text-center',
                      p === page ? 'bg-[#337ab7] text-white' : 'hover:bg-slate-100',
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <span className="text-slate-500">
                {startItem}-{endItem} de {totalItems}
              </span>
              <select
                value={perPage}
                onChange={(e) => {
                  setPerPage(Number(e.target.value))
                  setPage(1)
                }}
                className="border border-slate-200 rounded-[2px] py-1 pl-2 pr-1 outline-none text-slate-500 bg-white"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={40}>40</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto bg-white p-4">
          {activeTab === 'registros' ? (
            <div className="w-full">
              <Table>
                <TableHeader>
                  <TableRow className="border-b-2 border-slate-200 hover:bg-transparent">
                    <TableHead className="w-[40px] px-3 py-3 h-auto">
                      <Checkbox
                        className="border-slate-300 rounded-[2px] data-[state=checked]:bg-[#337ab7] data-[state=checked]:border-[#337ab7]"
                        checked={data.length > 0 && selectedIds.size === data.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    {renderSortableHead('Nome', 'nome')}
                    {renderSortableHead('Fator', 'tem_fator')}
                    {renderSortableHead('DtCad', 'created')}
                    {renderSortableHead('Status', 'status')}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-500 text-sm">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-500 text-sm">
                        Nenhum registro encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((item) => (
                      <TableRow
                        key={item.id}
                        className="hover:bg-slate-50 border-b border-slate-100"
                      >
                        <TableCell className="align-top py-2.5 px-3">
                          <Checkbox
                            className="border-slate-300 rounded-[2px] data-[state=checked]:bg-[#337ab7] data-[state=checked]:border-[#337ab7]"
                            checked={selectedIds.has(item.id)}
                            onCheckedChange={(c) => handleSelectOne(item.id, !!c)}
                          />
                        </TableCell>
                        <TableCell className="align-top py-2.5 px-3 border-r border-slate-100">
                          <div className="text-slate-600 text-xs mb-1">{item.nome}</div>
                          <div className="flex items-center gap-3 mt-1">
                            <button
                              onClick={() => handleEdit(item)}
                              className="flex items-center text-[#337ab7] hover:underline text-[10px]"
                            >
                              <Edit className="h-2.5 w-2.5 mr-1" /> Editar
                            </button>
                            <button
                              onClick={() => handleDuplicate(item)}
                              className="flex items-center text-[#337ab7] hover:underline text-[10px]"
                            >
                              <Copy className="h-2.5 w-2.5 mr-1" /> Duplicar
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="align-top py-2.5 px-3 text-slate-600 text-[11px]">
                          {item.tem_fator ? 'Sim' : 'Não'}
                        </TableCell>
                        <TableCell className="align-top py-2.5 px-3 text-slate-600 text-[11px]">
                          {item.created ? format(new Date(item.created), 'dd/MM/yyyy') : '-'}
                        </TableCell>
                        <TableCell className="align-top py-2.5 px-3">
                          <span
                            className={cn(
                              'px-1.5 py-0.5 text-[10px] rounded-[3px] text-white',
                              item.status === 'Ativo' ? 'bg-emerald-500' : 'bg-rose-500',
                            )}
                          >
                            {item.status}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <form onSubmit={handleSave} className="max-w-5xl mx-auto pb-10">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_300px] gap-6">
                <div className="space-y-6">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-4">
                    <List className="w-4 h-4 text-slate-500" />
                    <h3 className="font-semibold text-slate-700 text-sm">Dados</h3>
                  </div>

                  <div className="grid grid-cols-[1fr_150px] gap-4">
                    <div className="flex flex-col">
                      <label className={labelClass}>Nome *</label>
                      <input
                        required
                        className={inputClass}
                        value={formData.nome || ''}
                        onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                        placeholder="Nome do tipo"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className={labelClass}>Status</label>
                      <select
                        className={inputClass}
                        value={formData.status || 'Ativo'}
                        onChange={(e) =>
                          setFormData({ ...formData, status: e.target.value as any })
                        }
                      >
                        <option value="Ativo">Ativo</option>
                        <option value="Inativo">Inativo</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className={labelClass}>Aplicar Fator de Nacionalização</label>
                      <select
                        className={inputClass}
                        value={formData.tem_fator ? 'Sim' : 'Não'}
                        onChange={(e) =>
                          setFormData({ ...formData, tem_fator: e.target.value === 'Sim' })
                        }
                      >
                        <option value="Sim">Sim</option>
                        <option value="Não">Não</option>
                      </select>
                    </div>
                    <div className="flex flex-col">
                      <label className={labelClass}>Comissão (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        className={inputClass}
                        value={formData.comissao || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, comissao: parseFloat(e.target.value) || 0 })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className={labelClass}>Frase do Preço</label>
                      <input
                        className={inputClass}
                        value={formData.frase_preco || ''}
                        onChange={(e) => setFormData({ ...formData, frase_preco: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className={labelClass}>Frase Comissão</label>
                      <input
                        className={inputClass}
                        value={formData.frase_comissao || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, frase_comissao: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className={labelClass}>Prazo de Entrega</label>
                      <textarea
                        className={cn(inputClass, 'min-h-[80px] resize-y')}
                        value={formData.prazo_entrega || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, prazo_entrega: e.target.value })
                        }
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className={labelClass}>Condições de Pagamento</label>
                      <textarea
                        className={cn(inputClass, 'min-h-[80px] resize-y')}
                        value={formData.condicoes_pagamento || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, condicoes_pagamento: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className={labelClass}>Garantia</label>
                      <textarea
                        className={cn(inputClass, 'min-h-[120px] resize-y')}
                        value={formData.garantia || ''}
                        onChange={(e) => setFormData({ ...formData, garantia: e.target.value })}
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className={labelClass}>Assistência Técnica</label>
                      <textarea
                        className={cn(inputClass, 'min-h-[120px] resize-y')}
                        value={formData.assistencia_tecnica || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, assistencia_tecnica: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className={labelClass}>Treinamento Técnico</label>
                      <textarea
                        className={cn(inputClass, 'min-h-[120px] resize-y')}
                        value={formData.treinamento_tecnico || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, treinamento_tecnico: e.target.value })
                        }
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className={labelClass}>Transporte/Seguro</label>
                      <textarea
                        className={cn(inputClass, 'min-h-[120px] resize-y')}
                        value={formData.transporte_seguro || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, transporte_seguro: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className={labelClass}>Validade desta Oferta</label>
                      <textarea
                        className={cn(inputClass, 'min-h-[80px] resize-y')}
                        value={formData.validade_oferta || ''}
                        onChange={(e) =>
                          setFormData({ ...formData, validade_oferta: e.target.value })
                        }
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className={labelClass}>Imposto IPI</label>
                      <textarea
                        className={cn(inputClass, 'min-h-[80px] resize-y')}
                        value={formData.imposto_ipi || ''}
                        onChange={(e) => setFormData({ ...formData, imposto_ipi: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <label className={labelClass}>Imposto ICMS</label>
                      <textarea
                        className={cn(inputClass, 'min-h-[80px] resize-y')}
                        value={formData.imposto_icms || ''}
                        onChange={(e) => setFormData({ ...formData, imposto_icms: e.target.value })}
                      />
                    </div>
                    {selectedItem?.created && (
                      <div className="flex flex-col">
                        <label className={labelClass}>Dt. Cad</label>
                        <input
                          readOnly
                          className={cn(inputClass, 'bg-slate-50 text-slate-500')}
                          value={format(new Date(selectedItem.created), 'dd/MM/yyyy HH:mm:ss')}
                        />
                      </div>
                    )}
                  </div>

                  <div className="pt-4 flex gap-2">
                    <Button
                      type="button"
                      onClick={handleSearchClick}
                      className="bg-[#337ab7] hover:bg-[#286090] text-white rounded-[3px] text-xs font-normal h-8 px-4 uppercase shadow-none"
                    >
                      Pesquisar
                    </Button>
                    <Button
                      type="button"
                      onClick={handleNew}
                      className="bg-[#337ab7] hover:bg-[#286090] text-white rounded-[3px] text-xs font-normal h-8 px-4 uppercase shadow-none"
                    >
                      Novo
                    </Button>
                    <Button
                      type="submit"
                      className="bg-[#337ab7] hover:bg-[#286090] text-white rounded-[3px] text-xs font-normal h-8 px-4 uppercase shadow-none"
                    >
                      Salvar
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-4">
                    <List className="w-4 h-4 text-slate-500" />
                    <h3 className="font-semibold text-slate-700 text-sm">
                      Formas de Pagamento do Pedido
                    </h3>
                  </div>

                  <div className="space-y-2">
                    {[
                      'Faturamento a vista',
                      'Financiamento C.D.C.I. 1 a 9 parcelas',
                      'Financiamento C.D.C.I. 10 a 17 parcelas',
                    ].map((label) => {
                      const isChecked = formData.formas_pagamento_selecionadas?.includes(label)
                      return (
                        <div
                          key={label}
                          className="flex items-start space-x-2 bg-slate-50 p-2 rounded-sm border border-slate-100"
                        >
                          <Checkbox
                            id={`pgto-${label}`}
                            checked={isChecked}
                            onCheckedChange={(c) => {
                              const current = formData.formas_pagamento_selecionadas || []
                              if (c) {
                                setFormData({
                                  ...formData,
                                  formas_pagamento_selecionadas: [...current, label],
                                })
                              } else {
                                setFormData({
                                  ...formData,
                                  formas_pagamento_selecionadas: current.filter((x) => x !== label),
                                })
                              }
                            }}
                            className="mt-0.5 border-slate-400 rounded-[2px] data-[state=checked]:bg-[#337ab7] data-[state=checked]:border-[#337ab7]"
                          />
                          <Label
                            htmlFor={`pgto-${label}`}
                            className="text-[11px] font-normal cursor-pointer leading-snug text-slate-700"
                          >
                            {label}
                          </Label>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Excluir Tipos de Propostas"
        description="Tem certeza que deseja excluir os registros selecionados? Esta ação não poderá ser desfeita."
      />
    </div>
  )
}
