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
      nome: item.nome,
      tem_fator: item.tem_fator,
      status: item.status,
    })
    setActiveTab('cadastro')
  }

  const handleDuplicate = (item: TipoProposta) => {
    setSelectedItem(null)
    setFormData({
      nome: `${item.nome} (Cópia)`,
      tem_fator: item.tem_fator,
      status: item.status,
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

      <div className="flex-1 p-4 md:p-6 overflow-auto">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full bg-white rounded-md border shadow-sm"
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

          <TabsContent value="cadastro" className="p-6 outline-none m-0">
            <form onSubmit={handleSave} className="space-y-8 max-w-3xl">
              <div className="grid gap-6 bg-slate-50 p-6 rounded-md border">
                <div className="grid gap-2">
                  <Label htmlFor="nome" className="font-semibold text-slate-700">
                    Nome da Proposta *
                  </Label>
                  <Input
                    id="nome"
                    value={formData.nome || ''}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Nacionalizada"
                    required
                    className="bg-white"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label className="font-semibold text-slate-700">Configurações Adicionais</Label>
                  <div className="flex items-center space-x-3 bg-white p-3 rounded-md border">
                    <Switch
                      id="tem_fator"
                      checked={formData.tem_fator || false}
                      onCheckedChange={(c) => setFormData({ ...formData, tem_fator: c })}
                    />
                    <Label htmlFor="tem_fator" className="cursor-pointer text-slate-600">
                      Aplicar fator de cálculo (Tem Fator)
                    </Label>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label className="font-semibold text-slate-700">Status</Label>
                  <Select
                    value={formData.status || 'Ativo'}
                    onValueChange={(val: 'Ativo' | 'Inativo') =>
                      setFormData({ ...formData, status: val })
                    }
                  >
                    <SelectTrigger className="w-full md:w-[240px] bg-white">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  className="px-8 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                >
                  Salvar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab('registros')}
                  className="px-8 text-slate-600"
                >
                  Cancelar
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
