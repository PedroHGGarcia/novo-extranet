import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Pencil, Printer, List, Eye, ArrowDownUp, ChevronRight } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { cn } from '@/lib/utils'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

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

export default function EmitirProposta() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('registros')
  const [selectedProposta, setSelectedProposta] = useState<Proposta | null>(null)

  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(50)
  const [data, setData] = useState<Proposta[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const [gerentes, setGerentes] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [representantes, setRepresentantes] = useState<any[]>([])
  const [versoes, setVersoes] = useState<any[]>([])

  const [formData, setFormData] = useState<Partial<Proposta>>({})
  const [acessoriosProposta, setAcessoriosProposta] = useState<any[]>([])

  // Local UI states for fields not directly in the Proposta schema
  const [estoqueUI, setEstoqueUI] = useState('')
  const [descontoUI, setDescontoUI] = useState('')

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isNotaDialogOpen, setIsNotaDialogOpen] = useState(false)
  const [novaNota, setNovaNota] = useState<number>(1)
  const [isSavingNota, setIsSavingNota] = useState(false)

  const loadData = async () => {
    try {
      setIsLoading(true)
      const res = await getPropostasPaginated(page, perPage)
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
  }, [page, perPage])

  useEffect(() => {
    pb.collection('gerentes')
      .getFullList({ sort: 'nome' })
      .then(setGerentes)
      .catch(() => {})
    pb.collection('clientes')
      .getFullList({ sort: 'fantasia' })
      .then(setClientes)
      .catch(() => {})
    pb.collection('representantes')
      .getFullList({ sort: 'fantasia' })
      .then(setRepresentantes)
      .catch(() => {})
    pb.collection('versoes')
      .getFullList({ sort: 'nome' })
      .then(setVersoes)
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (activeTab === 'cadastro') {
      if (selectedProposta) {
        setFormData({
          ...selectedProposta,
          revisao: selectedProposta.revisao || 'A',
          moeda: selectedProposta.moeda || 'US$',
          valor_sem_desconto: selectedProposta.valor_sem_desconto || 0,
          valor_atual: selectedProposta.valor_atual || 0,
          valor_final: selectedProposta.valor_final || 0,
          nota_rep: selectedProposta.nota_rep || 1,
        })

        if (
          selectedProposta.acessorios_proposta &&
          selectedProposta.acessorios_proposta.length > 0
        ) {
          setAcessoriosProposta(selectedProposta.acessorios_proposta)
        } else {
          loadAcessorios(selectedProposta.versao)
        }
      } else {
        setFormData({
          revisao: 'A',
          moeda: 'US$',
          valor_sem_desconto: 0,
          valor_atual: 0,
          valor_final: 0,
          nota_rep: 1,
        })
        loadAcessorios('')
      }
    }
  }, [selectedProposta, activeTab])

  const loadAcessorios = async (versaoId?: string) => {
    try {
      const filter = versaoId ? `versoes ~ "${versaoId}"` : ''
      const list = await pb.collection('acessorios').getFullList({ filter })
      const initial = list.map((a) => ({
        id: a.id,
        nome: a.nome,
        valor: a.valor,
        moeda: a.moeda,
        estado: 'exibir',
      }))
      setAcessoriosProposta(initial)
    } catch (e) {
      console.error('Failed to load accessories', e)
    }
  }

  const handleVersaoChange = (versaoId: string) => {
    setFormData((prev) => ({ ...prev, versao: versaoId }))
    loadAcessorios(versaoId)
  }

  useRealtime('propostas', () => {
    loadData()
  })

  const handleEdit = (item: Proposta) => {
    setSelectedProposta(item)
    setActiveTab('cadastro')
  }

  const handleCreateNew = () => {
    setSelectedProposta(null)
    setActiveTab('cadastro')
  }

  const handleSave = async () => {
    try {
      if (selectedProposta) {
        await updateProposta(selectedProposta.id, {
          ...formData,
          acessorios_proposta: acessoriosProposta,
        })
        toast({ title: 'Proposta atualizada com sucesso' })
      } else {
        await pb.collection('propostas').create({
          ...formData,
          numero_proposta: formData.numero_proposta || `NOVA-${Math.floor(Math.random() * 10000)}`,
          acessorios_proposta: acessoriosProposta,
        })
        toast({ title: 'Proposta criada com sucesso' })
      }
      loadData()
      setActiveTab('registros')
    } catch (e) {
      toast({ title: 'Erro ao salvar proposta', variant: 'destructive' })
    }
  }

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(data.map((item) => item.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const toggleSelect = (id: string, checked: boolean) => {
    const next = new Set(selectedIds)
    if (checked) next.add(id)
    else next.delete(id)
    setSelectedIds(next)
  }

  const openNotaDialog = () => {
    if (selectedIds.size === 0) {
      toast({ title: 'Selecione ao menos uma proposta.', variant: 'destructive' })
      return
    }
    setNovaNota(1)
    setIsNotaDialogOpen(true)
  }

  const handleAlterarNota = async () => {
    setIsSavingNota(true)
    try {
      for (const id of Array.from(selectedIds)) {
        await updateProposta(id, { nota_rep: novaNota })
      }
      toast({ title: 'Nota atualizada com sucesso!' })
      setIsNotaDialogOpen(false)
      setSelectedIds(new Set())
      loadData()
    } catch (error) {
      toast({ title: 'Erro ao salvar nota. Tente novamente.', variant: 'destructive' })
    } finally {
      setIsSavingNota(false)
    }
  }

  const updateAcc = (index: number, estado: string) => {
    const newAcc = [...acessoriosProposta]
    newAcc[index].estado = estado
    setAcessoriosProposta(newAcc)
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

  const renderSortableHead = (label: string) => (
    <TableHead className="text-[#337ab7] font-normal text-[11px] whitespace-nowrap bg-white border-b-2 border-slate-200 py-3 px-3 h-auto">
      <div className="flex items-center gap-1 cursor-pointer hover:underline">
        {label}
        <ArrowDownUp className="w-3 h-3 opacity-50" />
      </div>
    </TableHead>
  )

  const renderCadastroActionBars = () => (
    <div className="flex gap-2">
      <Button className="bg-[#337ab7] hover:bg-[#286090] text-white rounded-sm px-4 py-1.5 h-auto text-xs shadow-none uppercase font-normal">
        PESQUISAR
      </Button>
      <Button className="bg-[#337ab7] hover:bg-[#286090] text-white rounded-sm px-4 py-1.5 h-auto text-xs shadow-none uppercase font-normal">
        VISUALIZAR PROPOSTA
      </Button>
      <Button
        onClick={handleSave}
        className="bg-[#337ab7] hover:bg-[#286090] text-white rounded-sm px-4 py-1.5 h-auto text-xs shadow-none uppercase font-normal"
      >
        GERAR PROPOSTA
      </Button>
      <Button className="bg-[#337ab7] hover:bg-[#286090] text-white rounded-sm px-4 py-1.5 h-auto text-xs shadow-none uppercase font-normal">
        VENDA
      </Button>
    </div>
  )

  const inputClass =
    'w-full bg-white border border-slate-300 rounded-sm px-2 py-1.5 outline-none text-slate-700 text-xs focus:border-[#337ab7] min-h-[30px]'
  const labelClass = 'text-[11px] font-bold text-slate-700 mb-1'

  return (
    <div className="flex flex-col h-full bg-white text-slate-700 font-sans overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-center gap-2">
        <Printer className="w-6 h-6 text-slate-700" />
        <h1 className="text-2xl font-normal text-slate-700 tracking-tight">Emitir Proposta</h1>
      </div>
      <div className="w-full border-b border-slate-200"></div>

      {/* Actions */}
      <div className="px-4 py-3 flex items-center gap-2 bg-white border-b border-slate-200">
        <Button className="bg-[#337ab7] hover:bg-[#286090] text-white rounded-sm px-4 py-1.5 h-auto text-xs shadow-none uppercase font-normal tracking-wide">
          PESQUISAR
        </Button>
        <Button className="bg-[#337ab7] hover:bg-[#286090] text-white rounded-sm px-4 py-1.5 h-auto text-xs shadow-none uppercase font-normal tracking-wide">
          EXCLUIR
        </Button>
        <Button
          onClick={openNotaDialog}
          className="bg-[#337ab7] hover:bg-[#286090] text-white rounded-sm px-4 py-1.5 h-auto text-xs shadow-none uppercase font-normal tracking-wide"
        >
          ALTERAR NOTA
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col min-h-0 w-full"
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-4">
          <TabsList className="bg-transparent justify-start rounded-none h-auto p-0 space-x-2">
            <TabsTrigger
              value="registros"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#337ab7] data-[state=active]:text-[#337ab7] text-[#337ab7] font-normal shadow-none px-4 py-2.5 text-sm bg-transparent transition-colors hover:text-[#286090]"
            >
              Registros
            </TabsTrigger>
            <TabsTrigger
              value="cadastro"
              onClick={() => {
                if (activeTab !== 'cadastro' && !selectedProposta) {
                  handleCreateNew()
                }
              }}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#337ab7] data-[state=active]:text-[#337ab7] text-[#337ab7] font-normal shadow-none px-4 py-2.5 text-sm bg-transparent transition-colors hover:text-[#286090]"
            >
              Cadastro
            </TabsTrigger>
          </TabsList>
          {activeTab === 'registros' && renderTopPagination()}
        </div>

        <TabsContent value="registros" className="flex-1 min-h-0 m-0 overflow-auto outline-none">
          <Table>
            <TableHeader className="sticky top-0 bg-white z-10 shadow-sm">
              <TableRow className="border-b-2 border-slate-200 hover:bg-transparent">
                <TableHead className="w-[40px] px-3 py-3 bg-white h-auto border-b-2 border-slate-200">
                  <Checkbox
                    className="border-slate-300 rounded-[2px] data-[state=checked]:bg-[#337ab7] data-[state=checked]:border-[#337ab7]"
                    checked={data.length > 0 && selectedIds.size === data.length}
                    onCheckedChange={(checked) => toggleSelectAll(!!checked)}
                  />
                </TableHead>
                {renderSortableHead('Proposta')}
                {renderSortableHead('Razão Social')}
                {renderSortableHead('Contato')}
                {renderSortableHead('Telefone')}
                {renderSortableHead('Versão')}
                {renderSortableHead('Representante')}
                {renderSortableHead('Nota Rep.')}
                {renderSortableHead('Dt. Cad')}
                {renderSortableHead('Por')}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-slate-500">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-slate-500">
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
                        className="border-slate-300 rounded-[2px] data-[state=checked]:bg-[#337ab7] data-[state=checked]:border-[#337ab7]"
                        checked={selectedIds.has(item.id)}
                        onCheckedChange={(checked) => toggleSelect(item.id, !!checked)}
                      />
                    </TableCell>
                    <TableCell className="align-top py-2.5 px-3 min-w-[100px]">
                      <div className="text-slate-600 text-xs">
                        {item.numero_proposta}
                        {item.revisao ? `-${item.revisao}` : ''}
                      </div>
                      <div className="flex flex-col mt-0.5 gap-0.5">
                        <button
                          onClick={() => handleEdit(item)}
                          className="flex items-center text-[#337ab7] hover:underline text-[10px] w-fit"
                        >
                          <Pencil className="h-2.5 w-2.5 mr-1" fill="currentColor" /> Editar
                        </button>
                        <button className="flex items-center text-[#337ab7] hover:underline text-[10px] w-fit">
                          <Eye className="h-2.5 w-2.5 mr-1" /> Visualizar
                        </button>
                      </div>
                    </TableCell>
                    <TableCell
                      className="align-top py-2.5 px-3 text-slate-700 text-[10px] uppercase max-w-[200px] truncate"
                      title={item.expand?.cliente?.razao_social || item.expand?.cliente?.fantasia}
                    >
                      {item.expand?.cliente?.razao_social || item.expand?.cliente?.fantasia || '-'}
                    </TableCell>
                    <TableCell className="align-top py-2.5 px-3 text-slate-700 text-[10px]">
                      {item.contato || '-'}
                    </TableCell>
                    <TableCell className="align-top py-2.5 px-3 text-slate-700 text-[10px] whitespace-nowrap">
                      {item.telefone || '-'}
                    </TableCell>
                    <TableCell
                      className="align-top py-2.5 px-3 text-slate-700 text-[10px] uppercase max-w-[300px] whitespace-normal leading-relaxed"
                      title={item.expand?.versao?.nome}
                    >
                      {item.expand?.versao?.nome || '-'}
                    </TableCell>
                    <TableCell className="align-top py-2.5 px-3 text-slate-700 text-[10px] uppercase">
                      {item.expand?.representante?.fantasia || '-'}
                    </TableCell>
                    <TableCell className="align-top py-2.5 px-3 text-slate-700 text-[10px]">
                      {item.nota_rep || '-'}
                    </TableCell>
                    <TableCell className="align-top py-2.5 px-3 text-slate-700 text-[10px] whitespace-nowrap">
                      {item.dt_cad ? format(new Date(item.dt_cad), 'dd/MM/yyyy') : '-'}
                    </TableCell>
                    <TableCell className="align-top py-2.5 px-3 text-slate-700 text-[10px] uppercase">
                      {item.expand?.user?.name || '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent
          value="cadastro"
          className="flex-1 min-h-0 m-0 overflow-auto outline-none p-6 bg-white"
        >
          <div className="max-w-7xl mx-auto w-full flex flex-col items-start pb-10">
            <div className="mb-6 w-full border-b border-slate-200 pb-4">
              {renderCadastroActionBars()}
            </div>

            <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <div className="flex flex-col w-full">
                <label className={labelClass}>Código Para pesquisar</label>
                <input
                  className={inputClass}
                  readOnly
                  placeholder="Gerado automaticamente"
                  value={formData.numero_proposta || ''}
                  onChange={(e) => setFormData({ ...formData, numero_proposta: e.target.value })}
                />
              </div>
              <div className="flex flex-col w-full">
                <label className={labelClass}>Representante</label>
                <select
                  className={inputClass}
                  value={formData.representante || ''}
                  onChange={(e) => setFormData({ ...formData, representante: e.target.value })}
                >
                  <option value=""></option>
                  {representantes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.fantasia}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col w-full">
                <label className={labelClass}>Cliente</label>
                <select
                  className={inputClass}
                  value={formData.cliente || ''}
                  onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                >
                  <option value=""></option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fantasia || c.razao_social}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col w-full">
                <label className={labelClass}>Gerente</label>
                <select
                  className={inputClass}
                  value={formData.gerente || ''}
                  onChange={(e) => setFormData({ ...formData, gerente: e.target.value })}
                >
                  <option value=""></option>
                  {gerentes.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="flex flex-col w-full">
                <label className={labelClass}>Versão</label>
                <select
                  className={inputClass}
                  value={formData.versao || ''}
                  onChange={(e) => handleVersaoChange(e.target.value)}
                >
                  <option value=""></option>
                  {versoes.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="w-full grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
              <div className="flex flex-col w-full">
                <label className={labelClass}>Tipo de Proposta</label>
                <div className="flex items-center gap-2">
                  <select
                    className={cn(inputClass, 'flex-1')}
                    value={formData.revisao || ''}
                    onChange={(e) => setFormData({ ...formData, revisao: e.target.value })}
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
                  <Pencil className="w-4 h-4 text-[#337ab7] cursor-pointer shrink-0" />
                </div>
              </div>
              <div className="flex flex-col w-full">
                <label className={labelClass}>Estoque</label>
                <select
                  className={inputClass}
                  value={estoqueUI}
                  onChange={(e) => setEstoqueUI(e.target.value)}
                >
                  <option value=""></option>
                  <option value="disponivel">Disponível</option>
                  <option value="indisponivel">Indisponível</option>
                </select>
              </div>
              <div className="flex flex-col w-full">
                <label className={labelClass}>Moeda</label>
                <select
                  className={inputClass}
                  value={formData.moeda || ''}
                  onChange={(e) => setFormData({ ...formData, moeda: e.target.value })}
                >
                  <option value="BRL">BRL</option>
                  <option value="US$">US$</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
              <div className="flex flex-col w-full">
                <label className={labelClass}>Valor</label>
                <input
                  type="number"
                  className={inputClass}
                  value={formData.valor_final || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, valor_final: Number(e.target.value) })
                  }
                />
              </div>
              <div className="flex flex-col w-full">
                <label className={labelClass}>Desconto</label>
                <select
                  className={inputClass}
                  value={descontoUI}
                  onChange={(e) => setDescontoUI(e.target.value)}
                >
                  <option value=""></option>
                  <option value="5%">5%</option>
                  <option value="10%">10%</option>
                </select>
              </div>
            </div>

            <div className="text-[11px] font-bold text-slate-700 mb-8 w-full border-b border-slate-200 pb-4">
              EUR: 5,97 US$: 5,11 R$: 1,00
            </div>

            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="flex flex-col w-full">
                <label className={labelClass}>Prazo de Entrega</label>
                <input
                  className={inputClass}
                  value={formData.prazo_entrega || ''}
                  onChange={(e) => setFormData({ ...formData, prazo_entrega: e.target.value })}
                />
              </div>
              <div className="flex flex-col w-full">
                <label className={labelClass}>Condições de Pagamento</label>
                <input
                  className={inputClass}
                  value={formData.condicoes_pagamento || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, condicoes_pagamento: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="border-b border-slate-200 w-full mb-4 pb-2">
              <h3 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <List className="w-4 h-4" /> Acessórios
              </h3>
            </div>

            <div className="w-full mb-8 border border-slate-200 rounded-sm overflow-x-auto">
              <table className="w-full text-left text-[11px] bg-white border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-4 font-normal text-slate-600">Acessório</th>
                    <th className="py-2.5 px-4 font-normal text-slate-600">Valor</th>
                    <th className="py-2.5 px-4 font-normal text-slate-600 text-center">
                      Incluir na Proposta
                    </th>
                    <th className="py-2.5 px-4 font-normal text-slate-600 text-center">
                      Não exibir na Proposta
                    </th>
                    <th className="py-2.5 px-4 font-normal text-slate-600 text-center">
                      Exibir na Proposta
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {acessoriosProposta.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-slate-400">
                        Nenhum acessório encontrado.
                      </td>
                    </tr>
                  ) : (
                    acessoriosProposta.map((acc, idx) => (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-2.5 px-4 text-slate-700">{acc.nome}</td>
                        <td className="py-2.5 px-4 text-slate-700">
                          {formatCurrency(acc.valor, acc.moeda)}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <input
                            type="radio"
                            name={`acc_${idx}`}
                            checked={acc.estado === 'incluir'}
                            className="accent-[#337ab7] cursor-pointer"
                            onChange={() => updateAcc(idx, 'incluir')}
                          />
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <input
                            type="radio"
                            name={`acc_${idx}`}
                            checked={acc.estado === 'nao_exibir'}
                            className="accent-[#337ab7] cursor-pointer"
                            onChange={() => updateAcc(idx, 'nao_exibir')}
                          />
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <input
                            type="radio"
                            name={`acc_${idx}`}
                            checked={acc.estado === 'exibir'}
                            className="accent-[#337ab7] cursor-pointer"
                            onChange={() => updateAcc(idx, 'exibir')}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="w-full mt-4 border-t border-slate-200 pt-6">
              {renderCadastroActionBars()}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isNotaDialogOpen} onOpenChange={setIsNotaDialogOpen}>
        <DialogContent className="bg-white text-slate-800 border-slate-200 rounded-sm">
          <DialogHeader>
            <DialogTitle>Alterar Nota</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <label className="block text-sm font-medium mb-2 text-slate-700">
              Selecione a nova nota:
            </label>
            <select
              value={novaNota}
              onChange={(e) => setNovaNota(Number(e.target.value))}
              className="w-full bg-white border border-slate-300 text-slate-700 rounded-sm px-3 py-2 outline-none focus:border-[#337ab7]"
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
            </select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              className="border-slate-300 text-slate-700 hover:bg-slate-50 rounded-sm"
              onClick={() => setIsNotaDialogOpen(false)}
              disabled={isSavingNota}
            >
              Cancelar
            </Button>
            <Button
              className="bg-[#337ab7] hover:bg-[#286090] text-white rounded-sm"
              onClick={handleAlterarNota}
              disabled={isSavingNota}
            >
              {isSavingNota ? 'Salvando...' : 'Salvar Nota'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
