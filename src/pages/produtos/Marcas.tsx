import { useState, useEffect, useMemo } from 'react'
import { Tag, Pencil, Copy } from 'lucide-react'
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
    <div className="p-4 md:p-6">
      <div className="flex items-center gap-3 mb-6 text-slate-900 dark:text-slate-50">
        <Tag className="w-6 h-6 text-brand-green" strokeWidth={1.75} />
        <h1 className="text-page-title">Marcas</h1>
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
        <TabsList className="bg-transparent border-b border-border dark:border-primary rounded-none w-full justify-start h-auto p-0 gap-1">
          <TabsTrigger
            value="registros"
            className="rounded-t-md rounded-b-none border border-b-0 border-transparent data-[state=active]:border-primary data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:text-primary px-6 py-2 -mb-[1px] text-slate-500 dark:text-slate-400 text-sm font-normal hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            Registros
          </TabsTrigger>
          <TabsTrigger
            value="cadastro"
            className="rounded-t-md rounded-b-none border border-b-0 border-transparent data-[state=active]:border-primary data-[state=active]:bg-white dark:data-[state=active]:bg-card data-[state=active]:text-primary px-6 py-2 -mb-[1px] text-slate-500 dark:text-slate-400 text-sm font-normal hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            Cadastro
          </TabsTrigger>{' '}
        </TabsList>

        <TabsContent
          value="registros"
          className="mt-0 border border-border bg-white dark:bg-card rounded-b-md"
        >
          <PaginationBar total={filteredItems.length} />

          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border">
                <TableHead className="w-[50px] text-center px-4">
                  <input
                    type="checkbox"
                    className="rounded-sm border-slate-300 dark:border-border w-3.5 h-3.5 accent-primary"
                    checked={selectedIds.size === filteredItems.length && filteredItems.length > 0}
                    onChange={handleToggleSelectAll}
                  />
                </TableHead>
                <SortableHead label="Nome" sortKey="nome" currentSort="" onSort={() => {}} />
                <SortableHead label="Status" sortKey="status" currentSort="" onSort={() => {}} />
                <SortableHead label="Dt Cad." sortKey="created" currentSort="" onSort={() => {}} />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow
                  key={item.id}
                  className="hover:bg-slate-50 dark:hover:bg-muted/50 border-b border-border transition-colors"
                >
                  <TableCell className="text-center py-3 px-4">
                    <input
                      type="checkbox"
                      className="rounded-sm border-slate-300 dark:border-border w-3.5 h-3.5 accent-primary"
                      checked={selectedIds.has(item.id)}
                      onChange={() => handleToggleSelect(item.id)}
                    />
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="text-sm text-slate-700 dark:text-slate-200 uppercase font-medium">
                      {item.nome}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <button
                        onClick={() => handleEdit(item)}
                        className="text-primary text-xs hover:underline inline-flex items-center gap-1 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" strokeWidth={1.75} /> Editar
                      </button>
                      <button
                        onClick={() => handleDuplicate(item)}
                        className="text-primary text-xs hover:underline inline-flex items-center gap-1 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" strokeWidth={1.75} /> Duplicar
                      </button>
                    </div>
                  </TableCell>
                  <TableCell className="py-3">
                    {item.status === 'Ativo' ? (
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-700">
                        Ativo
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700">
                        {item.status}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-slate-600 dark:text-slate-400 py-3">
                    {new Date(item.created).toLocaleDateString('pt-BR')}
                  </TableCell>
                </TableRow>
              ))}
              {filteredItems.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-8 text-muted-foreground text-body"
                  >
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <PaginationBar total={filteredItems.length} />
        </TabsContent>

        <TabsContent
          value="cadastro"
          className="mt-0 border border-border bg-white dark:bg-card p-6 rounded-b-md"
        >
          <form onSubmit={handleSave} className="max-w-xl space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="nome" className="text-label">
                Nome da Marca <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="h-9 border-slate-300 dark:border-border bg-white dark:bg-input text-sm"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="status" className="text-label">
                Status
              </Label>
              <Select value={status} onValueChange={(v: 'Ativo' | 'Inativo') => setStatus(v)}>
                <SelectTrigger className="h-9 border-slate-300 dark:border-border bg-white dark:bg-input text-sm">
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
                className="h-9 px-6 rounded-md text-sm font-medium transition-colors duration-200"
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
