import { useState, useEffect, useMemo } from 'react'
import { List, Pencil, Copy } from 'lucide-react'
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
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { RegistrationActionBar } from '@/components/RegistrationActionBar'
import { PaginationBar } from '@/components/PaginationBar'
import { SortableHead } from '@/components/SortableHead'
import { toast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { getMarcas, createMarca, updateMarca, deleteMarca, Marca } from '@/services/produtos'

export default function Marcas() {
  const [items, setItems] = useState<Marca[]>([])
  const [activeTab, setActiveTab] = useState('registros')
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const [editingItem, setEditingItem] = useState<Marca | null>(null)
  const [nome, setNome] = useState('')
  const [status, setStatus] = useState<'Ativo' | 'Inativo'>('Ativo')

  const loadData = async () => {
    try {
      const data = await getMarcas()
      setItems(data)
    } catch (error) {
      toast({ title: 'Erro ao carregar marcas', variant: 'destructive' })
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('marcas', () => loadData())

  const filteredItems = useMemo(() => {
    let result = items
    if (searchQuery) {
      result = result.filter((i) => i.nome.toLowerCase().includes(searchQuery.toLowerCase()))
    }
    return result
  }, [items, searchQuery])

  const handleEdit = (item: Marca) => {
    setEditingItem(item)
    setNome(item.nome)
    setStatus(item.status)
    setActiveTab('cadastro')
  }

  const handleDuplicate = async (item: Marca) => {
    try {
      await createMarca({ nome: item.nome + ' (Cópia)', status: item.status })
      toast({ title: 'Marca duplicada com sucesso' })
    } catch (error) {
      toast({ title: 'Erro ao duplicar marca', variant: 'destructive' })
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`Deseja realmente excluir ${selectedIds.size} marca(s)?`)) return
    try {
      for (const id of Array.from(selectedIds)) {
        await deleteMarca(id)
      }
      setSelectedIds(new Set())
      toast({ title: 'Marcas excluídas com sucesso' })
    } catch (error) {
      toast({ title: 'Erro ao excluir marcas', variant: 'destructive' })
    }
  }

  const handleToggleSelectAll = () => {
    if (selectedIds.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredItems.map((i) => i.id)))
    }
  }

  const handleToggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) return
    try {
      if (editingItem) {
        await updateMarca(editingItem.id, { nome: nome.trim(), status })
        toast({ title: 'Marca atualizada com sucesso' })
      } else {
        await createMarca({ nome: nome.trim(), status })
        toast({ title: 'Marca criada com sucesso' })
      }
      setEditingItem(null)
      setNome('')
      setStatus('Ativo')
      setActiveTab('registros')
    } catch (error) {
      toast({ title: 'Erro ao salvar marca', variant: 'destructive' })
    }
  }

  const resetForm = () => {
    setEditingItem(null)
    setNome('')
    setStatus('Ativo')
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-2 mb-6 text-slate-800">
        <List className="w-6 h-6" />
        <h1 className="text-2xl font-semibold">Marcas</h1>
      </div>

      <RegistrationActionBar
        showSearch={showSearch}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchToggle={() => setShowSearch(!showSearch)}
        onNewClick={() => {
          resetForm()
          setActiveTab('cadastro')
        }}
        onDeleteClick={handleDeleteSelected}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-transparent border-b border-[#337ab7] rounded-none w-full justify-start h-auto p-0 gap-1">
          <TabsTrigger
            value="registros"
            className="rounded-t-sm rounded-b-none border border-b-0 border-transparent data-[state=active]:border-[#337ab7] data-[state=active]:bg-white data-[state=active]:text-[#337ab7] px-6 py-2 -mb-[1px] text-slate-500 font-normal hover:text-slate-700"
          >
            Registros
          </TabsTrigger>
          <TabsTrigger
            value="cadastro"
            className="rounded-t-sm rounded-b-none border border-b-0 border-transparent data-[state=active]:border-[#337ab7] data-[state=active]:bg-white data-[state=active]:text-[#337ab7] px-6 py-2 -mb-[1px] text-slate-500 font-normal hover:text-slate-700"
          >
            Cadastro
          </TabsTrigger>
        </TabsList>

        <TabsContent value="registros" className="mt-0 border border-[#337ab7] bg-white">
          <PaginationBar total={filteredItems.length} />

          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-slate-200">
                <TableHead className="w-[50px] text-center px-4">
                  <input
                    type="checkbox"
                    className="rounded-sm border-slate-300 w-3.5 h-3.5 accent-[#337ab7]"
                    checked={selectedIds.size === filteredItems.length && filteredItems.length > 0}
                    onChange={handleToggleSelectAll}
                  />
                </TableHead>
                <SortableHead
                  label="Nome"
                  sortKey="nome"
                  currentSort=""
                  onSort={() => {}}
                  className="font-semibold text-[#337ab7]"
                />
                <SortableHead
                  label="Status"
                  sortKey="status"
                  currentSort=""
                  onSort={() => {}}
                  className="font-semibold text-[#337ab7]"
                />
                <SortableHead
                  label="Dt Cad."
                  sortKey="created"
                  currentSort=""
                  onSort={() => {}}
                  className="font-semibold text-[#337ab7]"
                />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item.id} className="hover:bg-slate-50 border-b border-slate-100">
                  <TableCell className="text-center py-3 px-4">
                    <input
                      type="checkbox"
                      className="rounded-sm border-slate-300 w-3.5 h-3.5 accent-[#337ab7]"
                      checked={selectedIds.has(item.id)}
                      onChange={() => handleToggleSelect(item.id)}
                    />
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="text-sm text-slate-700 uppercase">{item.nome}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-[#337ab7] text-xs hover:underline inline-flex items-center gap-1 italic"
                      >
                        <Pencil className="w-3 h-3" /> Editar
                      </button>
                      <button
                        onClick={() => handleDuplicate(item)}
                        className="text-[#337ab7] text-xs hover:underline inline-flex items-center gap-1 italic"
                      >
                        <Copy className="w-3 h-3" /> Duplicar
                      </button>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    <Badge
                      className={
                        item.status === 'Ativo'
                          ? 'bg-[#5cb85c] hover:bg-[#4cae4c] font-normal text-white px-2 py-0'
                          : 'bg-[#d9534f] hover:bg-[#c9302c] font-normal text-white px-2 py-0'
                      }
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-slate-600 py-3">
                    {new Date(item.created).toLocaleDateString('pt-BR')}
                  </TableCell>
                </TableRow>
              ))}
              {filteredItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-500">
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <PaginationBar total={filteredItems.length} />
        </TabsContent>

        <TabsContent value="cadastro" className="mt-0 border border-[#337ab7] bg-white p-6">
          <form onSubmit={handleSave} className="max-w-xl space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="nome">
                Nome da Marca <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="h-9 border-slate-300"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={(v: 'Ativo' | 'Inativo') => setStatus(v)}>
                <SelectTrigger className="h-9 border-slate-300">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="bg-[#337ab7] hover:bg-[#286090] text-white h-9 px-6 rounded-sm font-normal"
              >
                Salvar
              </Button>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  )
}
