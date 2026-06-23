import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { Pencil, Printer, List } from 'lucide-react'
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
import { getGerentes } from '@/services/cadastros'
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
  const [formData, setFormData] = useState<Partial<Proposta>>({})
  const [acessoriosProposta, setAcessoriosProposta] = useState<any[]>([])

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
    getGerentes()
      .then((res) => setGerentes(res))
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
          prazo_entrega:
            selectedProposta.prazo_entrega ||
            'Até 120/150 dias, salvo vendas prévias.\nConfirmar prazo de entrega.\n\n<B>Treinamento e Entrega Técnica</B>\nSerá emitida uma Nota Fiscal de serviços no valor de US$ 1.800,00, já com os impostos inclusos...',
          condicoes_pagamento:
            selectedProposta.condicoes_pagamento ||
            'À vista, Financiamento bancário ou a combinar.\nO valor final do equipamento ora ofertado, estará sujeito a reajuste ou correção de preços (para menos ou para mais) dependendo exclusivamente da variação cambial da moeda Dólar (venda) com relação à moeda nacional "REAL" conforme aos índices cambiais oficiais.',
          nota_rep: selectedProposta.nota_rep || 1,
        })

        if (
          selectedProposta.acessorios_proposta &&
          selectedProposta.acessorios_proposta.length > 0
        ) {
          setAcessoriosProposta(selectedProposta.acessorios_proposta)
        } else {
          const filter = selectedProposta.versao ? `versoes ~ "${selectedProposta.versao}"` : ''
          pb.collection('acessorios')
            .getFullList({ filter })
            .then((list) => {
              const initial = list.map((a) => ({
                id: a.id,
                nome: a.nome,
                valor: a.valor,
                moeda: a.moeda,
                estado: 'exibir',
              }))
              setAcessoriosProposta(initial)
            })
            .catch(console.error)
        }
      } else {
        setFormData({
          revisao: 'A',
          moeda: 'US$',
          valor_sem_desconto: 0,
          valor_atual: 0,
          valor_final: 0,
          prazo_entrega:
            'Até 120/150 dias, salvo vendas prévias.\nConfirmar prazo de entrega.\n\n<B>Treinamento e Entrega Técnica</B>\nSerá emitida uma Nota Fiscal de serviços no valor de US$ 1.800,00, já com os impostos inclusos...',
          condicoes_pagamento:
            'À vista, Financiamento bancário ou a combinar.\nO valor final do equipamento ora ofertado, estará sujeito a reajuste ou correção de preços (para menos ou para mais) dependendo exclusivamente da variação cambial da moeda Dólar (venda) com relação à moeda nacional "REAL" conforme aos índices cambiais oficiais.',
          nota_rep: 1,
        })
        pb.collection('acessorios')
          .getFullList()
          .then((list) => {
            const initial = list.map((a) => ({
              id: a.id,
              nome: a.nome,
              valor: a.valor,
              moeda: a.moeda,
              estado: 'exibir',
            }))
            setAcessoriosProposta(initial)
          })
          .catch(console.error)
      }
    }
  }, [selectedProposta, activeTab])

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
      <div className="flex items-center text-sm text-gray-400 gap-4">
        <div className="flex items-center gap-1">
          {pages.map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={cn(
                'px-3 py-1 min-w-[28px] text-center text-xs rounded-sm',
                p === page ? 'bg-[#0d6efd] text-white' : 'text-[#0d6efd] hover:bg-[#333]',
              )}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-2 py-1 text-gray-400 hover:text-white"
            disabled={page === totalPages}
          >
            ›
          </button>
        </div>
        <div className="text-xs flex items-center gap-3">
          <span>
            {start}-{end} de {totalItems.toLocaleString('pt-BR')}
          </span>
          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value))
              setPage(1)
            }}
            className="bg-[#2a2a2a] border border-[#444] rounded text-xs px-2 py-1 outline-none focus:border-[#0d6efd] text-white"
          >
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>
    )
  }

  const renderSortableHead = (label: string) => (
    <TableHead className="text-[#00d4ff] font-bold text-[13px] whitespace-nowrap bg-[#222] border-b border-[#444] py-3">
      <div className="flex items-center gap-1 cursor-pointer hover:opacity-80">
        <span>{label}</span>
        <span className="text-gray-400 leading-none inline-flex flex-col text-[10px]">
          <span>▲</span>
          <span className="-mt-[2px]">▼</span>
        </span>
      </div>
    </TableHead>
  )

  return (
    <div className="flex flex-col h-full bg-[#1c1c1c] text-gray-300 p-6 pt-4">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full flex-1 flex flex-col min-h-0"
      >
        <div className="flex justify-between items-end border-b border-[#444]">
          <TabsList className="bg-transparent justify-start rounded-none h-auto p-0 space-x-2">
            <TabsTrigger
              value="registros"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0d6efd] data-[state=active]:text-[#00d4ff] text-gray-500 font-semibold shadow-none px-4 py-2.5 text-sm bg-transparent"
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
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#0d6efd] data-[state=active]:text-[#00d4ff] text-gray-500 font-semibold shadow-none px-4 py-2.5 text-sm bg-transparent"
            >
              Cadastro
            </TabsTrigger>
          </TabsList>

          {activeTab === 'registros' && <div className="pb-2">{renderTopPagination()}</div>}
        </div>

        <TabsContent value="registros" className="mt-4 outline-none flex-1 flex flex-col min-h-0">
          <div className="border border-[#444] overflow-y-auto flex-1 bg-[#222] rounded-md">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[#444] hover:bg-transparent">
                  <TableHead className="w-[40px] text-center bg-[#222] border-b border-[#444] p-2">
                    <Checkbox
                      className="rounded-full border-gray-400 data-[state=checked]:bg-[#0d6efd] data-[state=checked]:border-[#0d6efd]"
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
                    <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                      Carregando...
                    </TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                      Nenhuma proposta encontrada.
                    </TableCell>
                  </TableRow>
                ) : (
                  data.map((item) => (
                    <TableRow key={item.id} className="hover:bg-[#2a2a2a] border-b border-[#333]">
                      <TableCell className="align-top py-4 text-center">
                        <Checkbox
                          className="rounded-full border-gray-400 data-[state=checked]:bg-[#0d6efd] data-[state=checked]:border-[#0d6efd]"
                          checked={selectedIds.has(item.id)}
                          onCheckedChange={(checked) => toggleSelect(item.id, !!checked)}
                        />
                      </TableCell>
                      <TableCell className="align-top py-4 min-w-[120px]">
                        <div className="font-bold text-white text-xs">{item.numero_proposta}</div>
                        <div className="flex flex-col mt-1.5 gap-1.5">
                          <button
                            onClick={() => handleEdit(item)}
                            className="flex items-center text-[#00d4ff] hover:underline text-[11px]"
                          >
                            <Pencil className="h-3 w-3 mr-1" /> Editar
                          </button>
                          <button className="flex items-center text-[#00d4ff] hover:underline text-[11px]">
                            <Printer className="h-3 w-3 mr-1" /> Visualizar
                          </button>
                        </div>
                      </TableCell>
                      <TableCell
                        className="align-top py-4 text-gray-300 text-xs uppercase max-w-[200px] truncate font-medium"
                        title={item.expand?.cliente?.razao_social || item.expand?.cliente?.fantasia}
                      >
                        {item.expand?.cliente?.razao_social ||
                          item.expand?.cliente?.fantasia ||
                          '-'}
                      </TableCell>
                      <TableCell className="align-top py-4 text-gray-300 text-xs">
                        {item.contato || '-'}
                      </TableCell>
                      <TableCell className="align-top py-4 text-gray-300 text-xs whitespace-nowrap">
                        {item.telefone || '-'}
                      </TableCell>
                      <TableCell
                        className="align-top py-4 text-gray-300 text-xs uppercase max-w-[300px] whitespace-normal leading-relaxed font-semibold"
                        title={item.expand?.versao?.nome}
                      >
                        {item.expand?.versao?.nome || '-'}
                      </TableCell>
                      <TableCell className="align-top py-4 text-gray-300 text-xs uppercase">
                        {item.expand?.representante?.fantasia || '-'}
                      </TableCell>
                      <TableCell className="align-top py-4 text-gray-300 text-xs text-center font-bold">
                        {item.nota_rep || '-'}
                      </TableCell>
                      <TableCell className="align-top py-4 text-gray-300 text-xs whitespace-nowrap">
                        {item.dt_cad ? format(new Date(item.dt_cad), 'dd/MM/yyyy') : '-'}
                      </TableCell>
                      <TableCell className="align-top py-4 text-gray-300 text-xs uppercase font-medium">
                        {item.expand?.user?.name || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center gap-4 mt-6">
            <Button className="bg-[#0d6efd] hover:bg-[#0b5ed7] text-white rounded-full px-6 py-2 h-9 text-[11px] font-bold tracking-widest shadow-none">
              PESQUISAR
            </Button>
            <Button className="bg-[#0d6efd] hover:bg-[#0b5ed7] text-white rounded-full px-6 py-2 h-9 text-[11px] font-bold tracking-widest shadow-none">
              EXCLUIR
            </Button>
            <Button
              onClick={openNotaDialog}
              className="bg-[#0d6efd] hover:bg-[#0b5ed7] text-white rounded-full px-6 py-2 h-9 text-[11px] font-bold tracking-widest shadow-none"
            >
              ALTERAR NOTA
            </Button>
          </div>
        </TabsContent>

        <Dialog open={isNotaDialogOpen} onOpenChange={setIsNotaDialogOpen}>
          <DialogContent className="bg-[#222] text-white border-[#444]">
            <DialogHeader>
              <DialogTitle>Alterar Nota</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <label className="block text-sm font-medium mb-2 text-gray-300">
                Selecione a nova nota:
              </label>
              <select
                value={novaNota}
                onChange={(e) => setNovaNota(Number(e.target.value))}
                className="w-full bg-[#1e1e1e] border border-[#444] text-white rounded-md px-3 py-2 outline-none focus:border-[#0d6efd]"
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
                className="border-[#444] text-gray-300 hover:text-white hover:bg-[#333]"
                onClick={() => setIsNotaDialogOpen(false)}
                disabled={isSavingNota}
              >
                Cancelar
              </Button>
              <Button
                className="bg-[#0d6efd] hover:bg-[#0b5ed7] text-white"
                onClick={handleAlterarNota}
                disabled={isSavingNota}
              >
                {isSavingNota ? 'Salvando...' : 'Salvar Nota'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <TabsContent value="cadastro" className="mt-4 outline-none flex-1 flex flex-col min-h-0">
          <div className="flex-1 min-h-0 bg-[#222] text-gray-300 p-6 font-sans text-sm overflow-y-auto rounded-md border border-[#444] shadow-inner">
            <div className="flex gap-4 mb-8">
              <Button className="bg-[#0d6efd] hover:bg-[#0b5ed7] text-white rounded-full px-6 py-2 h-9 text-xs font-bold tracking-widest">
                PESQUISAR
              </Button>
              <Button className="bg-[#0d6efd] hover:bg-[#0b5ed7] text-white rounded-full px-6 py-2 h-9 text-xs font-bold tracking-widest">
                VISUALIZAR PROPOSTA
              </Button>
              <Button
                onClick={handleSave}
                className="bg-[#0d6efd] hover:bg-[#0b5ed7] text-white rounded-full px-6 py-2 h-9 text-xs font-bold tracking-widest"
              >
                GERAR PROPOSTA
              </Button>
              <Button className="bg-[#0d6efd] hover:bg-[#0b5ed7] text-white rounded-full px-6 py-2 h-9 text-xs font-bold tracking-widest">
                VENDA
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-x-12 gap-y-6 mb-8">
              <div>
                <label className="block text-xs mb-1 text-[#00d4ff] font-medium">Código</label>
                <input
                  className="w-full bg-transparent border-b border-[#555] px-3 py-1.5 outline-none text-white focus:border-[#00d4ff] transition-colors"
                  readOnly
                  placeholder="Gerado automaticamente"
                  value={formData.numero_proposta || ''}
                  onChange={(e) => setFormData({ ...formData, numero_proposta: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs mb-1 text-[#00d4ff] font-medium">Revisão</label>
                <input
                  className="w-full bg-transparent border-b border-[#555] px-3 py-1.5 outline-none text-white focus:border-[#00d4ff] transition-colors"
                  value={formData.revisao || ''}
                  onChange={(e) => setFormData({ ...formData, revisao: e.target.value })}
                />
              </div>
            </div>

            <div className="border-b border-[#00d4ff] mb-4 pb-2 flex items-center gap-2">
              <List className="w-4 h-4 text-[#00d4ff]" />
              <h3 className="text-base font-semibold text-white">Acessórios</h3>
            </div>

            <div className="mb-8 border border-[#444] rounded-sm overflow-hidden">
              <table className="w-full text-left text-xs bg-[#2a2a2a]">
                <thead className="bg-[#1e1e1e] text-[#00d4ff] font-semibold border-b border-[#444]">
                  <tr>
                    <th className="py-3 px-4">Acessório</th>
                    <th className="py-3 px-4">Valor</th>
                    <th className="py-3 px-4 text-center">Incluir na Proposta</th>
                    <th className="py-3 px-4 text-center">Não exibir na Proposta</th>
                    <th className="py-3 px-4 text-center">Exibir na Proposta</th>
                  </tr>
                </thead>
                <tbody>
                  {acessoriosProposta.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-gray-500">
                        Nenhum acessório encontrado.
                      </td>
                    </tr>
                  ) : (
                    acessoriosProposta.map((acc, idx) => (
                      <tr key={idx} className="border-t border-[#444] hover:bg-[#333]">
                        <td className="py-2.5 px-4 font-medium text-white">{acc.nome}</td>
                        <td className="py-2.5 px-4">{formatCurrency(acc.valor, acc.moeda)}</td>
                        <td className="py-2.5 px-4 text-center">
                          <input
                            type="radio"
                            name={`acc_${idx}`}
                            checked={acc.estado === 'incluir'}
                            className="accent-[#0d6efd] cursor-pointer"
                            onChange={() => updateAcc(idx, 'incluir')}
                          />
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <input
                            type="radio"
                            name={`acc_${idx}`}
                            checked={acc.estado === 'nao_exibir'}
                            className="accent-[#0d6efd] cursor-pointer"
                            onChange={() => updateAcc(idx, 'nao_exibir')}
                          />
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <input
                            type="radio"
                            name={`acc_${idx}`}
                            checked={acc.estado === 'exibir'}
                            className="accent-[#0d6efd] cursor-pointer"
                            onChange={() => updateAcc(idx, 'exibir')}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-3 gap-12 mb-6">
              <div>
                <label className="block text-xs mb-1 text-[#00d4ff] font-medium">Moeda</label>
                <input
                  className="w-full bg-transparent border-b border-[#555] px-3 py-1.5 outline-none text-white focus:border-[#00d4ff]"
                  value={formData.moeda || ''}
                  onChange={(e) => setFormData({ ...formData, moeda: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs mb-1 text-[#00d4ff] font-medium">
                  Valor sem Desconto
                </label>
                <input
                  type="number"
                  className="w-full bg-transparent border-b border-[#555] px-3 py-1.5 outline-none text-white focus:border-[#00d4ff]"
                  value={formData.valor_sem_desconto || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, valor_sem_desconto: Number(e.target.value) })
                  }
                />
              </div>
              <div>
                <label className="block text-xs mb-1 text-[#00d4ff] font-medium">Valor Atual</label>
                <input
                  type="number"
                  className="w-full bg-transparent border-b border-[#555] px-3 py-1.5 outline-none text-white focus:border-[#00d4ff]"
                  value={formData.valor_atual || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, valor_atual: Number(e.target.value) })
                  }
                />
              </div>
            </div>

            <div className="mb-8">
              <label className="block text-xs mb-1 text-[#00d4ff] font-medium">Valor</label>
              <input
                type="number"
                className="w-1/3 bg-transparent border-b border-[#555] px-3 py-1.5 outline-none text-white focus:border-[#00d4ff]"
                value={formData.valor_final || ''}
                onChange={(e) => setFormData({ ...formData, valor_final: Number(e.target.value) })}
              />
            </div>

            <div className="grid grid-cols-2 gap-12 mb-8">
              <div>
                <label className="block text-xs mb-1 text-[#00d4ff] font-medium">
                  Prazo de Entrega
                </label>
                <textarea
                  className="w-full bg-[#1e1e1e] border border-[#555] rounded-md px-3 py-2 outline-none text-white resize-none h-32 text-xs focus:border-[#00d4ff]"
                  value={formData.prazo_entrega || ''}
                  onChange={(e) => setFormData({ ...formData, prazo_entrega: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs mb-1 text-[#00d4ff] font-medium">
                  Condições de Pagamento
                </label>
                <textarea
                  className="w-full bg-[#1e1e1e] border border-[#555] rounded-md px-3 py-2 outline-none text-white resize-none h-32 text-xs focus:border-[#00d4ff]"
                  value={formData.condicoes_pagamento || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, condicoes_pagamento: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-12 mb-8">
              <div>
                <label className="block text-xs mb-1 text-[#00d4ff] font-medium">Gerente</label>
                <select
                  className="w-full bg-transparent border-b border-[#00d4ff] px-3 py-1.5 outline-none text-white focus:border-white appearance-none"
                  value={formData.gerente || ''}
                  onChange={(e) => setFormData({ ...formData, gerente: e.target.value })}
                >
                  <option value="" className="bg-[#222]">
                    Selecione...
                  </option>
                  {gerentes.map((g) => (
                    <option key={g.id} value={g.id} className="bg-[#222]">
                      {g.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1 text-[#00d4ff] font-medium">Nota</label>
                <select
                  className="w-full bg-transparent border-b border-[#00d4ff] px-3 py-1.5 outline-none text-white focus:border-white appearance-none"
                  value={formData.nota_rep || ''}
                  onChange={(e) => setFormData({ ...formData, nota_rep: Number(e.target.value) })}
                >
                  <option value="1" className="bg-[#222]">
                    1
                  </option>
                  <option value="2" className="bg-[#222]">
                    2
                  </option>
                  <option value="3" className="bg-[#222]">
                    3
                  </option>
                  <option value="4" className="bg-[#222]">
                    4
                  </option>
                  <option value="5" className="bg-[#222]">
                    5
                  </option>
                </select>
              </div>
            </div>

            <div className="flex gap-4">
              <Button className="bg-[#0d6efd] hover:bg-[#0b5ed7] text-white rounded-full px-6 py-2 h-9 text-xs font-bold tracking-widest">
                PESQUISAR
              </Button>
              <Button className="bg-[#0d6efd] hover:bg-[#0b5ed7] text-white rounded-full px-6 py-2 h-9 text-xs font-bold tracking-widest">
                VISUALIZAR PROPOSTA
              </Button>
              <Button
                onClick={handleSave}
                className="bg-[#0d6efd] hover:bg-[#0b5ed7] text-white rounded-full px-6 py-2 h-9 text-xs font-bold tracking-widest"
              >
                GERAR PROPOSTA
              </Button>
              <Button className="bg-[#0d6efd] hover:bg-[#0b5ed7] text-white rounded-full px-6 py-2 h-9 text-xs font-bold tracking-widest">
                VENDA
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
