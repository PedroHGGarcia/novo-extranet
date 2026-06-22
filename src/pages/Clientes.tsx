import { useState, useEffect } from 'react'
import {
  UserCircle,
  Loader2,
  Pencil,
  Copy,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Plus,
  Trash2,
  FileText,
  Search,
  MoreHorizontal,
  Building2,
  MapPin,
  Phone,
} from 'lucide-react'
import { PageLayout } from '@/components/PageLayout'
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  TableHead,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal'
import {
  getClientesPaginated,
  createCliente,
  updateCliente,
  deleteCliente,
  getByDocumento,
  getDocumentosCliente,
  createDocumentoCliente,
  deleteDocumentoCliente,
} from '@/services/cadastros'
import { DuplicateConflictDialog } from '@/components/DuplicateConflictDialog'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import pb from '@/lib/pocketbase/client'

type Contato = { id: string; nome: string; telefone: string; email: string; observacoes: string }
type Documento = {
  id?: string
  tipo: string
  file?: File | null
  arquivoUrl?: string
  arquivoNome?: string
  deleted?: boolean
}

export default function Clientes() {
  const [view, setView] = useState<'list' | 'form'>('list')
  const [data, setData] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(50)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [selected, setSelected] = useState<string[]>([])
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [conflictRecord, setConflictRecord] = useState<any>(null)
  const [isConflictOpen, setIsConflictOpen] = useState(false)
  const [isFetchingCep, setIsFetchingCep] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const defaultForm = {
    id: '',
    documento: '',
    status: 'Ativo',
    razao_social: '',
    fantasia: '',
    contato: '',
    telefone: '',
    telefone_2: '',
    telefone_3: '',
    celular: '',
    email: '',
    email_fiscal: '',
    cep: '',
    estado: '',
    cidade: '',
    bairro: '',
    logradouro: '',
    numero: '',
    complementos: '',
    dt_cad: new Date().toLocaleString('pt-BR'),
  }

  const [formData, setFormData] = useState(defaultForm)
  const [contatos, setContatos] = useState<Contato[]>([])
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const { toast } = useToast()

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  const loadData = async () => {
    try {
      let filter = ''
      if (debouncedSearch) {
        const s = debouncedSearch.replace(/"/g, '\\"')
        filter = `fantasia ~ "${s}" || razao_social ~ "${s}" || documento ~ "${s}"`
      }
      const res = await getClientesPaginated(page, perPage, filter)
      setData(res.items)
      setTotalItems(res.totalItems)
      setTotalPages(res.totalPages)
    } catch (e) {
      setData([])
      setTotalItems(0)
      setTotalPages(0)
    }
  }

  useEffect(() => {
    loadData()
  }, [page, perPage, debouncedSearch])

  useRealtime('clientes', loadData)

  const resetForm = () => {
    setFormData(defaultForm)
    setContatos([])
    setDocumentos([])
    setConflictRecord(null)
    setFieldErrors({})
  }

  const handleEdit = async (item: any) => {
    setFormData({
      id: item.id,
      documento: item.documento || '',
      status: item.status || 'Ativo',
      razao_social: item.razao_social || '',
      fantasia: item.fantasia || '',
      contato: item.contato || '',
      telefone: item.telefone || '',
      telefone_2: item.telefone_2 || '',
      telefone_3: item.telefone_3 || '',
      celular: item.celular || '',
      email: item.email || '',
      email_fiscal: item.email_fiscal || '',
      cep: item.cep || '',
      estado: item.estado || '',
      cidade: item.cidade || '',
      bairro: item.bairro || '',
      logradouro: item.logradouro || '',
      numero: item.numero || '',
      complementos: item.complementos || '',
      dt_cad: item.dt_cad || new Date().toLocaleString('pt-BR'),
    })

    const parsedContatos = Array.isArray(item.contatos_adicionais) ? item.contatos_adicionais : []
    setContatos(parsedContatos.map((c: any) => ({ id: crypto.randomUUID(), ...c })))

    setFieldErrors({})

    try {
      const docs = await getDocumentosCliente(item.id)
      setDocumentos(
        docs.map((d) => ({
          id: d.id,
          tipo: d.tipo,
          arquivoUrl: pb.files.getURL(d, d.arquivo),
          arquivoNome: d.arquivo,
        })),
      )
    } catch (e) {
      setDocumentos([])
    }

    setView('form')
  }

  const handleDuplicate = (item: any) => {
    handleEdit(item).then(() => {
      setFormData((prev) => ({
        ...prev,
        id: '',
        documento: '',
        fantasia: prev.fantasia ? `${prev.fantasia} (Cópia)` : '',
        dt_cad: new Date().toLocaleString('pt-BR'),
      }))
      setDocumentos([])
    })
  }

  const toggleAll = () =>
    setSelected(selected.length === data.length && data.length > 0 ? [] : data.map((d) => d.id))
  const toggleOne = (id: string) =>
    setSelected((p) => (p.includes(id) ? p.filter((i) => i !== id) : [...p, id]))

  const handleDelete = async () => {
    try {
      await Promise.all(selected.map((id) => deleteCliente(id)))
      setSelected([])
      toast({ title: 'Registros excluídos com sucesso' })
    } catch (e) {
      toast({ title: 'Erro ao excluir', variant: 'destructive' })
    }
  }

  const saveDocuments = async (clienteId: string) => {
    for (const doc of documentos) {
      if (doc.deleted && doc.id) {
        await deleteDocumentoCliente(doc.id)
      } else if (doc.file && !doc.deleted) {
        const fd = new FormData()
        fd.append('cliente', clienteId)
        fd.append('tipo', doc.tipo)
        fd.append('arquivo', doc.file)
        await createDocumentoCliente(fd)
      }
    }
  }

  const handleSave = async () => {
    try {
      setIsSubmitting(true)
      setFieldErrors({})
      if (!formData.documento) throw new Error('CPF/CNPJ é obrigatório')
      if (!formData.fantasia) throw new Error('Nome Fantasia é obrigatório')

      const dataToSave = {
        ...formData,
        contatos_adicionais: contatos.map(({ id, ...rest }) => rest),
        atualizado_por: pb.authStore.record?.id,
      }

      let clienteId = formData.id

      if (clienteId) {
        await updateCliente(clienteId, dataToSave)
      } else {
        const existing = await getByDocumento('clientes', formData.documento)
        if (existing) {
          setConflictRecord(existing)
          setIsConflictOpen(true)
          setIsSubmitting(false)
          return
        }
        const created = await createCliente(dataToSave)
        clienteId = created.id
      }

      await saveDocuments(clienteId)

      toast({ title: 'Registro salvo com sucesso' })
      resetForm()
      setView('list')
    } catch (err: any) {
      const errs = extractFieldErrors(err)
      if (Object.keys(errs).length > 0) {
        setFieldErrors(errs)
        toast({ title: 'Verifique os campos com erro', variant: 'destructive' })
      } else {
        toast({ title: err.message || 'Erro ao salvar', variant: 'destructive' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReplace = async () => {
    try {
      setIsSubmitting(true)
      setFieldErrors({})
      await updateCliente(conflictRecord.id, {
        ...formData,
        contatos_adicionais: contatos.map(({ id, ...rest }) => rest),
        atualizado_por: pb.authStore.record?.id,
      })
      await saveDocuments(conflictRecord.id)
      setIsConflictOpen(false)
      resetForm()
      setView('list')
      toast({ title: 'Registro substituído com sucesso' })
    } catch (err: any) {
      const errs = extractFieldErrors(err)
      if (Object.keys(errs).length > 0) {
        setFieldErrors(errs)
        setIsConflictOpen(false)
        toast({ title: 'Verifique os campos com erro', variant: 'destructive' })
      } else {
        toast({ title: 'Erro ao substituir', variant: 'destructive' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMerge = async () => {
    try {
      setIsSubmitting(true)
      setFieldErrors({})
      const mergedData = { ...conflictRecord }
      for (const [key, value] of Object.entries(formData)) {
        if (value && String(value).trim() !== '' && key !== 'id') {
          mergedData[key] = value
        }
      }
      mergedData.contatos_adicionais = contatos.map(({ id, ...rest }) => rest)
      mergedData.atualizado_por = pb.authStore.record?.id

      await updateCliente(conflictRecord.id, mergedData)
      await saveDocuments(conflictRecord.id)
      setIsConflictOpen(false)
      resetForm()
      setView('list')
      toast({ title: 'Registros mesclados com sucesso' })
    } catch (err: any) {
      const errs = extractFieldErrors(err)
      if (Object.keys(errs).length > 0) {
        setFieldErrors(errs)
        setIsConflictOpen(false)
        toast({ title: 'Verifique os campos com erro', variant: 'destructive' })
      } else {
        toast({ title: 'Erro ao mesclar', variant: 'destructive' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const fetchCep = async (cepValue: string) => {
    const cleanCep = cepValue.replace(/\D/g, '')
    if (cleanCep.length !== 8) return

    setIsFetchingCep(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
      const data = await response.json()

      if (!data.erro) {
        setFormData((prev) => ({
          ...prev,
          logradouro: data.logradouro || prev.logradouro,
          bairro: data.bairro || prev.bairro,
          cidade: data.localidade || prev.cidade,
          estado: data.uf || prev.estado,
        }))
        toast({ title: 'Endereço preenchido automaticamente' })
      } else {
        toast({ title: 'CEP não encontrado', variant: 'destructive' })
      }
    } catch (error) {
      toast({ title: 'Erro ao buscar CEP', variant: 'destructive' })
    } finally {
      setIsFetchingCep(false)
    }
  }

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '')
    if (v.length > 5) v = v.replace(/^(\d{5})(\d)/, '$1-$2')
    const maskedCep = v.substring(0, 9)
    setFormData({ ...formData, cep: maskedCep })

    if (v.replace(/\D/g, '').length === 8) {
      fetchCep(v)
    }
  }

  return (
    <PageLayout title="Clientes" icon={UserCircle}>
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            {view === 'list' ? (
              <>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar clientes..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 w-[250px] md:w-[350px] bg-background"
                  />
                </div>
                <Button
                  onClick={() => {
                    resetForm()
                    setView('form')
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" /> Novo Cliente
                </Button>
                {selected.length > 0 && (
                  <Button variant="destructive" onClick={() => setIsDeleteOpen(true)}>
                    <Trash2 className="h-4 w-4 mr-2" /> Excluir ({selected.length})
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setView('list')}>
                  <ChevronLeft className="h-4 w-4 mr-2" /> Voltar
                </Button>
                <Button onClick={handleSave} disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Salvar
                </Button>
              </>
            )}
          </div>

          {view === 'list' && (
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground mr-2">
                {totalItems > 0 ? Math.min((page - 1) * perPage + 1, totalItems) : 0} -{' '}
                {Math.min(page * perPage, totalItems)} de {totalItems.toLocaleString('pt-BR')}
              </div>
              <Select
                value={String(perPage)}
                onValueChange={(val) => {
                  setPerPage(Number(val))
                  setPage(1)
                }}
              >
                <SelectTrigger className="w-[70px] h-9 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 bg-background"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm px-2 font-medium">
                  {page} / {totalPages || 1}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 bg-background"
                  disabled={page >= totalPages || totalPages === 0}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {view === 'list' ? (
          <Card className="shadow-sm">
            <div className="overflow-x-auto min-h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selected.length === data.length && data.length > 0}
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead>Nome Fantasia</TableHead>
                    <TableHead>Razão Social</TableHead>
                    <TableHead>CPF/CNPJ</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Checkbox
                          checked={selected.includes(item.id)}
                          onCheckedChange={() => toggleOne(item.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium text-foreground">{item.fantasia}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.razao_social || '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.documento || '-'}
                      </TableCell>
                      <TableCell>
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
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(item)}>
                                <Pencil className="h-4 w-4 mr-2" /> Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDuplicate(item)}>
                                <Copy className="h-4 w-4 mr-2" /> Duplicar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {data.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        Nenhum cliente encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        ) : (
          <div className="space-y-6 pb-12">
            <Card className="shadow-sm bg-card">
              <CardHeader className="border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Dados Cadastrais
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
                <div className="space-y-2">
                  <Label className={fieldErrors.documento ? 'text-destructive' : ''}>
                    CPF/CNPJ
                  </Label>
                  <Input
                    value={formData.documento}
                    onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
                    placeholder="000.000.000-00 ou 00.000.000/0000-00"
                    className={fieldErrors.documento ? 'border-destructive' : ''}
                  />
                  {fieldErrors.documento && (
                    <p className="text-sm text-destructive">{fieldErrors.documento}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className={fieldErrors.status ? 'text-destructive' : ''}>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v) => setFormData({ ...formData, status: v })}
                  >
                    <SelectTrigger className={fieldErrors.status ? 'border-destructive' : ''}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldErrors.status && (
                    <p className="text-sm text-destructive">{fieldErrors.status}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Data de Cadastro</Label>
                  <Input value={formData.dt_cad} readOnly className="bg-muted" />
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <Label className={fieldErrors.razao_social ? 'text-destructive' : ''}>
                    Razão Social
                  </Label>
                  <Input
                    value={formData.razao_social}
                    onChange={(e) => setFormData({ ...formData, razao_social: e.target.value })}
                    className={fieldErrors.razao_social ? 'border-destructive' : ''}
                  />
                  {fieldErrors.razao_social && (
                    <p className="text-sm text-destructive">{fieldErrors.razao_social}</p>
                  )}
                </div>
                <div className="space-y-2 lg:col-span-1">
                  <Label className={fieldErrors.fantasia ? 'text-destructive' : ''}>
                    Nome Fantasia
                  </Label>
                  <Input
                    value={formData.fantasia}
                    onChange={(e) => setFormData({ ...formData, fantasia: e.target.value })}
                    className={fieldErrors.fantasia ? 'border-destructive' : ''}
                  />
                  {fieldErrors.fantasia && (
                    <p className="text-sm text-destructive">{fieldErrors.fantasia}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm bg-card">
              <CardHeader className="border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  Contato
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-6">
                <div className="space-y-2">
                  <Label className={fieldErrors.contato ? 'text-destructive' : ''}>
                    Nome do Contato Principal
                  </Label>
                  <Input
                    value={formData.contato}
                    onChange={(e) => setFormData({ ...formData, contato: e.target.value })}
                    className={fieldErrors.contato ? 'border-destructive' : ''}
                  />
                  {fieldErrors.contato && (
                    <p className="text-sm text-destructive">{fieldErrors.contato}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className={fieldErrors.email ? 'text-destructive' : ''}>
                    E-mail Principal
                  </Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={fieldErrors.email ? 'border-destructive' : ''}
                  />
                  {fieldErrors.email && (
                    <p className="text-sm text-destructive">{fieldErrors.email}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className={fieldErrors.email_fiscal ? 'text-destructive' : ''}>
                    E-mail Fiscal
                  </Label>
                  <Input
                    type="email"
                    value={formData.email_fiscal}
                    onChange={(e) => setFormData({ ...formData, email_fiscal: e.target.value })}
                    className={fieldErrors.email_fiscal ? 'border-destructive' : ''}
                  />
                  {fieldErrors.email_fiscal && (
                    <p className="text-sm text-destructive">{fieldErrors.email_fiscal}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className={fieldErrors.telefone ? 'text-destructive' : ''}>
                    Telefone 1
                  </Label>
                  <Input
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    className={fieldErrors.telefone ? 'border-destructive' : ''}
                  />
                  {fieldErrors.telefone && (
                    <p className="text-sm text-destructive">{fieldErrors.telefone}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className={fieldErrors.telefone_2 ? 'text-destructive' : ''}>
                    Telefone 2
                  </Label>
                  <Input
                    value={formData.telefone_2}
                    onChange={(e) => setFormData({ ...formData, telefone_2: e.target.value })}
                    className={fieldErrors.telefone_2 ? 'border-destructive' : ''}
                  />
                  {fieldErrors.telefone_2 && (
                    <p className="text-sm text-destructive">{fieldErrors.telefone_2}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className={fieldErrors.telefone_3 ? 'text-destructive' : ''}>
                    Telefone 3
                  </Label>
                  <Input
                    value={formData.telefone_3}
                    onChange={(e) => setFormData({ ...formData, telefone_3: e.target.value })}
                    className={fieldErrors.telefone_3 ? 'border-destructive' : ''}
                  />
                  {fieldErrors.telefone_3 && (
                    <p className="text-sm text-destructive">{fieldErrors.telefone_3}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className={fieldErrors.celular ? 'text-destructive' : ''}>Celular</Label>
                  <Input
                    value={formData.celular}
                    onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                    className={fieldErrors.celular ? 'border-destructive' : ''}
                  />
                  {fieldErrors.celular && (
                    <p className="text-sm text-destructive">{fieldErrors.celular}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm bg-card">
              <CardHeader className="border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Localização
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
                <div className="space-y-2">
                  <Label className={fieldErrors.cep ? 'text-destructive' : ''}>CEP</Label>
                  <div className="relative">
                    <Input
                      value={formData.cep}
                      onChange={handleCepChange}
                      placeholder="00000-000"
                      disabled={isFetchingCep}
                      className={fieldErrors.cep ? 'border-destructive' : ''}
                    />
                    {isFetchingCep && (
                      <Loader2 className="h-4 w-4 animate-spin absolute right-3 top-2.5 text-muted-foreground" />
                    )}
                  </div>
                  {fieldErrors.cep && <p className="text-sm text-destructive">{fieldErrors.cep}</p>}
                </div>
                <div className="space-y-2">
                  <Label className={fieldErrors.estado ? 'text-destructive' : ''}>Estado</Label>
                  <Input
                    value={formData.estado}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                    className={fieldErrors.estado ? 'border-destructive' : ''}
                  />
                  {fieldErrors.estado && (
                    <p className="text-sm text-destructive">{fieldErrors.estado}</p>
                  )}
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <Label className={fieldErrors.cidade ? 'text-destructive' : ''}>Cidade</Label>
                  <Input
                    value={formData.cidade}
                    onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                    className={fieldErrors.cidade ? 'border-destructive' : ''}
                  />
                  {fieldErrors.cidade && (
                    <p className="text-sm text-destructive">{fieldErrors.cidade}</p>
                  )}
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <Label className={fieldErrors.logradouro ? 'text-destructive' : ''}>
                    Logradouro
                  </Label>
                  <Input
                    value={formData.logradouro}
                    onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
                    className={fieldErrors.logradouro ? 'border-destructive' : ''}
                  />
                  {fieldErrors.logradouro && (
                    <p className="text-sm text-destructive">{fieldErrors.logradouro}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className={fieldErrors.numero ? 'text-destructive' : ''}>Número</Label>
                  <Input
                    value={formData.numero}
                    onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                    className={fieldErrors.numero ? 'border-destructive' : ''}
                  />
                  {fieldErrors.numero && (
                    <p className="text-sm text-destructive">{fieldErrors.numero}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className={fieldErrors.complementos ? 'text-destructive' : ''}>
                    Complementos
                  </Label>
                  <Input
                    value={formData.complementos}
                    onChange={(e) => setFormData({ ...formData, complementos: e.target.value })}
                    className={fieldErrors.complementos ? 'border-destructive' : ''}
                  />
                  {fieldErrors.complementos && (
                    <p className="text-sm text-destructive">{fieldErrors.complementos}</p>
                  )}
                </div>
                <div className="space-y-2 lg:col-span-2">
                  <Label className={fieldErrors.bairro ? 'text-destructive' : ''}>Bairro</Label>
                  <Input
                    value={formData.bairro}
                    onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                    className={fieldErrors.bairro ? 'border-destructive' : ''}
                  />
                  {fieldErrors.bairro && (
                    <p className="text-sm text-destructive">{fieldErrors.bairro}</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm bg-card">
              <CardHeader className="border-b flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserCircle className="h-5 w-5 text-primary" />
                  Contatos Adicionais
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setContatos([
                      ...contatos,
                      {
                        id: crypto.randomUUID(),
                        nome: '',
                        telefone: '',
                        email: '',
                        observacoes: '',
                      },
                    ])
                  }
                >
                  <Plus className="h-4 w-4 mr-2" /> Adicionar
                </Button>
              </CardHeader>
              <CardContent className="pt-6">
                {contatos.length === 0 ? (
                  <p className="text-muted-foreground text-sm italic">Nenhum contato adicional.</p>
                ) : (
                  <div className="space-y-4">
                    {contatos.map((c, i) => (
                      <div
                        key={c.id}
                        className="grid grid-cols-1 md:grid-cols-[2fr_1fr_2fr_3fr_auto] gap-4 items-end bg-card p-4 rounded-lg border"
                      >
                        <div className="space-y-2">
                          <Label className="text-xs">Nome</Label>
                          <Input
                            value={c.nome}
                            onChange={(e) => {
                              const n = [...contatos]
                              n[i].nome = e.target.value
                              setContatos(n)
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Telefone</Label>
                          <Input
                            value={c.telefone}
                            onChange={(e) => {
                              const n = [...contatos]
                              n[i].telefone = e.target.value
                              setContatos(n)
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">E-mail</Label>
                          <Input
                            value={c.email}
                            onChange={(e) => {
                              const n = [...contatos]
                              n[i].email = e.target.value
                              setContatos(n)
                            }}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Observações</Label>
                          <Input
                            value={c.observacoes}
                            onChange={(e) => {
                              const n = [...contatos]
                              n[i].observacoes = e.target.value
                              setContatos(n)
                            }}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => setContatos(contatos.filter((_, idx) => idx !== i))}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-sm bg-card">
              <CardHeader className="border-b flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Documentos
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDocumentos([...documentos, { tipo: 'Tipo do Documento' }])}
                >
                  <Plus className="h-4 w-4 mr-2" /> Adicionar
                </Button>
              </CardHeader>
              <CardContent className="pt-6">
                {documentos.filter((d) => !d.deleted).length === 0 ? (
                  <p className="text-muted-foreground text-sm italic">Nenhum documento anexado.</p>
                ) : (
                  <div className="space-y-4">
                    {documentos.map((d, i) => {
                      if (d.deleted) return null
                      return (
                        <div
                          key={d.id || i}
                          className="grid grid-cols-1 md:grid-cols-[1fr_2fr_auto] gap-4 items-end bg-card p-4 rounded-lg border"
                        >
                          <div className="space-y-2">
                            <Label className="text-xs">Tipo do Documento</Label>
                            <Select
                              value={d.tipo}
                              onValueChange={(val) => {
                                const n = [...documentos]
                                n[i].tipo = val
                                setDocumentos(n)
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Tipo do Documento" disabled>
                                  Tipo do Documento
                                </SelectItem>
                                <SelectItem value="Contrato Social">Contrato Social</SelectItem>
                                <SelectItem value="Comprovante de Endereço">
                                  Comprovante de Endereço
                                </SelectItem>
                                <SelectItem value="Documento Pessoal">Documento Pessoal</SelectItem>
                                <SelectItem value="Outros">Outros</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Arquivo (.pdf, .jpg)</Label>
                            <div className="flex items-center h-10">
                              {d.arquivoNome && !d.file ? (
                                <div className="flex items-center justify-between w-full border border-input rounded-md px-3 h-full bg-background">
                                  <a
                                    href={d.arquivoUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-primary text-sm hover:underline flex items-center gap-2 truncate"
                                  >
                                    <FileText size={16} className="shrink-0" />
                                    {d.arquivoNome}
                                  </a>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 px-2 ml-2"
                                    onClick={() => {
                                      const n = [...documentos]
                                      n[i].file = null
                                      n[i].arquivoNome = ''
                                      setDocumentos(n)
                                    }}
                                  >
                                    Trocar
                                  </Button>
                                </div>
                              ) : (
                                <Input
                                  type="file"
                                  accept=".pdf,.jpg,.jpeg,.png"
                                  className="cursor-pointer file:cursor-pointer"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0]
                                    if (file) {
                                      const n = [...documentos]
                                      n[i].file = file
                                      setDocumentos(n)
                                    }
                                  }}
                                />
                              )}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              const n = [...documentos]
                              n[i].deleted = true
                              setDocumentos(n)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <DeleteConfirmModal
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        count={selected.length}
        onConfirm={handleDelete}
      />
      <DuplicateConflictDialog
        open={isConflictOpen}
        onOpenChange={setIsConflictOpen}
        onReplace={handleReplace}
        onMerge={handleMerge}
        isSubmitting={isSubmitting}
      />
    </PageLayout>
  )
}
