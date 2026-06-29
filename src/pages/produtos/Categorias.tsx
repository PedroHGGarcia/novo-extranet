import { useState, useEffect, useRef } from 'react'
import {
  Layers,
  Pencil,
  Copy,
  Download,
  Trash2,
  Image as ImageIcon,
  Loader2,
  UploadCloud,
} from 'lucide-react'
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
  getCategorias,
  createCategoria,
  updateCategoria,
  deleteCategoria,
  getCategoriaLogoUrl,
  checkUniqueName,
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

  const [nomeTouched, setNomeTouched] = useState(false)
  const [nomeError, setNomeError] = useState('')
  const [isCheckingNome, setIsCheckingNome] = useState(false)

  const [isDraggingLogo, setIsDraggingLogo] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const colunasOptions = [
    { id: 'nome', label: 'Nome' },
    { id: 'logo', label: 'Logo' },
    { id: 'dt_cad', label: 'Dt Cad.' },
    { id: 'status', label: 'Status' },
  ]
  const { visibleColumns, toggleColumn } = useTablePreferences(
    'categorias',
    colunasOptions.map((c) => c.id),
  )

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

  useEffect(() => {
    if (!nomeTouched) return
    if (!nome.trim()) {
      setNomeError('O nome é obrigatório')
      return
    }
    const timer = setTimeout(async () => {
      setIsCheckingNome(true)
      const isUnique = await checkUniqueName('categorias_produtos', nome.trim(), editingItem?.id)
      if (!isUnique) {
        setNomeError('Este nome já está em uso')
      } else {
        setNomeError('')
      }
      setIsCheckingNome(false)
    }, 400)
    return () => clearTimeout(timer)
  }, [nome, nomeTouched, editingItem?.id])

  const handleEdit = (item: CategoriaProduto) => {
    setEditingItem(item)
    setNome(item.nome)
    setStatus(item.status)
    setLogoFile(null)
    setNomeTouched(false)
    setNomeError('')
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

  const isFormValid = nome.trim() && !nomeError && !isCheckingNome

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) return
    try {
      const formData = new FormData()
      formData.append('nome', nome.trim())
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
    setNomeTouched(false)
    setNomeError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleDropLogo = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingLogo(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      if (file.size <= 5242880 && file.type.startsWith('image/')) {
        setLogoFile(file)
      } else {
        toast({
          title: 'Arquivo inválido',
          description: 'Permitido imagens até 5MB.',
          variant: 'destructive',
        })
      }
    }
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
                  {visibleColumns.includes('logo') && (
                    <TableHead className="font-medium text-brand-cyan">Logo</TableHead>
                  )}
                  {visibleColumns.includes('dt_cad') && (
                    <TableHead className="font-medium text-brand-cyan">Dt Cad.</TableHead>
                  )}
                  {visibleColumns.includes('status') && (
                    <TableHead className="font-medium text-brand-cyan">Status</TableHead>
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
                    {visibleColumns.includes('logo') && (
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
                    )}
                    {visibleColumns.includes('dt_cad') && (
                      <TableCell className="text-gray-600">
                        {new Date(item.created).toLocaleDateString('pt-BR')}
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
                <Label>Logo</Label>
                <div
                  className={cn(
                    'border-2 border-dashed rounded-md p-6 text-center transition-colors cursor-pointer',
                    isDraggingLogo
                      ? 'border-[#2A75D3] bg-blue-50'
                      : 'border-gray-300 hover:bg-gray-50',
                  )}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDraggingLogo(true)
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault()
                    setIsDraggingLogo(false)
                  }}
                  onDrop={handleDropLogo}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {logoFile ? (
                    <div className="flex flex-col items-center">
                      <img
                        src={URL.createObjectURL(logoFile)}
                        alt="Logo"
                        className="h-16 object-contain mb-2"
                      />
                      <p className="text-sm text-brand-green font-medium">{logoFile.name}</p>
                    </div>
                  ) : editingItem?.logo ? (
                    <div className="flex flex-col items-center">
                      <img
                        src={getCategoriaLogoUrl(editingItem)!}
                        alt="Logo"
                        className="h-16 object-contain mb-2"
                      />
                      <p className="text-sm text-gray-500">
                        Logo atual. Arraste ou clique para substituir.
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-gray-500">
                      <UploadCloud className="w-8 h-8 mb-2 text-gray-400" />
                      <p className="text-sm font-medium">
                        Arraste a logo ou clique para selecionar
                      </p>
                      <p className="text-xs mt-1">PNG, JPG, WEBP, SVG (Max 5MB)</p>
                    </div>
                  )}
                  <input
                    id="logo"
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={(e) => {
                      if (e.target.files) setLogoFile(e.target.files[0])
                    }}
                    className="hidden"
                  />
                </div>
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
