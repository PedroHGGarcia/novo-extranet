import { useState, useEffect } from 'react'
import {
  Edit,
  Copy,
  List,
  ArrowUp,
  ArrowDown,
  ArrowDownUp,
  FileText,
  Network,
  AlertCircle,
} from 'lucide-react'
import { format } from 'date-fns'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

import {
  TipoProposta,
  getTiposPropostaPaginated,
  getTipoProposta,
  createTipoProposta,
  updateTipoProposta,
} from '@/services/tipos-propostas'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import { TemplateAcessorios } from '@/components/TemplateAcessorios'

const inputClass =
  'w-full bg-transparent border-0 border-b border-slate-300 rounded-none px-0 py-1.5 outline-none text-slate-700 text-xs focus:border-[#337ab7] focus:ring-0 transition-colors'
const labelClass = 'text-[11px] text-slate-500 mb-0.5'

const PercentageInput = ({
  value,
  onChange,
  isNumber = false,
  placeholder = '',
}: {
  value: any
  onChange: (val: any) => void
  isNumber?: boolean
  placeholder?: string
}) => {
  const [display, setDisplay] = useState('')

  useEffect(() => {
    if (value == null || value === '') {
      setDisplay('')
      return
    }
    if (isNumber) {
      const v = parseFloat(value as string)
      if (!isNaN(v)) {
        setDisplay(
          v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%',
        )
      } else {
        setDisplay('')
      }
    } else {
      const str = String(value)
      if (str && !str.includes('%') && /^[0-9.,]+$/.test(str)) {
        const num = parseFloat(str.replace(',', '.'))
        if (!isNaN(num)) {
          setDisplay(
            num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
              '%',
          )
        } else {
          setDisplay(str)
        }
      } else {
        setDisplay(str)
      }
    }
  }, [value, isNumber])

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/[^0-9.,]/g, '')
    if (!val) {
      onChange(isNumber ? 0 : '')
      setDisplay('')
      return
    }
    val = val.replace(',', '.')
    const num = parseFloat(val)
    if (isNaN(num)) {
      onChange(isNumber ? 0 : '')
      setDisplay('')
      return
    }

    if (isNumber) {
      onChange(num)
      setDisplay(
        num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%',
      )
    } else {
      const formatted =
        num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%'
      onChange(formatted)
      setDisplay(formatted)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDisplay(e.target.value)
  }

  return (
    <input
      type="text"
      className={inputClass}
      value={display}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
    />
  )
}

