import { useState, useEffect, useRef } from 'react'
import {
  Package,
  Pencil,
  Copy,
  Download,
  Trash2,
  Filter,
  Loader2,
  UploadCloud,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { toast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { cn } from '@/lib/utils'
import { Link } from 'react-router-dom'
import { useTablePreferences } from '@/hooks/use-table-preferences'
import { ColumnVisibilityDropdown } from '@/components/ColumnVisibilityDropdown'
import { LayoutDashboard } from 'lucide-react'
import {
  getProdutos,
  createProduto,
  updateProduto,
  deleteProduto,
  getCategorias,
  checkUniqueName,
  getProdutoFotoUrl,
  Produto,
  CategoriaProduto,
} from '@/services/produtos'

export default function Produtos() {
  const [items, setItems] = useState<Produto[]>([])
  const [categorias, setCategorias] = useState<CategoriaProduto[]>([])
  const [filtered, setFiltered] = useState<Produto[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [dateFilterStart, setDateFilterStart] = useState('')
  const [dateFilterEnd, setDateFilterEnd] = useState('')

  const [activeTab, setActiveTab] = useState('registros')
  const [editingItem, setEditingItem] = useState<Produto | null>(null)

  const [nome, setNome] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [status, setStatus] = useState<'Ativo' | 'Inativo'>('Ativo')
  const [descricao, setDescricao] = useState('')
  const [specs, setSpecs] = useState<Array<{ key: string; value: string }>>([])

  const [nomeTouched, setNomeTouched] = useState(false)
  const [nomeError, setNomeError] = useState('')
  const [isCheckingNome, setIsCheckingNome] = useState(false)

  const [isDraggingFotos, setIsDraggingFotos] = useState(false)
  const [existingFotos, setExistingFotos] = useState<string[]>([])
  const [fotosToDelete, setFotosToDelete] = useState<string[]>([])
  const [newFotos, setNewFotos] = useState<File[]>([])
  const fotosInputRef = useRef<HTMLInputElement>(null)

  const colunasOptions = [
    { id: 'foto', label: 'Foto' },
    { id: 'nome', label: 'Nome' },
    { id: 'categoria', label: 'Categoria' },
    { id: 'dt_cad', label: 'Dt Cad.' },
    { id: 'status', label: 'Status' },
  ]
  const { visibleColumns, toggleColumn } = useTablePreferences(
    'produtos',
    colunasOptions.map((c) => c.id),
  )

  const loadData = async () => {
    try {
      const [prods, cats] = await Promise.all([getProdutos(), getCategorias()])
      setItems(prods)
      setCategorias(cats)
    } catch (error) {
      toast({ title: 'Erro ao carregar dados', variant: 'destructive' })
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('produtos', () => loadData())
  useRealtime('categorias_produtos', () => loadData())

  useEffect(() => {
    let result = items
    if (searchTerm) {
      result = result.filter((i) => i.nome.toLowerCase().includes(searchTerm.toLowerCase()))
    }
    if (categoryFilter && categoryFilter !== 'all') {
      result = result.filter((i) => i.categoria === categoryFilter)
    }
    if (dateFilterStart) {
      result = result.filter((i) => new Date(i.created) >= new Date(dateFilterStart))
    }
    if (dateFilterEnd) {
      const end = new Date(dateFilterEnd)
      end.setHours(23, 59, 59, 999)
      result = result.filter((i) => new Date(i.created) <= end)
    }
    setFiltered(result)
  }, [items, searchTerm, categoryFilter, dateFilterStart, dateFilterEnd])

  useEffect(() => {
    if (!nomeTouched) return
    if (!nome.trim()) {
      setNomeError('O nome é obrigatório')
      return
    }
    const timer = setTimeout(async () => {
      setIsCheckingNome(true)
      const isUnique = await checkUniqueName('produtos', nome.trim(), editingItem?.id)
      if (!isUnique) {
        setNomeError('Este nome já está em uso')
      } else {
        setNomeError('')
      }
      setIsCheckingNome(false)
    }, 400)
    return () => clearTimeout(timer)
  }, [nome, nomeTouched, editingItem?.id])

  const handleEdit = (item: Produto) => {
    setEditingItem(item)
    setNome(item.nome)
    setCategoriaId(item.categoria)
    setStatus(item.status)
    setDescricao(item.descricao || '')
    const itemSpecs = item.especificacoes || {}
    setSpecs(Object.entries(itemSpecs).map(([key, value]) => ({ key, value: String(value) })))
    setExistingFotos(item.fotos || [])
    setFotosToDelete([])
    setNewFotos([])
    setNomeTouched(false)
    setNomeError('')
    setActiveTab('cadastro')
  }

  const handleDuplicate = async (item: Produto) => {
    try {
      const formData = new FormData()
      formData.append('nome', item.nome + ' (Cópia)')
      formData.append('categoria', item.categoria)
      formData.append('status', item.status)
      if (item.descricao) formData.append('descricao', item.descricao)
      if (item.especificacoes)
        formData.append('especificacoes', JSON.stringify(item.especificacoes))
      await createProduto(formData)
      toast({ title: 'Produto duplicado com sucesso' })
    } catch (error) {
      toast({ title: 'Erro ao duplicar produto', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este produto?')) return
    try {
      await deleteProduto(id)
      toast({ title: 'Produto excluído com sucesso' })
    } catch (error) {
      toast({ title: 'Erro ao excluir produto', variant: 'destructive' })
    }
  }

  const isFormValid = nome.trim() && !nomeError && !isCheckingNome && categoriaId

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoriaId) {
      toast({ title: 'Selecione uma categoria', variant: 'destructive' })
      return
    }
    if (!isFormValid) return

    try {
      const formData = new FormData()
      formData.append('nome', nome.trim())
      formData.append('categoria', categoriaId)
      formData.append('status', status)
      formData.append('descricao', descricao.trim())

      const specsObj = specs.reduce(
        (acc, curr) => {
          if (curr.key.trim()) acc[curr.key.trim()] = curr.value.trim()
          return acc
        },
        {} as Record<string, string>,
      )
      formData.append('especificacoes', JSON.stringify(specsObj))

      fotosToDelete.forEach((f) => formData.append('fotos-', f))
      newFotos.forEach((f) => formData.append('fotos', f))

      if (editingItem) {
        await updateProduto(editingItem.id, formData)
        toast({ title: 'Produto atualizado com sucesso' })
      } else {
        await createProduto(formData)
        toast({ title: 'Produto criado com sucesso' })
      }
      resetForm()
      setActiveTab('registros')
    } catch (error) {
      toast({ title: 'Erro ao salvar produto', variant: 'destructive' })
    }
  }

  const resetForm = () => {
    setEditingItem(null)
    setNome('')
    setCategoriaId('')
    setStatus('Ativo')
    setDescricao('')
    setSpecs([])
    setExistingFotos([])
    setFotosToDelete([])
    setNewFotos([])
    setNomeTouched(false)
    setNomeError('')
    if (fotosInputRef.current) fotosInputRef.current.value = ''
  }

  const handleDropFotos = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingFotos(false)
    if (e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files).filter(
        (f) => f.size <= 5242880 && f.type.startsWith('image/'),
      )
      setNewFotos((prev) => [...prev, ...files])
    }
  }

  const exportCsv = () => {
    const headers = ['Nome', 'Categoria', 'Status', 'Data de Cadastro']
    const csvContent = [
      headers.join(','),
      ...filtered.map(
        (i) =>
          `"${i.nome}","${i.expand?.categoria?.nome || ''}","${i.status}","${new Date(i.created).toLocaleDateString('pt-BR')}"`,
      ),
    ].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = 'produtos.csv'
    link.click()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6 text-gray-800">
        <Package className="h-6 w-6" />
        <h1 className="text-2xl font-normal">Produtos</h1>
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
          <div className="p-4 border-b flex flex-wrap items-center gap-4">
            <Input
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm rounded-sm"
            />
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="rounded-sm">
                  <Filter className="w-4 h-4 mr-2" /> Filtros Avançados
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4 space-y-4 rounded-sm">
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="rounded-sm">
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {categorias.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <Label>Data Inicial</Label>
                    <Input
                      type="date"
                      value={dateFilterStart}
                      onChange={(e) => setDateFilterStart(e.target.value)}
                      className="rounded-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data Final</Label>
                    <Input
                      type="date"
                      value={dateFilterEnd}
                      onChange={(e) => setDateFilterEnd(e.target.value)}
                      className="rounded-sm"
                    />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCategoryFilter('all')
                      setDateFilterStart('')
                      setDateFilterEnd('')
                    }}
                  >
                    Limpar
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="w-[50px]">
                    <input type="checkbox" className="rounded border-gray-300" />
                  </TableHead>
                  {visibleColumns.includes('foto') && (
                    <TableHead className="w-[60px] font-medium text-brand-cyan">Foto</TableHead>
                  )}
                  {visibleColumns.includes('nome') && (
                    <TableHead className="font-medium text-brand-cyan">Nome</TableHead>
                  )}
                  {visibleColumns.includes('categoria') && (
                    <TableHead className="font-medium text-brand-cyan">Categoria</TableHead>
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
                    {visibleColumns.includes('foto') && (
                      <TableCell>
                        {item.fotos && item.fotos.length > 0 ? (
                          <img
                            src={getProdutoFotoUrl(item, item.fotos[0])}
                            alt={item.nome}
                            className="w-10 h-10 rounded-md object-cover select-none border border-brand-green/20"
                            draggable="false"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-md bg-brand-green/10 flex items-center justify-center border border-brand-green/20">
                            <Package className="w-5 h-5 text-brand-green" />
                          </div>
                        )}
                      </TableCell>
                    )}
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
                    {visibleColumns.includes('categoria') && (
                      <TableCell className="text-gray-600">
                        {item.expand?.categoria?.nome || '-'}
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
          <form onSubmit={handleSave} className="space-y-6 max-w-4xl">
            <Tabs defaultValue="gerais" className="w-full">
              <TabsList className="mb-6 bg-gray-100/50 p-1">
                <TabsTrigger
                  value="gerais"
                  className="rounded-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  Dados Gerais
                </TabsTrigger>
                <TabsTrigger
                  value="especificacoes"
                  className="rounded-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  Especificações Técnicas
                </TabsTrigger>
                <TabsTrigger
                  value="imagens"
                  className="rounded-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  Imagens
                </TabsTrigger>
              </TabsList>

              <TabsContent value="gerais" className="space-y-4 max-w-2xl">
                <div className="grid gap-2">
                  <Label htmlFor="nome">
                    Nome do Produto <span className="text-red-500">*</span>
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
                  <Label htmlFor="categoria">
                    Categoria <span className="text-red-500">*</span>
                  </Label>
                  <Select value={categoriaId} onValueChange={setCategoriaId}>
                    <SelectTrigger className="rounded-sm">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              </TabsContent>

              <TabsContent value="especificacoes" className="space-y-6 max-w-2xl">
                <div className="grid gap-2">
                  <Label htmlFor="descricao">Descrição Geral</Label>
                  <Textarea
                    id="descricao"
                    value={descricao}
                    onChange={(e) => setDescricao(e.target.value)}
                    rows={4}
                    className="rounded-sm"
                    placeholder="Escreva uma descrição para o produto..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Atributos e Especificações</Label>
                  <div className="space-y-2 mt-2">
                    {specs.map((spec, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <Input
                          placeholder="Atributo (ex: Peso)"
                          value={spec.key}
                          onChange={(e) => {
                            const newSpecs = [...specs]
                            newSpecs[idx].key = e.target.value
                            setSpecs(newSpecs)
                          }}
                        />
                        <Input
                          placeholder="Valor (ex: 10kg)"
                          value={spec.value}
                          onChange={(e) => {
                            const newSpecs = [...specs]
                            newSpecs[idx].value = e.target.value
                            setSpecs(newSpecs)
                          }}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => setSpecs(specs.filter((_, i) => i !== idx))}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSpecs([...specs, { key: '', value: '' }])}
                    >
                      + Adicionar Especificação
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="imagens" className="space-y-4">
                <div
                  className={cn(
                    'border-2 border-dashed rounded-md p-8 text-center transition-colors cursor-pointer',
                    isDraggingFotos
                      ? 'border-[#2A75D3] bg-blue-50'
                      : 'border-gray-300 hover:bg-gray-50',
                  )}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDraggingFotos(true)
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault()
                    setIsDraggingFotos(false)
                  }}
                  onDrop={handleDropFotos}
                  onClick={() => fotosInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <UploadCloud className="w-10 h-10 mb-2 text-gray-400" />
                    <p className="text-sm font-medium">Arraste imagens ou clique para selecionar</p>
                    <p className="text-xs mt-1">PNG, JPG, WEBP, SVG (Max 5MB)</p>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    ref={fotosInputRef}
                    onChange={(e) => {
                      if (e.target.files) {
                        const files = Array.from(e.target.files).filter(
                          (f) => f.size <= 5242880 && f.type.startsWith('image/'),
                        )
                        setNewFotos((prev) => [...prev, ...files])
                      }
                      if (fotosInputRef.current) fotosInputRef.current.value = ''
                    }}
                  />
                </div>

                {(existingFotos.length > 0 || newFotos.length > 0) && (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-4">
                    {existingFotos.map((f, i) => (
                      <div key={i} className="relative group rounded-md overflow-hidden border">
                        <img
                          src={getProdutoFotoUrl(editingItem!, f)}
                          alt="Produto"
                          className="w-full h-24 object-cover select-none"
                          draggable="false"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFotosToDelete((prev) => [...prev, f])
                            setExistingFotos((prev) => prev.filter((file) => file !== f))
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {newFotos.map((f, i) => (
                      <div
                        key={`new-${i}`}
                        className="relative group rounded-md overflow-hidden border"
                      >
                        <img
                          src={URL.createObjectURL(f)}
                          alt="Novo Produto"
                          className="w-full h-24 object-cover select-none"
                          draggable="false"
                        />
                        <div className="absolute top-1 left-1 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-sm">
                          Novo
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewFotos((prev) => prev.filter((_, idx) => idx !== i))}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                className="bg-[#2A75D3] hover:bg-[#2A75D3]/90 rounded-sm"
                disabled={!isFormValid}
              >
                {isCheckingNome && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Salvar Produto
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
