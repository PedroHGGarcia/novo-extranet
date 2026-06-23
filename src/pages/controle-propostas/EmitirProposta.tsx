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
    if (selectedProposta && activeTab === 'cadastro') {
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

      if (selectedProposta.acessorios_proposta && selectedProposta.acessorios_proposta.length > 0) {
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
    }
  }, [selectedProposta, activeTab])

  useRealtime('propostas', () => {
    loadData()
  })

  const handleEdit = (item: Proposta) => {
    setSelectedProposta(item)
    setActiveTab('cadastro')
  }

  const handleSave = async () => {
    if (!selectedProposta) return
    try {
      await updateProposta(selectedProposta.id, {
        ...formData,
        acessorios_proposta: acessoriosProposta,
      })
      toast({ title: 'Proposta atualizada com sucesso' })
      loadData()
    } catch (e) {
      toast({ title: 'Erro ao atualizar proposta', variant: 'destructive' })
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
      <div className="flex items-center text-sm text-gray-600 gap-4">
        <div className="flex items-center">
          {pages.map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={cn(
                'px-3 py-1.5 min-w-[32px] text-center text-xs',
                p === page ? 'bg-[#3b82f6] text-white' : 'text-[#3b82f6] hover:bg-gray-100',
              )}
            >
              {p}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="px-2 py-1.5 text-[#3b82f6] hover:bg-gray-100 font-bold"
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
            className="border border-gray-300 rounded text-xs px-2 py-1 outline-none focus:border-[#3b82f6]"
          >
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>
    )
  }

  const renderSortableHead = (label: string) => (
    <TableHead className="text-[#3b82f6] font-medium text-[13px] whitespace-nowrap bg-white border-b py-3">
      <div className="flex items-center gap-1 cursor-pointer hover:opacity-80">
        <span>{label}</span>
        <span className="text-gray-300 leading-none inline-flex flex-col text-[10px]">
          <span>▲</span>
          <span className="-mt-[2px]">▼</span>
        </span>
      </div>
    </TableHead>
  )

  return (
    <div className="flex flex-col h-full bg-white text-gray-800 p-6 pt-4">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full flex-1 flex flex-col min-h-0"
      >
        <div className="flex justify-between items-end border-b border-gray-200">
          <TabsList className="bg-transparent justify-start rounded-none h-auto p-0 space-x-6">
            <TabsTrigger
              value="registros"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#3b82f6] data-[state=active]:text-[#3b82f6] data-[state=active]:font-semibold data-[state=active]:shadow-none px-2 py-2 text-sm bg-transparent"
            >
              Registros
            </TabsTrigger>
            <TabsTrigger
              value="cadastro"
              disabled={!selectedProposta}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#3b82f6] data-[state=active]:text-[#3b82f6] data-[state=active]:font-semibold data-[state=active]:shadow-none px-2 py-2 text-sm bg-transparent text-gray-500 disabled:opacity-50"
            >
              Cadastro
            </TabsTrigger>
          </TabsList>

          {activeTab === 'registros' && <div className="pb-2">{renderTopPagination()}</div>}
        </div>

        <TabsContent
          value="registros"
          className="mt-0 outline-none flex-1 flex flex-col min-h-0 pt-4"
        >
          <div className="border border-gray-200 overflow-y-auto flex-1 bg-white">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-200 hover:bg-transparent">
                  <TableHead className="w-[40px] text-center bg-white border-b p-2">
                    <Checkbox />
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
                    <TableRow
                      key={item.id}
                      className="hover:bg-gray-50/50 border-b border-gray-100"
                    >
                      <TableCell className="align-top py-4 text-center">
                        <Checkbox />
                      </TableCell>
                      <TableCell className="align-top py-4 min-w-[120px]">
                        <div className="font-medium text-gray-700 text-xs">
                          {item.numero_proposta}
                        </div>
                        <div className="flex flex-col mt-1.5 gap-1.5">
                          <button
                            onClick={() => handleEdit(item)}
                            className="flex items-center text-[#3b82f6] hover:underline text-[11px]"
                          >
                            <Pencil className="h-3 w-3 mr-1" /> Editar
                          </button>
                          <button className="flex items-center text-[#3b82f6] hover:underline text-[11px]">
                            <Printer className="h-3 w-3 mr-1" /> Visualizar
                          </button>
                        </div>
                      </TableCell>
                      <TableCell
                        className="align-top py-4 text-gray-600 text-xs uppercase max-w-[200px] truncate"
                        title={item.expand?.cliente?.razao_social || item.expand?.cliente?.fantasia}
                      >
                        {item.expand?.cliente?.razao_social ||
                          item.expand?.cliente?.fantasia ||
                          '-'}
                      </TableCell>
                      <TableCell className="align-top py-4 text-gray-600 text-xs">
                        {item.contato || '-'}
                      </TableCell>
                      <TableCell className="align-top py-4 text-gray-600 text-xs whitespace-nowrap">
                        {item.telefone || '-'}
                      </TableCell>
                      <TableCell
                        className="align-top py-4 text-gray-600 text-xs uppercase max-w-[300px] whitespace-normal leading-relaxed"
                        title={item.expand?.versao?.nome}
                      >
                        {item.expand?.versao?.nome || '-'}
                      </TableCell>
                      <TableCell className="align-top py-4 text-gray-600 text-xs uppercase">
                        {item.expand?.representante?.fantasia || '-'}
                      </TableCell>
                      <TableCell className="align-top py-4 text-gray-600 text-xs text-center">
                        {item.nota_rep || '-'}
                      </TableCell>
                      <TableCell className="align-top py-4 text-gray-600 text-xs whitespace-nowrap">
                        {item.dt_cad ? format(new Date(item.dt_cad), 'dd/MM/yyyy') : '-'}
                      </TableCell>
                      <TableCell className="align-top py-4 text-gray-600 text-xs uppercase">
                        {item.expand?.user?.name || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center gap-2 mt-4 pt-2">
            <Button className="bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-sm px-6 py-2 h-9 text-[11px] font-semibold tracking-wider shadow-none">
              PESQUISAR
            </Button>
            <Button className="bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-sm px-6 py-2 h-9 text-[11px] font-semibold tracking-wider shadow-none">
              EXCLUIR
            </Button>
            <Button className="bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-sm px-6 py-2 h-9 text-[11px] font-semibold tracking-wider shadow-none">
              ALTERAR NOTA
            </Button>
          </div>
        </TabsContent>

        <TabsContent
          value="cadastro"
          className="mt-0 outline-none flex-1 flex flex-col min-h-0 pt-4"
        >
          {selectedProposta && (
            <div className="bg-[#242424] text-[#d4d4d4] p-6 font-sans text-sm overflow-y-auto h-full rounded-sm border border-[#333] shadow-inner">
              <div className="flex gap-2 mb-8">
                <Button className="bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-none px-6 py-2 h-9 text-xs font-semibold tracking-wider">
                  PESQUISAR
                </Button>
                <Button className="bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-none px-6 py-2 h-9 text-xs font-semibold tracking-wider">
                  VISUALIZAR PROPOSTA
                </Button>
                <Button
                  onClick={handleSave}
                  className="bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-none px-6 py-2 h-9 text-xs font-semibold tracking-wider"
                >
                  GERAR PROPOSTA
                </Button>
                <Button className="bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-none px-6 py-2 h-9 text-xs font-semibold tracking-wider">
                  VENDA
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-x-12 gap-y-6 mb-8">
                <div>
                  <label className="block text-xs mb-1 text-gray-400">Código</label>
                  <input
                    className="w-full bg-[#333] border-b border-[#555] px-3 py-1.5 outline-none text-white focus:border-[#3b82f6] transition-colors"
                    readOnly
                    value={formData.numero_proposta || ''}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1 text-gray-400">Revisão</label>
                  <input
                    className="w-full bg-[#333] border-b border-[#555] px-3 py-1.5 outline-none text-white focus:border-[#3b82f6] transition-colors"
                    value={formData.revisao || ''}
                    onChange={(e) => setFormData({ ...formData, revisao: e.target.value })}
                  />
                </div>
              </div>

              <div className="border-b border-[#3b82f6] mb-4 pb-2 flex items-center gap-2">
                <List className="w-4 h-4 text-white" />
                <h3 className="text-base font-semibold text-white">Acessórios</h3>
              </div>

              <div className="mb-8 border border-[#444] rounded-sm overflow-hidden">
                <table className="w-full text-left text-xs bg-[#2a2a2a]">
                  <thead className="bg-[#333] text-gray-300">
                    <tr>
                      <th className="py-2.5 px-4 font-normal">Acessório</th>
                      <th className="py-2.5 px-4 font-normal">Valor</th>
                      <th className="py-2.5 px-4 font-normal text-center">Incluir na Proposta</th>
                      <th className="py-2.5 px-4 font-normal text-center">
                        Não exibir na Proposta
                      </th>
                      <th className="py-2.5 px-4 font-normal text-center">Exibir na Proposta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {acessoriosProposta.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-gray-500">
                          Nenhum acessório encontrado.
                        </td>
                      </tr>
                    ) : (
                      acessoriosProposta.map((acc, idx) => (
                        <tr key={idx} className="border-t border-[#444] hover:bg-[#333]">
                          <td className="py-2.5 px-4">{acc.nome}</td>
                          <td className="py-2.5 px-4">{formatCurrency(acc.valor, acc.moeda)}</td>
                          <td className="py-2.5 px-4 text-center">
                            <input
                              type="radio"
                              name={`acc_${idx}`}
                              checked={acc.estado === 'incluir'}
                              onChange={() => updateAcc(idx, 'incluir')}
                            />
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <input
                              type="radio"
                              name={`acc_${idx}`}
                              checked={acc.estado === 'nao_exibir'}
                              onChange={() => updateAcc(idx, 'nao_exibir')}
                            />
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <input
                              type="radio"
                              name={`acc_${idx}`}
                              checked={acc.estado === 'exibir'}
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
                  <label className="block text-xs mb-1 text-gray-400">Moeda</label>
                  <input
                    className="w-full bg-[#333] border-b border-[#555] px-3 py-1.5 outline-none text-white focus:border-[#3b82f6]"
                    value={formData.moeda || ''}
                    onChange={(e) => setFormData({ ...formData, moeda: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1 text-gray-400">Valor sem Desconto</label>
                  <input
                    type="number"
                    className="w-full bg-[#333] border-b border-[#555] px-3 py-1.5 outline-none text-white focus:border-[#3b82f6]"
                    value={formData.valor_sem_desconto || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, valor_sem_desconto: Number(e.target.value) })
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1 text-gray-400">Valor Atual</label>
                  <input
                    type="number"
                    className="w-full bg-[#333] border-b border-[#555] px-3 py-1.5 outline-none text-white focus:border-[#3b82f6]"
                    value={formData.valor_atual || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, valor_atual: Number(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-xs mb-1 text-gray-400">Valor</label>
                <input
                  type="number"
                  className="w-1/3 bg-[#333] border-b border-[#555] px-3 py-1.5 outline-none text-white focus:border-[#3b82f6]"
                  value={formData.valor_final || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, valor_final: Number(e.target.value) })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-12 mb-8">
                <div>
                  <label className="block text-xs mb-1 text-gray-400">Prazo de Entrega</label>
                  <textarea
                    className="w-full bg-[#333] border-b border-[#555] px-3 py-2 outline-none text-white resize-none h-32 text-xs focus:border-[#3b82f6]"
                    value={formData.prazo_entrega || ''}
                    onChange={(e) => setFormData({ ...formData, prazo_entrega: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1 text-gray-400">Condições de Pagamento</label>
                  <textarea
                    className="w-full bg-[#333] border-b border-[#555] px-3 py-2 outline-none text-white resize-none h-32 text-xs focus:border-[#3b82f6]"
                    value={formData.condicoes_pagamento || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, condicoes_pagamento: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-12 mb-8">
                <div>
                  <label className="block text-xs mb-1 text-red-500">Gerente</label>
                  <select
                    className="w-full bg-[#333] border-b border-red-500 px-3 py-1.5 outline-none text-white focus:border-[#3b82f6] appearance-none"
                    value={formData.gerente || ''}
                    onChange={(e) => setFormData({ ...formData, gerente: e.target.value })}
                  >
                    <option value="">Selecione...</option>
                    {gerentes.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.nome}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs mb-1 text-red-500">Nota</label>
                  <select
                    className="w-full bg-[#333] border-b border-red-500 px-3 py-1.5 outline-none text-white focus:border-[#3b82f6] appearance-none"
                    value={formData.nota_rep || ''}
                    onChange={(e) => setFormData({ ...formData, nota_rep: Number(e.target.value) })}
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <Button className="bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-none px-6 py-2 h-9 text-xs font-semibold tracking-wider">
                  PESQUISAR
                </Button>
                <Button className="bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-none px-6 py-2 h-9 text-xs font-semibold tracking-wider">
                  VISUALIZAR PROPOSTA
                </Button>
                <Button
                  onClick={handleSave}
                  className="bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-none px-6 py-2 h-9 text-xs font-semibold tracking-wider"
                >
                  GERAR PROPOSTA
                </Button>
                <Button className="bg-[#3b82f6] hover:bg-[#2563eb] text-white rounded-none px-6 py-2 h-9 text-xs font-semibold tracking-wider">
                  VENDA
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