export default function TiposPropostas() {
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState<'registros' | 'cadastro'>('registros')
  const [data, setData] = useState<TipoProposta[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(50)
  const [sortField, setSortField] = useState('nome')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingForm, setIsLoadingForm] = useState(false)
  const [loadError, setLoadError] = useState<{ id: string; message: string } | null>(null)

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
    acessorios_default: [],
  })
  const [selectedItem, setSelectedItem] = useState<TipoProposta | null>(null)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const sortStr = sortDir === 'desc' ? `-${sortField}` : sortField
      const res = await getTiposPropostaPaginated(page, perPage, sortStr)
      setData(res.items)
      setTotalItems(res.totalItems)
    } catch (e) {
      toast({ title: 'Erro ao carregar tipos de propostas', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [page, perPage, sortField, sortDir])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
    setPage(1)
  }

  const loadFullItem = async (id: string) => {
    setIsLoadingForm(true)
    setLoadError(null)
    try {
      const fullItem = await getTipoProposta(id)
      return fullItem
    } catch (err) {
      console.error(err)
      setLoadError({
        id,
        message:
          'Não foi possível carregar os dados do tipo de proposta. O registro pode ter sido excluído.',
      })
      return null
    } finally {
      setIsLoadingForm(false)
    }
  }

  const handleEdit = async (item: TipoProposta) => {
    setActiveTab('cadastro')
    setFormData({ status: 'Ativo', tem_fator: false, formas_pagamento_selecionadas: [] })
    const fullItem = await loadFullItem(item.id)
    if (fullItem) {
      setSelectedItem(fullItem)
      setFormData({
        ...fullItem,
        formas_pagamento_selecionadas: fullItem.formas_pagamento_selecionadas || [],
        acessorios_default: fullItem.acessorios_default || [],
      })
    }
  }

  const retryLoad = async () => {
    if (!loadError) return
    const fullItem = await loadFullItem(loadError.id)
    if (fullItem) {
      setSelectedItem(fullItem)
      setFormData({
        ...fullItem,
        formas_pagamento_selecionadas: fullItem.formas_pagamento_selecionadas || [],
        acessorios_default: fullItem.acessorios_default || [],
      })
    }
  }

  const handleDuplicate = async (item: TipoProposta) => {
    try {
      setIsLoading(true)
      const fullItem = await getTipoProposta(item.id)
      const newItemData = {
        ...fullItem,
        nome: `${fullItem.nome} - Cópia`,
        id: undefined,
        created: undefined,
        updated: undefined,
        formas_pagamento_selecionadas: fullItem.formas_pagamento_selecionadas || [],
      }
      const newItem = await createTipoProposta(newItemData)
      toast({ title: 'Sucesso: Dados salvos com sucesso!' })

      setActiveTab('cadastro')
      setSelectedItem(newItem)
      setFormData({
        ...newItem,
        formas_pagamento_selecionadas: newItem.formas_pagamento_selecionadas || [],
        acessorios_default: newItem.acessorios_default || [],
      })
      loadData()
    } catch (err) {
      toast({ title: 'Erro ao duplicar tipo de proposta', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    if (activeTab === 'registros') return

    if (!formData.nome) {
      toast({ title: 'O campo Nome é obrigatório', variant: 'destructive' })
      return
    }

    try {
      if (selectedItem) {
        await updateTipoProposta(selectedItem.id, formData)
        toast({ title: 'Sucesso: Dados salvos com sucesso!' })
      } else {
        await createTipoProposta(formData)
        toast({ title: 'Sucesso: Dados salvos com sucesso!' })
      }
      setActiveTab('registros')
      setSelectedItem(null)
      setFormData({
        status: 'Ativo',
        tem_fator: false,
        formas_pagamento_selecionadas: [],
        acessorios_default: [],
      })
      loadData()
    } catch (err) {
      const fieldErrs = extractFieldErrors(err)
      if (fieldErrs.nome) {
        toast({ title: 'Erro no nome: ' + fieldErrs.nome, variant: 'destructive' })
      } else {
        toast({
          title: 'Erro ao salvar os dados. Verifique os campos e tente novamente.',
          variant: 'destructive',
        })
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

  return (
    <div className="flex flex-col h-full bg-[#f1f5f9] font-sans">
      <div className="flex items-center gap-2 p-4 bg-white border-b border-slate-200 shrink-0 shadow-sm">
        <List className="h-5 w-5 text-slate-600" />
        <h2 className="text-lg font-normal text-slate-700">Tipos de Propostas</h2>
        {activeTab === 'cadastro' && !loadError && !isLoadingForm && (
          <Button
            type="button"
            onClick={handleSave}
            className="bg-[#337ab7] hover:bg-[#286090] text-white rounded-[3px] text-xs font-normal h-8 px-4 uppercase shadow-none ml-auto"
          >
            Salvar
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-auto p-4">
        <div className="bg-white border border-slate-200 shadow-sm rounded-sm">
          <div className="px-3 pt-3 flex gap-1 border-b border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('registros')}
              className={cn(
                'px-4 py-2 text-sm transition-colors border border-b-0 rounded-t-sm relative top-[1px]',
                activeTab === 'registros'
                  ? 'text-[#337ab7] bg-white border-slate-200 z-10'
                  : 'text-[#337ab7] bg-transparent border-transparent hover:bg-slate-50',
              )}
            >
              Registros
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('cadastro')}
              className={cn(
                'px-4 py-2 text-sm transition-colors border border-b-0 rounded-t-sm relative top-[1px]',
                activeTab === 'cadastro'
                  ? 'text-slate-700 bg-white border-slate-200 z-10'
                  : 'text-[#337ab7] bg-transparent border-transparent hover:bg-slate-50',
              )}
            >
              Cadastro
            </button>
          </div>

          <div className="p-4 bg-white">
            {activeTab === 'registros' ? (
              <div className="flex flex-col">
                <div className="flex justify-end mb-2">
                  <div className="flex items-center gap-4 text-xs text-[#337ab7]">
                    <div className="flex items-center gap-1">
                      {paginationRange.map((p) => (
                        <button
                          key={p}
                          type="button"
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
                </div>

                <div className="border border-slate-200 rounded-sm">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-b border-slate-200 hover:bg-transparent">
                        {renderSortableHead('Nome', 'nome')}
                        {renderSortableHead('Fator', 'tem_fator')}
                        {renderSortableHead('DtCad', 'created')}
                        {renderSortableHead('Status', 'status')}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center py-8 text-slate-500 text-sm"
                          >
                            <div className="flex justify-center items-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#337ab7]"></div>
                              Carregando...
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : data.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={4}
                            className="text-center py-8 text-slate-500 text-sm"
                          >
                            Nenhum registro encontrado.
                          </TableCell>
                        </TableRow>
                      ) : (
                        data.map((item) => (
                          <TableRow
                            key={item.id}
                            className="hover:bg-slate-50 border-b border-slate-100"
                          >
                            <TableCell className="align-top py-2.5 px-3 border-r border-slate-100">
                              <div className="text-slate-600 text-xs mb-1 font-medium">
                                {item.nome}
                              </div>
                              <div className="flex items-center gap-3 mt-1">
                                <button
                                  type="button"
                                  onClick={() => handleEdit(item)}
                                  className="flex items-center text-[#337ab7] hover:underline text-[10px]"
                                >
                                  <Edit className="h-2.5 w-2.5 mr-1" /> Editar
                                </button>
                                <button
                                  type="button"
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
                                  item.status === 'Ativo' ? 'bg-[#5cb85c]' : 'bg-[#d9534f]',
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
              </div>
            ) : loadError ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-600">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <p className="font-medium text-lg text-slate-800 mb-2">Erro ao carregar</p>
                <p className="text-sm text-slate-500 mb-6 max-w-md text-center">
                  {loadError.message}
                </p>
                <Button onClick={retryLoad} className="bg-[#337ab7] hover:bg-[#286090]">
                  Tentar Novamente
                </Button>
              </div>
            ) : isLoadingForm ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-500">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#337ab7] mb-4"></div>
                <span className="text-sm font-medium">Carregando dados do tipo de proposta...</span>
              </div>
            ) : (
              <form onSubmit={handleSave} className="flex flex-col md:flex-row gap-4 items-start">
                <div className="flex-1 w-full border border-slate-200 rounded-sm">
                  <div className="flex items-center gap-2 bg-slate-50 border-b border-slate-200 p-2.5">
                    <FileText className="w-4 h-4 text-slate-600" />
                    <h3 className="font-normal text-slate-700 text-sm">Dados</h3>
                  </div>

                  <div className="p-4 space-y-6">
                    <div className="grid grid-cols-[1fr_150px] gap-6">
                      <div className="flex flex-col">
                        <label className={labelClass}>Nome</label>
                        <input
                          required
                          className={inputClass}
                          value={formData.nome || ''}
                          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
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

                    <div className="grid grid-cols-2 gap-6">
                      <div className="flex flex-col justify-center">
                        <label className={labelClass}>Aplicar Fator de Nacionalização</label>
                        <div className="mt-1 flex items-center space-x-2">
                          <Switch
                            checked={formData.tem_fator || false}
                            onCheckedChange={(checked) =>
                              setFormData({ ...formData, tem_fator: checked })
                            }
                            className="data-[state=checked]:bg-[#337ab7]"
                          />
                          <span className="text-xs text-slate-600">
                            {formData.tem_fator ? 'Sim' : 'Não'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col">
                        <label className={labelClass}>Comissão (%)</label>
                        <PercentageInput
                          value={formData.comissao}
                          onChange={(v) => setFormData({ ...formData, comissao: v })}
                          isNumber={true}
                          placeholder="0,00%"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="flex flex-col">
                        <label className={labelClass}>Frase do Preço</label>
                        <input
                          className={inputClass}
                          value={formData.frase_preco || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, frase_preco: e.target.value })
                          }
                          placeholder="Frase do Preço"
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
                          placeholder="Frase Comissão"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="flex flex-col h-full">
                        <label className={labelClass}>Prazo de Entrega</label>
                        <textarea
                          className={cn(inputClass, 'min-h-[100px] resize-y leading-relaxed')}
                          value={formData.prazo_entrega || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, prazo_entrega: e.target.value })
                          }
                        />
                      </div>
                      <div className="flex flex-col h-full">
                        <label className={labelClass}>Condições de Pagamento</label>
                        <textarea
                          className={cn(inputClass, 'min-h-[100px] resize-y leading-relaxed')}
                          value={formData.condicoes_pagamento || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, condicoes_pagamento: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="flex flex-col h-full">
                        <label className={labelClass}>Garantia</label>
                        <textarea
                          className={cn(inputClass, 'min-h-[140px] resize-y leading-relaxed')}
                          value={formData.garantia || ''}
                          onChange={(e) => setFormData({ ...formData, garantia: e.target.value })}
                        />
                      </div>
                      <div className="flex flex-col h-full">
                        <label className={labelClass}>Assistência Técnica</label>
                        <textarea
                          className={cn(inputClass, 'min-h-[140px] resize-y leading-relaxed')}
                          value={formData.assistencia_tecnica || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, assistencia_tecnica: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="flex flex-col h-full">
                        <label className={labelClass}>Treinamento Técnico</label>
                        <textarea
                          className={cn(inputClass, 'min-h-[120px] resize-y leading-relaxed')}
                          value={formData.treinamento_tecnico || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, treinamento_tecnico: e.target.value })
                          }
                        />
                      </div>
                      <div className="flex flex-col h-full">
                        <label className={labelClass}>Transporte/Seguro</label>
                        <textarea
                          className={cn(inputClass, 'min-h-[120px] resize-y leading-relaxed')}
                          value={formData.transporte_seguro || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, transporte_seguro: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="flex flex-col h-full">
                        <label className={labelClass}>Validade desta Oferta</label>
                        <textarea
                          className={cn(inputClass, 'min-h-[100px] resize-y leading-relaxed')}
                          value={formData.validade_oferta || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, validade_oferta: e.target.value })
                          }
                        />
                      </div>
                      <div className="flex flex-col">
                        <label className={labelClass}>Dt. Cad</label>
                        <input
                          readOnly
                          className={cn(
                            inputClass,
                            'bg-slate-100 border-none px-2 rounded-sm text-slate-500 mt-1',
                          )}
                          value={
                            selectedItem?.created
                              ? format(new Date(selectedItem.created), 'dd/MM/yyyy HH:mm:ss')
                              : ''
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="flex flex-col h-full">
                        <label className={labelClass}>Imposto IPI</label>
                        <PercentageInput
                          value={formData.imposto_ipi}
                          onChange={(v) => setFormData({ ...formData, imposto_ipi: v })}
                          isNumber={false}
                          placeholder="0,00%"
                        />
                      </div>
                      <div className="flex flex-col h-full">
                        <label className={labelClass}>Imposto ICMS</label>
                        <PercentageInput
                          value={formData.imposto_icms}
                          onChange={(v) => setFormData({ ...formData, imposto_icms: v })}
                          isNumber={false}
                          placeholder="0,00%"
                        />
                      </div>
                    </div>

                    <div className="border-t border-slate-200 pt-4">
                      <label className="text-[11px] font-bold text-slate-700 mb-2 block">
                        Acessórios Padrão (Pré-selecionados ao usar este template)
                      </label>
                      <TemplateAcessorios
                        value={formData.acessorios_default || []}
                        onChange={(val) => setFormData({ ...formData, acessorios_default: val })}
                      />
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-[280px] shrink-0 border border-slate-200 rounded-sm">
                  <div className="flex items-center gap-2 bg-slate-50 border-b border-slate-200 p-2.5">
                    <Network className="w-4 h-4 text-slate-600" />
                    <h3 className="font-normal text-slate-700 text-sm">
                      Formas de Pagamento do Pedido
                    </h3>
                  </div>

                  <div className="p-4 space-y-3">
                    {[
                      'Faturamento a vista',
                      'Financiamento C.D.C.I. 1 a 9 parcelas',
                      'Financiamento C.D.C.I. 10 a 17 parcelas',
                    ].map((label) => {
                      const isChecked = formData.formas_pagamento_selecionadas?.includes(label)
                      return (
                        <div key={label} className="flex items-start space-x-2">
                          <input
                            type="checkbox"
                            id={`pgto-${label}`}
                            checked={isChecked}
                            onChange={(e) => {
                              const current = formData.formas_pagamento_selecionadas || []
                              if (e.target.checked) {
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
                            className="mt-[3px] h-3.5 w-3.5 border-slate-400 rounded-sm accent-[#337ab7]"
                          />
                          <label
                            htmlFor={`pgto-${label}`}
                            className="text-xs font-normal text-slate-700 cursor-pointer leading-snug pt-0.5"
                          >
                            {label}
                          </label>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
