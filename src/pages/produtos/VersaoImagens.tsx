import { useState, useEffect, useRef } from 'react'
import { Package, Pencil, Copy, Trash2, UploadCloud, X } from 'lucide-react'
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
  getVersaoImagens,
  createVersaoImagem,
  updateVersaoImagem,
  deleteVersaoImagem,
  getVersoes,
  getVersaoImagemArquivoUrl,
  VersaoImagem,
  Versao,
} from '@/services/produtos'

export default function VersaoImagens() {
  const [items, setItems] = useState<VersaoImagem[]>([])
  const [versoes, setVersoes] = useState<Versao[]>([])
  const [filtered, setFiltered] = useState<VersaoImagem[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  const [activeTab, setActiveTab] = useState('registros')
  const [editingItem, setEditingItem] = useState<VersaoImagem | null>(null)

  const [titulo, setTitulo] = useState('')
  const [versaoId, setVersaoId] = useState('')
  const [ordem, setOrdem] = useState<number>(1)
  const [status, setStatus] = useState<'Ativo' | 'Inativo'>('Ativo')

  const [isDragging, setIsDragging] = useState(false)
  const [newFoto, setNewFoto] = useState<File | null>(null)
  const [deleteFoto, setDeleteFoto] = useState(false)
  const fotoInputRef = useRef<HTMLInputElement>(null)

  const [tituloTouched, setTituloTouched] = useState(false)
  const [tituloError, setTituloError] = useState('')

  const loadData = async () => {
    try {
      const [imgs, vs] = await Promise.all([getVersaoImagens(), getVersoes()])
      setItems(imgs)
      setVersoes(vs)
    } catch (error) {
      toast({ title: 'Erro ao carregar dados', variant: 'destructive' })
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('versao_imagens', () => loadData())
  useRealtime('versoes', () => loadData())

  useEffect(() => {
    let result = items
    if (searchTerm) {
      result = result.filter(
        (i) =>
          i.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
          i.expand?.versao?.nome.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }
    setFiltered(result)
  }, [items, searchTerm])

  useEffect(() => {
    if (!tituloTouched) return
    if (!titulo.trim()) {
      setTituloError('O título é obrigatório')
      return
    }
    setTituloError('')
  }, [titulo, tituloTouched])

  const handleEdit = (item: VersaoImagem) => {
    setEditingItem(item)
    setTitulo(item.titulo)
    setVersaoId(item.versao)
    setOrdem(item.ordem || 1)
    setStatus(item.status)
    setNewFoto(null)
    setDeleteFoto(false)
    setTituloTouched(false)
    setTituloError('')
    setActiveTab('cadastro')
  }

  const handleDuplicate = async (item: VersaoImagem) => {
    try {
      const formData = new FormData()
      formData.append('titulo', item.titulo + ' (Cópia)')
      formData.append('versao', item.versao)
      formData.append('ordem', String((item.ordem || 1) + 1))
      formData.append('status', item.status)
      await createVersaoImagem(formData)
      toast({ title: 'Imagem duplicada com sucesso' })
    } catch (error) {
      toast({ title: 'Erro ao duplicar imagem', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta imagem?')) return
    try {
      await deleteVersaoImagem(id)
      toast({ title: 'Imagem excluída com sucesso' })
    } catch (error) {
      toast({ title: 'Erro ao excluir imagem', variant: 'destructive' })
    }
  }

  const isFormValid = titulo.trim() && !tituloError && versaoId

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) return
    try {
      const formData = new FormData()
      formData.append('titulo', titulo.trim())
      formData.append('versao', versaoId)
      formData.append('ordem', String(ordem))
      formData.append('status', status)

      if (deleteFoto) {
        formData.append('arquivo', '')
      } else if (newFoto) {
        formData.append('arquivo', newFoto)
      }

      if (editingItem) await updateVersaoImagem(editingItem.id, formData)
      else await createVersaoImagem(formData)

      toast({ title: `Imagem ${editingItem ? 'atualizada' : 'criada'} com sucesso` })
      resetForm()
      setActiveTab('registros')
    } catch (error) {
      toast({ title: 'Erro ao salvar imagem', variant: 'destructive' })
    }
  }

  const resetForm = () => {
    setEditingItem(null)
    setTitulo('')
    setVersaoId('')
    setOrdem(1)
    setStatus('Ativo')
    setNewFoto(null)
    setDeleteFoto(false)
    setTituloTouched(false)
    setTituloError('')
    if (fotoInputRef.current) fotoInputRef.current.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const f = e.dataTransfer.files[0]
      if (f.size <= 5242880 && f.type.startsWith('image/')) setNewFoto(f)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6 text-gray-800">
        <Package className="h-6 w-6" />
        <h1 className="text-2xl font-normal">Versão Imagens</h1>
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
              placeholder="Buscar por título ou versão..."
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
                  <TableHead className="font-medium text-brand-cyan">Título</TableHead>
                  <TableHead className="font-medium text-brand-cyan">Versão</TableHead>
                  <TableHead className="font-medium text-brand-cyan w-[80px]">Imagem</TableHead>
                  <TableHead className="font-medium text-brand-cyan">Ordem</TableHead>
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
                      <div className="font-medium text-gray-700">{item.titulo}</div>
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
                      {item.expand?.versao?.nome || '-'}
                    </TableCell>
                    <TableCell>
                      {item.arquivo && (
                        <img
                          src={getVersaoImagemArquivoUrl(item, item.arquivo)}
                          className="h-10 w-10 object-contain rounded"
                          alt={item.titulo}
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-gray-600">{item.ordem}</TableCell>
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
          <form onSubmit={handleSave} className="space-y-6 max-w-3xl">
            <Tabs defaultValue="gerais" className="w-full">
              <TabsList className="mb-6 bg-gray-100/50 p-1">
                <TabsTrigger
                  value="gerais"
                  className="rounded-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  Dados Gerais
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
                  <Label>
                    Título <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={titulo}
                    onChange={(e) => {
                      setTitulo(e.target.value)
                      setTituloTouched(true)
                    }}
                    className={cn('rounded-sm', tituloError && 'border-red-500')}
                  />
                  {tituloError && <p className="text-xs text-red-500">{tituloError}</p>}
                </div>
                <div className="grid gap-2">
                  <Label>
                    Versão <span className="text-red-500">*</span>
                  </Label>
                  <Select value={versaoId} onValueChange={setVersaoId}>
                    <SelectTrigger className="rounded-sm">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {versoes.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Ordem de Exibição</Label>
                    <Input
                      type="number"
                      value={ordem}
                      onChange={(e) => setOrdem(parseInt(e.target.value) || 1)}
                      className="rounded-sm"
                    />
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
                </div>
              </TabsContent>

              <TabsContent value="imagens" className="space-y-4 max-w-xl">
                <div
                  className={cn(
                    'border-2 border-dashed rounded-md p-8 text-center transition-colors cursor-pointer',
                    isDragging ? 'border-[#2A75D3] bg-blue-50' : 'border-gray-300 hover:bg-gray-50',
                  )}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDragging(true)
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault()
                    setIsDragging(false)
                  }}
                  onDrop={handleDrop}
                  onClick={() => fotoInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <UploadCloud className="w-10 h-10 mb-2 text-gray-400" />
                    <p className="text-sm font-medium">
                      Arraste a imagem ou clique para selecionar
                    </p>
                    <p className="text-xs mt-1">Max 5MB</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fotoInputRef}
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        const f = e.target.files[0]
                        if (f.size <= 5242880 && f.type.startsWith('image/')) setNewFoto(f)
                      }
                      if (fotoInputRef.current) fotoInputRef.current.value = ''
                    }}
                  />
                </div>

                {newFoto && (
                  <div className="relative inline-block border rounded p-1">
                    <img
                      src={URL.createObjectURL(newFoto)}
                      alt="Preview"
                      className="h-32 object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setNewFoto(null)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {!newFoto && !deleteFoto && editingItem?.arquivo && (
                  <div className="relative inline-block border rounded p-1">
                    <img
                      src={getVersaoImagemArquivoUrl(editingItem, editingItem.arquivo)}
                      alt="Preview Atual"
                      className="h-32 object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => setDeleteFoto(true)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
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
                Salvar Imagem
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
