import { useState, useEffect } from 'react'
import { Tag, Pencil, Copy, Download, Trash2, Loader2 } from 'lucide-react'
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'
import { useTablePreferences } from '@/hooks/use-table-preferences'
import { ColumnVisibilityDropdown } from '@/components/ColumnVisibilityDropdown'
import { LayoutDashboard } from 'lucide-react'
import {
  getMarcas,
  createMarca,
  updateMarca,
  deleteMarca,
  checkUniqueName,
  Marca,
} from '@/services/produtos'

export default function Marcas() {
  const [items, setItems] = useState<Marca[]>([])
  const [filtered, setFiltered] = useState<Marca[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('registros')
  const [editingItem, setEditingItem] = useState<Marca | null>(null)

  const [nome, setNome] = useState('')
  const [status, setStatus] = useState<'Ativo' | 'Inativo'>('Ativo')

  const [nomeTouched, setNomeTouched] = useState(false)
  const [nomeError, setNomeError] = useState('')
  const [isCheckingNome, setIsCheckingNome] = useState(false)

  const colunasOptions = [
    { id: 'nome', label: 'Nome' },
    { id: 'status', label: 'Status' },
    { id: 'dt_cad', label: 'Dt Cad.' },
  ]
  const { visibleColumns, toggleColumn } = useTablePreferences(
    'marcas',
    colunasOptions.map((c) => c.id),
  )

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
  useRealtime('marcas', () => {
    loadData()
  })

  useEffect(() => {
    if (searchTerm) {
      setFiltered(items.filter((i) => i.nome.toLowerCase().includes(searchTerm.toLowerCase())))
    } else {
      setFiltered(items)
    }
  }, [items, searchTerm])

  useEffect(() => {
    if (!nomeTouched) return
    if (!nome.trim()) {
      setNomeError('O nome é obrigatório')
      return
    }
    const timer = setTimeout(async () => {
      setIsCheckingNome(true)
      const isUnique = await checkUniqueName('marcas', nome.trim(), editingItem?.id)
      if (!isUnique) {
        setNomeError('Este nome já está em uso')
      } else {
        setNomeError('')
      }
      setIsCheckingNome(false)
    }, 400)
    return () => clearTimeout(timer)
  }, [nome, nomeTouched, editingItem?.id])

  const handleEdit = (item: Marca) => {
    setEditingItem(item)
    setNome(item.nome)
    setStatus(item.status)
    setNomeTouched(false)
    setNomeError('')
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

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta marca?')) return
    try {
      await deleteMarca(id)
      toast({ title: 'Marca excluída com sucesso' })
    } catch (error) {
      toast({ title: 'Erro ao excluir marca', variant: 'destructive' })
    }
  }

  const isFormValid = nome.trim() && !nomeError && !isCheckingNome

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) return
    try {
      if (editingItem) {
        await updateMarca(editingItem.id, { nome: nome.trim(), status })
        toast({ title: 'Marca atualizada com sucesso' })
      } else {
        await createMarca({ nome: nome.trim(), status })
        toast({ title: 'Marca criada com sucesso' })
      }
      resetForm()
      setActiveTab('registros')
    } catch (error) {
      toast({ title: 'Erro ao salvar marca', variant: 'destructive' })
    }
  }

  const resetForm = () => {
    setEditingItem(null)
    setNome('')
    setStatus('Ativo')
    setNomeTouched(false)
    setNomeError('')
  }

  const exportCsv = () => {
    const headers = ['Nome', 'Status', 'Data de Cadastro']
    const csvContent = [
      headers.join(','),
      ...filtered.map(
        (i) => `"${i.nome}","${i.status}","${new Date(i.created).toLocaleDateString('pt-BR')}"`,
      ),
    ].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'marcas.csv'
    link.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6 text-gray-800">
        <Tag className="h-6 w-6" />
        <h1 className="text-2xl font-normal">Marcas</h1>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <ColumnVisibilityDropdown
          columns={colunasOptions}
          visibleColumns={visibleColumns}
          onToggle={toggleColumn}
        />
        <div className="ml-auto flex items-center gap-2">
          <Button
            onClick={exportCsv}
            variant="outline"
            className="rounded-sm border-brand-green text-brand-green hover:bg-brand-green hover:text-white"
          >
            <Download className="w-4 h-4 mr-2" /> Exportar CSV
          </Button>
          <Link to="/produtos/dashboard">
            <Button
              variant="outline"
              className="rounded-sm border-brand-green text-brand-green hover:bg-brand-green hover:text-white"
            >
              <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
            </Button>
          </Link>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-transparent border-b rounded-none w-full justify-start h-auto p-0">
          <TabsTrigger
            value="registros"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#2A75D3] data-[state=active]:text-[#2A75D3] px-6 py-2"
          >
            Registros
          </TabsTrigger>
          <TabsTrigger
            value="cadastro"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#2A75D3] data-[state=active]:text-[#2A75D3] px-6 py-2"
          >
            Cadastro
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="registros"
          className="mt-4 border bg-white rounded-md shadow-sm overflow-hidden"
        >
          <div className="p-4 border-b">
            <Input
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm rounded-sm"
            />
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="w-[50px]">
                    <input type="checkbox" className="rounded border-gray-300" />
                  </TableHead>
                  {visibleColumns.includes('nome') && (
                    <TableHead className="font-medium text-brand-cyan">Nome</TableHead>
                  )}
                  {visibleColumns.includes('status') && (
                    <TableHead className="font-medium text-brand-cyan">Status</TableHead>
                  )}
                  {visibleColumns.includes('dt_cad') && (
                    <TableHead className="font-medium text-brand-cyan">Dt Cad.</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.id} className="hover:bg-gray-50/50">
                    <TableCell>
                      <input type="checkbox" className="rounded border-gray-300" />
                    </TableCell>
                    {visibleColumns.includes('nome') && (
                      <TableCell>
                        <div className="font-medium text-gray-700">{item.nome}</div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-brand-green">
                          <button
                            onClick={() => handleEdit(item)}
                            className="hover:underline flex items-center gap-1"
                          >
                            <Pencil className="w-3 h-3" /> Editar
                          </button>
                          <button
                            onClick={() => handleDuplicate(item)}
                            className="hover:underline flex items-center gap-1"
                          >
                            <Copy className="w-3 h-3" /> Duplicar
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-500 hover:underline flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> Excluir
                          </button>
                        </div>
                      </TableCell>
                    )}
                    {visibleColumns.includes('status') && (
                      <TableCell>
                        <Badge
                          className={
                            item.status === 'Ativo'
                              ? 'bg-green-500 hover:bg-green-600'
                              : 'bg-gray-400 hover:bg-gray-500'
                          }
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                    )}
                    {visibleColumns.includes('dt_cad') && (
                      <TableCell className="text-gray-600">
                        {new Date(item.created).toLocaleDateString('pt-BR')}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                      Nenhum registro encontrado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="cadastro" className="mt-4 border bg-white rounded-md shadow-sm p-6">
          <form onSubmit={handleSave} className="space-y-6 max-w-2xl">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="nome">
                  Nome da Marca <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="nome"
                    value={nome}
                    onChange={(e) => {
                      setNome(e.target.value)
                      setNomeTouched(true)
                    }}
                    className={cn('rounded-sm pr-10', nomeError && 'border-red-500')}
                  />
                  {isCheckingNome && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    </div>
                  )}
                </div>
                {nomeError && <p className="text-xs text-red-500">{nomeError}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">
                  Status <span className="text-red-500">*</span>
                </Label>
                <Select value={status} onValueChange={(v: 'Ativo' | 'Inativo') => setStatus(v)}>
                  <SelectTrigger className="rounded-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                className="bg-[#2A75D3] hover:bg-[#2A75D3]/90 rounded-sm"
                disabled={!isFormValid}
              >
                {isCheckingNome && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar Marca
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab('registros')}
                className="rounded-sm"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </TabsContent>
      </Tabs>
    </div>
  )
}
