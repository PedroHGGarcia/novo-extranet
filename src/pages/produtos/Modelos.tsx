import { useState, useEffect } from 'react'
import { Package, Pencil, Copy, Trash2 } from 'lucide-react'
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
import {
  getModelos,
  createModelo,
  updateModelo,
  deleteModelo,
  getProdutos,
  getMarcas,
  checkUniqueName,
  Modelo,
  Produto,
  Marca,
} from '@/services/produtos'

export default function Modelos() {
  const [items, setItems] = useState<Modelo[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [filtered, setFiltered] = useState<Modelo[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  const [activeTab, setActiveTab] = useState('registros')
  const [editingItem, setEditingItem] = useState<Modelo | null>(null)

  const [nome, setNome] = useState('')
  const [produtoId, setProdutoId] = useState('')
  const [marcaId, setMarcaId] = useState('')
  const [status, setStatus] = useState<'Ativo' | 'Inativo'>('Ativo')

  const [nomeTouched, setNomeTouched] = useState(false)
  const [nomeError, setNomeError] = useState('')
  const [isCheckingNome, setIsCheckingNome] = useState(false)

  const loadData = async () => {
    try {
      const [mods, prods, mrcs] = await Promise.all([getModelos(), getProdutos(), getMarcas()])
      setItems(mods)
      setProdutos(prods)
      setMarcas(mrcs)
    } catch (error) {
      toast({ title: 'Erro ao carregar dados', variant: 'destructive' })
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('modelos', () => loadData())
  useRealtime('produtos', () => loadData())
  useRealtime('marcas', () => loadData())

  useEffect(() => {
    let result = items
    if (searchTerm) {
      result = result.filter((i) => i.nome.toLowerCase().includes(searchTerm.toLowerCase()))
    }
    setFiltered(result)
  }, [items, searchTerm])

  useEffect(() => {
    if (!nomeTouched) return
    if (!nome.trim()) {
      setNomeError('O nome é obrigatório')
      return
    }
    const timer = setTimeout(async () => {
      setIsCheckingNome(true)
      const isUnique = await checkUniqueName('modelos', nome.trim(), editingItem?.id)
      setNomeError(isUnique ? '' : 'Este nome já está em uso')
      setIsCheckingNome(false)
    }, 400)
    return () => clearTimeout(timer)
  }, [nome, nomeTouched, editingItem?.id])

  const handleEdit = (item: Modelo) => {
    setEditingItem(item)
    setNome(item.nome)
    setProdutoId(item.produto)
    setMarcaId(item.marca)
    setStatus(item.status)
    setNomeTouched(false)
    setNomeError('')
    setActiveTab('cadastro')
  }

  const handleDuplicate = async (item: Modelo) => {
    try {
      await createModelo({
        nome: item.nome + ' (Cópia)',
        produto: item.produto,
        marca: item.marca,
        status: item.status,
      })
      toast({ title: 'Modelo duplicado com sucesso' })
    } catch (error) {
      toast({ title: 'Erro ao duplicar modelo', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir este modelo?')) return
    try {
      await deleteModelo(id)
      toast({ title: 'Modelo excluído com sucesso' })
    } catch (error) {
      toast({ title: 'Erro ao excluir modelo', variant: 'destructive' })
    }
  }

  const isFormValid = nome.trim() && !nomeError && !isCheckingNome && produtoId && marcaId

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) return
    try {
      const data = { nome: nome.trim(), produto: produtoId, marca: marcaId, status }
      if (editingItem) await updateModelo(editingItem.id, data)
      else await createModelo(data)
      toast({ title: `Modelo ${editingItem ? 'atualizado' : 'criado'} com sucesso` })
      resetForm()
      setActiveTab('registros')
    } catch (error) {
      toast({ title: 'Erro ao salvar modelo', variant: 'destructive' })
    }
  }

  const resetForm = () => {
    setEditingItem(null)
    setNome('')
    setProdutoId('')
    setMarcaId('')
    setStatus('Ativo')
    setNomeTouched(false)
    setNomeError('')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6 text-gray-800">
        <Package className="h-6 w-6" />
        <h1 className="text-2xl font-normal">Modelos</h1>
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
                  <TableHead className="font-medium text-brand-cyan">Produto</TableHead>
                  <TableHead className="font-medium text-brand-cyan">Marca</TableHead>
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
                    <TableCell className="text-gray-600">
                      {item.expand?.produto?.nome || '-'}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {item.expand?.marca?.nome || '-'}
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {new Date(item.created).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <Badge className={item.status === 'Ativo' ? 'bg-green-500' : 'bg-gray-400'}>
                        {item.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
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
            <div className="grid gap-2">
              <Label>
                Nome do Modelo <span className="text-red-500">*</span>
              </Label>
              <Input
                value={nome}
                onChange={(e) => {
                  setNome(e.target.value)
                  setNomeTouched(true)
                }}
                className={cn('rounded-sm', nomeError && 'border-red-500')}
              />
              {nomeError && <p className="text-xs text-red-500">{nomeError}</p>}
            </div>
            <div className="grid gap-2">
              <Label>
                Produto <span className="text-red-500">*</span>
              </Label>
              <Select value={produtoId} onValueChange={setProdutoId}>
                <SelectTrigger className="rounded-sm">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {produtos.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>
                Marca <span className="text-red-500">*</span>
              </Label>
              <Select value={marcaId} onValueChange={setMarcaId}>
                <SelectTrigger className="rounded-sm">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {marcas.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>
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
            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                className="bg-[#2A75D3] hover:bg-[#2A75D3]/90 rounded-sm"
                disabled={!isFormValid}
              >
                Salvar Modelo
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
