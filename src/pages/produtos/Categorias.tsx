import { useState, useEffect, useRef } from 'react'
import { Layers, Pencil, Copy, Download, Trash2, Image as ImageIcon } from 'lucide-react'
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
import {
  getCategorias,
  createCategoria,
  updateCategoria,
  deleteCategoria,
  getCategoriaLogoUrl,
  CategoriaProduto,
} from '@/services/produtos'

export default function Categorias() {
  const [items, setItems] = useState<CategoriaProduto[]>([])
  const [filtered, setFiltered] = useState<CategoriaProduto[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState('registros')
  const [editingItem, setEditingItem] = useState<CategoriaProduto | null>(null)

  const [nome, setNome] = useState('')
  const [status, setStatus] = useState<'Ativo' | 'Inativo'>('Ativo')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadData = async () => {
    try {
      const data = await getCategorias()
      setItems(data)
    } catch (error) {
      toast({ title: 'Erro ao carregar categorias', variant: 'destructive' })
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('categorias_produtos', () => {
    loadData()
  })

  useEffect(() => {
    if (searchTerm) {
      setFiltered(items.filter((i) => i.nome.toLowerCase().includes(searchTerm.toLowerCase())))
    } else {
      setFiltered(items)
    }
  }, [items, searchTerm])

  const handleEdit = (item: CategoriaProduto) => {
    setEditingItem(item)
    setNome(item.nome)
    setStatus(item.status)
    setLogoFile(null)
    setActiveTab('cadastro')
  }

  const handleDuplicate = async (item: CategoriaProduto) => {
    try {
      const formData = new FormData()
      formData.append('nome', item.nome + ' (Cópia)')
      formData.append('status', item.status)
      await createCategoria(formData)
      toast({ title: 'Categoria duplicada com sucesso' })
    } catch (error) {
      toast({ title: 'Erro ao duplicar categoria', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta categoria?')) return
    try {
      await deleteCategoria(id)
      toast({ title: 'Categoria excluída com sucesso' })
    } catch (error) {
      toast({ title: 'Erro ao excluir categoria', variant: 'destructive' })
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const formData = new FormData()
      formData.append('nome', nome)
      formData.append('status', status)
      if (logoFile) {
        formData.append('logo', logoFile)
      }

      if (editingItem) {
        await updateCategoria(editingItem.id, formData)
        toast({ title: 'Categoria atualizada com sucesso' })
      } else {
        await createCategoria(formData)
        toast({ title: 'Categoria criada com sucesso' })
      }
      resetForm()
      setActiveTab('registros')
    } catch (error) {
      toast({ title: 'Erro ao salvar categoria', variant: 'destructive' })
    }
  }

  const resetForm = () => {
    setEditingItem(null)
    setNome('')
    setStatus('Ativo')
    setLogoFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
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
    link.download = 'categorias.csv'
    link.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6 text-gray-800">
        <Layers className="h-6 w-6" />
        <h1 className="text-2xl font-normal">Categorias</h1>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-4">
        <Button
          onClick={() => setActiveTab('registros')}
          className="bg-[#2A75D3] hover:bg-[#2A75D3]/90 rounded-sm"
        >
          PESQUISAR
        </Button>
        <Button
          onClick={() => {
            resetForm()
            setActiveTab('cadastro')
          }}
          className="bg-[#2A75D3] hover:bg-[#2A75D3]/90 rounded-sm"
        >
          NOVO
        </Button>
        <Button
          variant="outline"
          className="bg-[#2A75D3] text-white hover:bg-[#2A75D3]/90 hover:text-white rounded-sm border-0"
        >
          EXCLUIR
        </Button>
        <Button
          onClick={exportCsv}
          variant="outline"
          className="ml-auto rounded-sm border-brand-green text-brand-green hover:bg-brand-green hover:text-white"
        >
          <Download className="w-4 h-4 mr-2" /> Exportar CSV
        </Button>
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
                  <TableHead className="font-medium text-brand-cyan">Nome</TableHead>
                  <TableHead className="font-medium text-brand-cyan">Logo</TableHead>
                  <TableHead className="font-medium text-brand-cyan">Dt Cad.</TableHead>
                  <TableHead className="font-medium text-brand-cyan">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.id} className="hover:bg-gray-50/50">
                    <TableCell>
                      <input type="checkbox" className="rounded border-gray-300" />
                    </TableCell>
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
                    <TableCell>
                      {item.logo ? (
                        <img
                          src={getCategoriaLogoUrl(item) || ''}
                          alt="Logo"
                          className="h-10 object-contain"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 flex items-center justify-center rounded text-gray-400">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {new Date(item.created).toLocaleDateString('pt-BR')}
                    </TableCell>
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
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
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
                  Nome da Categoria <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  required
                  className="rounded-sm"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="logo">Logo</Label>
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                  className="rounded-sm"
                />
                {editingItem?.logo && !logoFile && (
                  <div className="text-sm text-gray-500 mt-1">
                    Logo atual já carregada. Selecione outra para substituir.
                  </div>
                )}
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
              <Button type="submit" className="bg-[#2A75D3] hover:bg-[#2A75D3]/90 rounded-sm">
                Salvar Categoria
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
