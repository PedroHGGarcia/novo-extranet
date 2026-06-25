import { useState, useEffect } from 'react'
import { Edit, Copy, List } from 'lucide-react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { RegistrationActionBar } from '@/components/RegistrationActionBar'
import { PaginationBar } from '@/components/PaginationBar'
import { SortableHead } from '@/components/SortableHead'
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal'

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

  const [activeTab, setActiveTab] = useState('registros')
  const [data, setData] = useState<TipoProposta[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(40)
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
  const [itemToDelete, setItemToDelete] = useState<TipoProposta | null>(null)

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
    if (!confirm('Deseja realmente excluir os itens selecionados?')) return

    try {
      for (const id of selectedIds) {
        await deleteTipoProposta(id)
      }
      toast({ title: 'Itens excluídos com sucesso' })
      loadData()
    } catch (e) {
      toast({ title: 'Erro ao excluir itens', variant: 'destructive' })
    }
  }

  const handleDeleteOne = async () => {
    if (!itemToDelete) return
    try {
      await deleteTipoProposta(itemToDelete.id)
      toast({ title: 'Item excluído com sucesso' })
      setIsDeleteModalOpen(false)
      setItemToDelete(null)
      loadData()
    } catch (e) {
      toast({ title: 'Erro ao excluir item', variant: 'destructive' })
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
      nome: `${item.nome} (Cópia)`,
    })
    setActiveTab('cadastro')
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
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

  return (
    <div className="flex flex-col h-full flex-1">
      <div className="flex items-center gap-2 p-4 md:p-6 pb-4 border-b bg-white">
        <List className="h-6 w-6 text-muted-foreground" />
        <h2 className="text-2xl font-bold tracking-tight">Tipos de Propostas</h2>
      </div>

      <div className="flex-1 p-4 md:p-6 overflow-auto bg-slate-50/50">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full bg-white rounded-md border shadow-sm flex flex-col min-h-[500px]"
        >
          <div className="border-b px-4">
            <TabsList className="bg-transparent h-12 p-0 w-full justify-start">
              <TabsTrigger
                value="registros"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 h-12"
              >
                Registros
              </TabsTrigger>
              <TabsTrigger
                value="cadastro"
                className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 h-12"
              >
                Cadastro
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="registros" className="p-4 space-y-4 outline-none m-0">
            <RegistrationActionBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onNew={handleNew}
              onDelete={handleDeleteSelected}
              disableDelete={selectedIds.size === 0}
            />

            <div className="rounded-md border">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <Checkbox
                        checked={data.length > 0 && selectedIds.size === data.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <SortableHead
                      field="nome"
                      currentSort={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                    >
                      Nome
                    </SortableHead>
                    <SortableHead
                      field="tem_fator"
                      currentSort={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                    >
                      Fator
                    </SortableHead>
                    <SortableHead
                      field="created"
                      currentSort={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                    >
                      DtCad
                    </SortableHead>
                    <SortableHead
                      field="status"
                      currentSort={sortField}
                      sortDir={sortDir}
                      onSort={handleSort}
                    >
                      Status
                    </SortableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhum registro encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.map((item) => (
                      <TableRow key={item.id} className="hover:bg-slate-50/50">
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(item.id)}
                            onCheckedChange={(c) => handleSelectOne(item.id, c as boolean)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium text-slate-700">{item.nome}</div>
                          <div className="flex gap-4 mt-1.5">
                            <button
                              onClick={() => handleEdit(item)}
                              className="text-[11px] text-blue-600 flex items-center hover:underline opacity-80 hover:opacity-100"
                            >
                              <Edit className="h-3 w-3 mr-1" /> Editar
                            </button>
                            <button
                              onClick={() => handleDuplicate(item)}
                              className="text-[11px] text-blue-600 flex items-center hover:underline opacity-80 hover:opacity-100"
                            >
                              <Copy className="h-3 w-3 mr-1" /> Duplicar
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {item.tem_fator ? 'Sim' : 'Não'}
                        </TableCell>
                        <TableCell className="text-sm text-slate-600">
                          {item.created
                            ? format(new Date(item.created), 'dd/MM/yyyy', { locale: ptBR })
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              item.status === 'Ativo'
                                ? 'bg-emerald-500 hover:bg-emerald-600 border-transparent text-white shadow-none text-xs rounded uppercase px-2 py-0'
                                : 'bg-slate-400 hover:bg-slate-500 border-transparent text-white shadow-none text-xs rounded uppercase px-2 py-0'
                            }
                          >
                            {item.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <PaginationBar
              totalItems={totalItems}
              page={page}
              perPage={perPage}
              onPageChange={setPage}
              onPerPageChange={setPerPage}
              perPageOptions={[10, 20, 40, 50, 100]}
            />
          </TabsContent>

          <TabsContent value="cadastro" className="p-0 outline-none m-0 flex-1 flex flex-col">
            <form onSubmit={handleSave} className="flex-1 flex flex-col">
              <div className="p-4 border-b bg-white flex gap-2 shrink-0">
                <Button
                  type="button"
                  variant="default"
                  className="bg-[#337ab7] hover:bg-[#286090] uppercase text-xs h-8 px-4 font-normal shadow-none rounded-sm"
                >
                  Pesquisar
                </Button>
                <Button
                  type="button"
                  onClick={handleNew}
                  className="bg-[#337ab7] hover:bg-[#286090] uppercase text-xs h-8 px-4 font-normal shadow-none rounded-sm"
                >
                  Novo
                </Button>
                <Button
                  type="submit"
                  className="bg-[#337ab7] hover:bg-[#286090] uppercase text-xs h-8 px-4 font-normal shadow-none rounded-sm"
                >
                  Salvar
                </Button>
              </div>

              <div className="flex flex-1 p-4 md:p-6 gap-6 bg-slate-50 items-start">
                <div className="flex-1 bg-white border border-slate-200 rounded-sm shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                    <List className="w-4 h-4 text-slate-500" />
                    <h3 className="font-semibold text-slate-700">Dados</h3>
                  </div>

                  <div className="space-y-5">
                    <div className="flex gap-4">
                      <div className="flex-1 space-y-1.5">
                        <Label className="text-xs text-slate-500">Nome</Label>
                        <Input
                          required
                          value={formData.nome || ''}
                          onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                          className="h-8 text-sm bg-transparent border-0 border-b border-slate-300 rounded-none focus-visible:ring-0 focus-visible:border-[#337ab7] px-0"
                          placeholder="FCS Nacionalizada: SEM % - <B>2026</B>"
                        />
                      </div>
                      <div className="w-[180px] space-y-1.5">
                        <Label className="text-xs text-slate-500">Status</Label>
                        <Select
                          value={formData.status || 'Ativo'}
                          onValueChange={(val: 'Ativo' | 'Inativo') =>
                            setFormData({ ...formData, status: val })
                          }
                        >
                          <SelectTrigger className="h-8 text-sm border-0 border-b border-slate-300 rounded-none focus:ring-0 px-0 bg-transparent">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Ativo">Ativo</SelectItem>
                            <SelectItem value="Inativo">Inativo</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-1 space-y-1.5">
                        <Label className="text-xs text-slate-500">
                          Aplicar Fator de Nacionalização
                        </Label>
                        <Select
                          value={formData.tem_fator ? 'Sim' : 'Não'}
                          onValueChange={(val) =>
                            setFormData({ ...formData, tem_fator: val === 'Sim' })
                          }
                        >
                          <SelectTrigger className="h-8 text-sm border-0 border-b border-slate-300 rounded-none focus:ring-0 px-0 bg-transparent">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Sim">Sim</SelectItem>
                            <SelectItem value="Não">Não</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <Label className="text-xs text-slate-500">Comissão (%)</Label>
                        <Input
                          type="number"
                          value={formData.comissao || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, comissao: parseFloat(e.target.value) || 0 })
                          }
                          className="h-8 text-sm border-0 border-b border-slate-300 rounded-none focus-visible:ring-0 focus-visible:border-[#337ab7] px-0 bg-transparent"
                          placeholder="Comissão (%)"
                        />
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-1 space-y-1.5">
                        <Label className="text-xs text-slate-500">Frase do Preço</Label>
                        <Input
                          value={formData.frase_preco || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, frase_preco: e.target.value })
                          }
                          className="h-8 text-sm border-0 border-b border-slate-300 rounded-none focus-visible:ring-0 focus-visible:border-[#337ab7] px-0 bg-transparent"
                          placeholder="Pacote de Máquinas FOB CHINA"
                        />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <Label className="text-xs text-slate-500">Frase Comissão</Label>
                        <Input
                          value={formData.frase_comissao || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, frase_comissao: e.target.value })
                          }
                          className="h-8 text-sm border-0 border-b border-slate-300 rounded-none focus-visible:ring-0 focus-visible:border-[#337ab7] px-0 bg-transparent"
                          placeholder="Frase Comissão"
                        />
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-1 space-y-1.5">
                        <Label className="text-xs text-slate-500">Prazo de Entrega</Label>
                        <textarea
                          value={formData.prazo_entrega || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, prazo_entrega: e.target.value })
                          }
                          className="w-full min-h-[60px] text-sm p-2 border border-slate-200 rounded-sm focus:outline-none focus:border-[#337ab7] resize-y"
                          placeholder="A combinar."
                        />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <Label className="text-xs text-slate-500">Condições de Pagamento</Label>
                        <textarea
                          value={formData.condicoes_pagamento || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, condicoes_pagamento: e.target.value })
                          }
                          className="w-full min-h-[60px] text-sm p-2 border border-slate-200 rounded-sm focus:outline-none focus:border-[#337ab7] resize-y"
                          placeholder="<B>Pedido 1:</B> USD Sendo: Entrada (%) USD..."
                        />
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-1 space-y-1.5">
                        <Label className="text-xs text-slate-500">Garantia</Label>
                        <textarea
                          value={formData.garantia || ''}
                          onChange={(e) => setFormData({ ...formData, garantia: e.target.value })}
                          className="w-full min-h-[120px] text-sm p-2 border border-slate-200 rounded-sm focus:outline-none focus:border-[#337ab7] resize-y"
                        />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <Label className="text-xs text-slate-500">Assistência Técnica</Label>
                        <textarea
                          value={formData.assistencia_tecnica || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, assistencia_tecnica: e.target.value })
                          }
                          className="w-full min-h-[120px] text-sm p-2 border border-slate-200 rounded-sm focus:outline-none focus:border-[#337ab7] resize-y"
                        />
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-1 space-y-1.5">
                        <Label className="text-xs text-slate-500">Treinamento Técnico</Label>
                        <textarea
                          value={formData.treinamento_tecnico || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, treinamento_tecnico: e.target.value })
                          }
                          className="w-full min-h-[100px] text-sm p-2 border border-slate-200 rounded-sm focus:outline-none focus:border-[#337ab7] resize-y"
                        />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <Label className="text-xs text-slate-500">Transporte/Seguro</Label>
                        <textarea
                          value={formData.transporte_seguro || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, transporte_seguro: e.target.value })
                          }
                          className="w-full min-h-[100px] text-sm p-2 border border-slate-200 rounded-sm focus:outline-none focus:border-[#337ab7] resize-y"
                        />
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-1 space-y-1.5">
                        <Label className="text-xs text-slate-500">Validade desta Oferta</Label>
                        <textarea
                          value={formData.validade_oferta || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, validade_oferta: e.target.value })
                          }
                          className="w-full min-h-[80px] text-sm p-2 border border-slate-200 rounded-sm focus:outline-none focus:border-[#337ab7] resize-y"
                        />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <Label className="text-xs text-slate-500">Imposto IPI</Label>
                        <textarea
                          value={formData.imposto_ipi || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, imposto_ipi: e.target.value })
                          }
                          className="w-full min-h-[80px] text-sm p-2 border border-slate-200 rounded-sm focus:outline-none focus:border-[#337ab7] resize-y"
                        />
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-1 space-y-1.5">
                        <Label className="text-xs text-slate-500">Imposto ICMS</Label>
                        <textarea
                          value={formData.imposto_icms || ''}
                          onChange={(e) =>
                            setFormData({ ...formData, imposto_icms: e.target.value })
                          }
                          className="w-full min-h-[80px] text-sm p-2 border border-slate-200 rounded-sm focus:outline-none focus:border-[#337ab7] resize-y"
                        />
                      </div>
                      <div className="flex-1 space-y-1.5">
                        <Label className="text-xs text-slate-500">Dt. Cad</Label>
                        <Input
                          readOnly
                          value={
                            selectedItem?.created
                              ? format(new Date(selectedItem.created), 'dd/MM/yyyy HH:mm:ss')
                              : ''
                          }
                          className="h-8 text-sm bg-slate-100 border-0 border-b border-slate-300 rounded-none px-2 text-slate-500 w-[200px]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-[300px] shrink-0 bg-white border border-slate-200 rounded-sm shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                    <List className="w-4 h-4 text-slate-500" />
                    <h3 className="font-semibold text-slate-700 leading-tight">
                      Formas de Pagamento
                      <br />
                      do Pedido
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {[
                      'Faturamento a vista',
                      'Financiamento C.D.C.I. 1 a 9 parcelas',
                      'Financiamento C.D.C.I. 10 a 17 parcelas',
                    ].map((label) => {
                      const isChecked = formData.formas_pagamento_selecionadas?.includes(label)
                      return (
                        <div key={label} className="flex items-start space-x-2">
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
                            className="mt-0.5 border-slate-400 data-[state=checked]:bg-[#337ab7] data-[state=checked]:border-[#337ab7]"
                          />
                          <Label
                            htmlFor={`pgto-${label}`}
                            className="text-sm font-normal cursor-pointer leading-snug"
                          >
                            {label}
                          </Label>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              <div className="p-4 border-t bg-white flex gap-2 shrink-0">
                <Button
                  type="button"
                  variant="default"
                  className="bg-[#337ab7] hover:bg-[#286090] uppercase text-xs h-8 px-4 font-normal shadow-none rounded-sm"
                >
                  Pesquisar
                </Button>
                <Button
                  type="button"
                  onClick={handleNew}
                  className="bg-[#337ab7] hover:bg-[#286090] uppercase text-xs h-8 px-4 font-normal shadow-none rounded-sm"
                >
                  Novo
                </Button>
                <Button
                  type="submit"
                  className="bg-[#337ab7] hover:bg-[#286090] uppercase text-xs h-8 px-4 font-normal shadow-none rounded-sm"
                >
                  Salvar
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </div>

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteOne}
        title="Excluir Tipo de Proposta"
        description={`Tem certeza que deseja excluir o tipo de proposta "${itemToDelete?.nome}"? Esta ação não poderá ser desfeita.`}
      />
    </div>
  )
}
