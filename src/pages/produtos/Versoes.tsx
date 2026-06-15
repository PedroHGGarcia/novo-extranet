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
import { Switch } from '@/components/ui/switch'
import { toast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'
import {
  getVersoes,
  createVersao,
  updateVersao,
  deleteVersao,
  getModelos,
  getVersaoImagemUrl,
  Versao,
  Modelo,
} from '@/services/produtos'

export default function Versoes() {
  const { user } = useAuth()
  const [items, setItems] = useState<Versao[]>([])
  const [modelos, setModelos] = useState<Modelo[]>([])
  const [filtered, setFiltered] = useState<Versao[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  const [activeTab, setActiveTab] = useState('registros')
  const [editingItem, setEditingItem] = useState<Versao | null>(null)

  const [nome, setNome] = useState('')
  const [modeloId, setModeloId] = useState('')
  const [codErp, setCodErp] = useState('')
  const [status, setStatus] = useState<'Ativo' | 'Inativo'>('Ativo')

  const [moeda, setMoeda] = useState('BRL')
  const [valor, setValor] = useState<number>(0)
  const [temFator, setTemFator] = useState(false)
  const [fatorNac, setFatorNac] = useState<number>(1)

  const [nomeTouched, setNomeTouched] = useState(false)
  const [nomeError, setNomeError] = useState('')

  const [isDragging, setIsDragging] = useState(false)
  const [newFoto, setNewFoto] = useState<File | null>(null)
  const [deleteFoto, setDeleteFoto] = useState(false)
  const fotoInputRef = useRef<HTMLInputElement>(null)

  const loadData = async () => {
    try {
      const [vs, ms] = await Promise.all([getVersoes(), getModelos()])
      setItems(vs)
      setModelos(ms)
    } catch (error) {
      toast({ title: 'Erro ao carregar dados', variant: 'destructive' })
    }
  }

  useEffect(() => {
    loadData()
  }, [])
  useRealtime('versoes', () => loadData())
  useRealtime('modelos', () => loadData())

  useEffect(() => {
    let result = items
    if (searchTerm) {
      result = result.filter(
        (i) =>
          i.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (i.cod_erp && i.cod_erp.toLowerCase().includes(searchTerm.toLowerCase())),
      )
    }
    setFiltered(result)
  }, [items, searchTerm])

  useEffect(() => {
    if (!nomeTouched) return
    if (!nome.trim()) {
      setNomeError('O nome é obrigatório')
      return
    }
    setNomeError('')
  }, [nome, nomeTouched])

  const handleEdit = (item: Versao) => {
    setEditingItem(item)
    setNome(item.nome)
    setModeloId(item.modelo)
    setCodErp(item.cod_erp || '')
    setStatus(item.status)
    setMoeda(item.moeda || 'BRL')
    setValor(item.valor || 0)
    setTemFator(item.tem_fator || false)
    setFatorNac(item.fator_nac || 1)
    setNewFoto(null)
    setDeleteFoto(false)
    setNomeTouched(false)
    setNomeError('')
    setActiveTab('cadastro')
  }

  const handleDuplicate = async (item: Versao) => {
    try {
      const formData = new FormData()
      formData.append('nome', item.nome + ' (Cópia)')
      formData.append('modelo', item.modelo)
      formData.append('status', item.status)
      if (item.cod_erp) formData.append('cod_erp', item.cod_erp + '-COPY')
      formData.append('moeda', item.moeda || 'BRL')
      formData.append('valor', String(item.valor || 0))
      formData.append('tem_fator', String(item.tem_fator || false))
      formData.append('fator_nac', String(item.fator_nac || 1))
      formData.append('atualizado_por', user?.id)

      await createVersao(formData)
      toast({ title: 'Versão duplicada com sucesso' })
    } catch (error) {
      toast({ title: 'Erro ao duplicar versão', variant: 'destructive' })
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta versão?')) return
    try {
      await deleteVersao(id)
      toast({ title: 'Versão excluída com sucesso' })
    } catch (error) {
      toast({ title: 'Erro ao excluir versão', variant: 'destructive' })
    }
  }

  const isFormValid = nome.trim() && !nomeError && modeloId

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) return
    try {
      const formData = new FormData()
      formData.append('nome', nome.trim())
      formData.append('modelo', modeloId)
      formData.append('cod_erp', codErp.trim())
      formData.append('status', status)
      formData.append('moeda', moeda)
      formData.append('valor', String(valor))
      formData.append('tem_fator', String(temFator))
      formData.append('fator_nac', String(fatorNac))
      formData.append('atualizado_por', user?.id)

      if (deleteFoto) {
        formData.append('imagem_preview', '')
      } else if (newFoto) {
        formData.append('imagem_preview', newFoto)
      }

      if (editingItem) await updateVersao(editingItem.id, formData)
      else await createVersao(formData)

      toast({ title: `Versão ${editingItem ? 'atualizada' : 'criada'} com sucesso` })
      resetForm()
      setActiveTab('registros')
    } catch (error: any) {
      if (error?.response?.data?.cod_erp?.code === 'validation_not_unique') {
        toast({ title: 'Código ERP já existe', variant: 'destructive' })
      } else {
        toast({ title: 'Erro ao salvar versão', variant: 'destructive' })
      }
    }
  }

  const resetForm = () => {
    setEditingItem(null)
    setNome('')
    setModeloId('')
    setCodErp('')
    setStatus('Ativo')
    setMoeda('BRL')
    setValor(0)
    setTemFator(false)
    setFatorNac(1)
    setNewFoto(null)
    setDeleteFoto(false)
    setNomeTouched(false)
    setNomeError('')
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
        <h1 className="text-2xl font-normal">Versões</h1>
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
              placeholder="Buscar por nome ou ERP..."
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
                  <TableHead className="font-medium text-brand-cyan">Modelo</TableHead>
                  <TableHead className="font-medium text-brand-cyan">Nome</TableHead>
                  <TableHead className="font-medium text-brand-cyan">CodErp</TableHead>
                  <TableHead className="font-medium text-brand-cyan w-[80px]">Imagem</TableHead>
                  <TableHead className="font-medium text-brand-cyan">Moeda</TableHead>
                  <TableHead className="font-medium text-brand-cyan text-right">Valor</TableHead>
                  <TableHead className="font-medium text-brand-cyan text-center">Fator</TableHead>
                  <TableHead className="font-medium text-brand-cyan text-right">
                    Fator Nac.
                  </TableHead>
                  <TableHead className="font-medium text-brand-cyan">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.id} className="hover:bg-gray-50/50">
                    <TableCell>
                      <input type="checkbox" className="rounded border-gray-300" />
                    </TableCell>
                    <TableCell className="text-gray-600">
                      {item.expand?.modelo?.nome || '-'}
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
                    <TableCell className="text-gray-600">{item.cod_erp || '-'}</TableCell>
                    <TableCell>
                      {item.imagem_preview && (
                        <img
                          src={getVersaoImagemUrl(item, item.imagem_preview)}
                          className="h-10 w-10 object-contain rounded"
                          alt={item.nome}
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-gray-600">{item.moeda}</TableCell>
                    <TableCell className="text-gray-600 text-right">
                      {Number(item.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-gray-600 text-center">
                      {item.tem_fator ? 'Sim' : 'Não'}
                    </TableCell>
                    <TableCell className="text-gray-600 text-right">
                      {Number(item.fator_nac).toLocaleString('pt-BR', { minimumFractionDigits: 6 })}
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
                    <TableCell colSpan={10} className="text-center py-8 text-gray-500">
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
                  value="especificacoes"
                  className="rounded-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  Especificações Técnicas
                </TabsTrigger>
                <TabsTrigger
                  value="imagens"
                  className="rounded-sm data-[state=active]:bg-white data-[state=active]:shadow-sm"
                >
                  Imagem Preview
                </TabsTrigger>
              </TabsList>

              <TabsContent value="gerais" className="space-y-4 max-w-2xl">
                <div className="grid gap-2">
                  <Label>
                    Nome da Versão <span className="text-red-500">*</span>
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
                    Modelo <span className="text-red-500">*</span>
                  </Label>
                  <Select value={modeloId} onValueChange={setModeloId}>
                    <SelectTrigger className="rounded-sm">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {modelos.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Código ERP</Label>
                    <Input
                      value={codErp}
                      onChange={(e) => setCodErp(e.target.value)}
                      className="rounded-sm"
                      placeholder="Opcional"
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

              <TabsContent value="especificacoes" className="space-y-4 max-w-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Moeda Base</Label>
                    <Select value={moeda} onValueChange={setMoeda}>
                      <SelectTrigger className="rounded-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BRL">BRL (R$)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Valor Base</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={valor}
                      onChange={(e) => setValor(parseFloat(e.target.value) || 0)}
                      className="rounded-sm"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Fator Nacional</Label>
                    <Input
                      type="number"
                      step="0.000001"
                      value={fatorNac}
                      onChange={(e) => setFatorNac(parseFloat(e.target.value) || 0)}
                      className="rounded-sm"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Switch id="tem-fator" checked={temFator} onCheckedChange={setTemFator} />
                    <Label htmlFor="tem-fator">Aplicar Fator no Cálculo</Label>
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

                {!newFoto && !deleteFoto && editingItem?.imagem_preview && (
                  <div className="relative inline-block border rounded p-1">
                    <img
                      src={getVersaoImagemUrl(editingItem, editingItem.imagem_preview)}
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
                Salvar Versão
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
