import { useState, useEffect } from 'react'
import { User, Loader2, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { RegistrationActionBar } from '@/components/RegistrationActionBar'
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal'
import {
  getGerentes,
  createGerente,
  updateGerente,
  deleteGerente,
  getByDocumento,
} from '@/services/cadastros'
import { getUsuarios, Usuario } from '@/services/usuarios'
import { DuplicateConflictDialog } from '@/components/DuplicateConflictDialog'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'

export default function Gerentes() {
  const [data, setData] = useState<any[]>([])
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [conflictRecord, setConflictRecord] = useState<any>(null)
  const [isConflictOpen, setIsConflictOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'registros' | 'cadastro'>('registros')

  const [formData, setFormData] = useState({
    id: '',
    nome: '',
    documento: '',
    email: '',
    telefone: '',
    status: 'Ativo',
    cargo: '',
    rd_station_id: '',
    usuario: '',
    created: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()

  const loadData = async () => setData(await getGerentes().catch(() => []))
  const loadUsuarios = async () => setUsuarios(await getUsuarios().catch(() => []))

  useEffect(() => {
    loadData()
    loadUsuarios()
  }, [])
  useRealtime('gerentes', loadData)

  const filtered = data.filter((d) => d.nome?.toLowerCase().includes(search.toLowerCase()))
  const toggleAll = () =>
    setSelected(
      selected.length === filtered.length && filtered.length > 0 ? [] : filtered.map((d) => d.id),
    )
  const toggleOne = (id: string) =>
    setSelected((p) => (p.includes(id) ? p.filter((i) => i !== id) : [...p, id]))

  const handleDelete = async () => {
    try {
      await Promise.all(selected.map((id) => deleteGerente(id)))
      setSelected([])
      toast({ title: 'Registros excluídos' })
    } catch (e) {
      toast({ title: 'Erro ao excluir', variant: 'destructive' })
    }
  }

  const resetForm = () => {
    setFormData({
      id: '',
      nome: '',
      documento: '',
      email: '',
      telefone: '',
      status: 'Ativo',
      cargo: '',
      rd_station_id: '',
      usuario: '',
      created: '',
    })
    setConflictRecord(null)
    setErrors({})
  }

  const handleNewClick = () => {
    resetForm()
    setActiveTab('cadastro')
  }

  const handleEdit = (item: any) => {
    setFormData({
      id: item.id,
      nome: item.nome || '',
      documento: item.documento || '',
      email: item.email || '',
      telefone: item.telefone || '',
      status: item.status || 'Ativo',
      cargo: item.cargo || '',
      rd_station_id: item.rd_station_id || '',
      usuario: item.usuario || '',
      created: item.created || '',
    })
    setErrors({})
    setActiveTab('cadastro')
  }

  const handleSave = async () => {
    try {
      setIsSubmitting(true)
      setErrors({})

      const newErrors: Record<string, string> = {}
      if (!formData.nome) newErrors.nome = 'Obrigatório'
      if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email inválido'

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors)
        setIsSubmitting(false)
        return toast({ title: 'Verifique os campos destacados', variant: 'destructive' })
      }

      if (formData.documento) {
        const existing = await getByDocumento('gerentes', formData.documento)
        if (existing && existing.id !== formData.id) {
          setConflictRecord(existing)
          setIsConflictOpen(true)
          setIsSubmitting(false)
          return
        }
      }

      const payload = {
        nome: formData.nome,
        documento: formData.documento,
        email: formData.email,
        telefone: formData.telefone,
        status: formData.status,
        cargo: formData.cargo,
        rd_station_id: formData.rd_station_id,
        usuario: formData.usuario || null,
      }

      if (formData.id) {
        await updateGerente(formData.id, payload)
        toast({ title: 'Registro atualizado' })
      } else {
        await createGerente(payload)
        toast({ title: 'Registro criado' })
      }
      resetForm()
      setActiveTab('registros')
    } catch (err) {
      const fieldErrs = extractFieldErrors(err)
      const errMsg = getErrorMessage(err)
      if (errMsg.includes('RD Station ID inválido')) {
        setErrors({
          ...fieldErrs,
          rd_station_id:
            'RD Station ID inválido ou não encontrado. Por favor, verifique o identificador no RD Station.',
        })
        toast({
          title: 'RD Station ID inválido ou não encontrado',
          description: 'Por favor, verifique o identificador no RD Station.',
          variant: 'destructive',
        })
      } else {
        setErrors(fieldErrs)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReplace = async () => {
    try {
      setIsSubmitting(true)
      const payload = {
        nome: formData.nome,
        documento: formData.documento,
        email: formData.email,
        telefone: formData.telefone,
        status: formData.status,
        cargo: formData.cargo,
        rd_station_id: formData.rd_station_id,
        usuario: formData.usuario || null,
      }
      await updateGerente(conflictRecord.id, payload)
      setIsConflictOpen(false)
      resetForm()
      setActiveTab('registros')
      toast({ title: 'Registro substituído com sucesso' })
    } catch (err) {
      const errMsg = getErrorMessage(err)
      if (errMsg.includes('RD Station ID inválido')) {
        setErrors({
          rd_station_id:
            'RD Station ID inválido ou não encontrado. Por favor, verifique o identificador no RD Station.',
        })
        toast({
          title: 'RD Station ID inválido ou não encontrado',
          description: 'Por favor, verifique o identificador no RD Station.',
          variant: 'destructive',
        })
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
      const mergedData = { ...conflictRecord }
      const payload: any = {
        nome: formData.nome,
        documento: formData.documento,
        email: formData.email,
        telefone: formData.telefone,
        status: formData.status,
        cargo: formData.cargo,
        rd_station_id: formData.rd_station_id,
        usuario: formData.usuario || null,
      }
      for (const [key, value] of Object.entries(payload)) {
        if (value !== undefined && value !== null && String(value).trim() !== '') {
          mergedData[key] = value
        }
      }

      await updateGerente(conflictRecord.id, mergedData)
      setIsConflictOpen(false)
      resetForm()
      setActiveTab('registros')
      toast({ title: 'Registros mesclados com sucesso' })
    } catch (err) {
      const errMsg = getErrorMessage(err)
      if (errMsg.includes('RD Station ID inválido')) {
        setErrors({
          rd_station_id:
            'RD Station ID inválido ou não encontrado. Por favor, verifique o identificador no RD Station.',
        })
        toast({
          title: 'RD Station ID inválido ou não encontrado',
          description: 'Por favor, verifique o identificador no RD Station.',
          variant: 'destructive',
        })
      } else {
        toast({ title: 'Erro ao mesclar', variant: 'destructive' })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const formattedDate = formData.created
    ? new Date(formData.created).toLocaleDateString('pt-BR')
    : new Date().toLocaleDateString('pt-BR')

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-2 mb-3 text-gray-800">
        <User className="h-6 w-6" />
        <h1 className="text-xl font-semibold">Gerentes</h1>
      </div>
      <div className="h-[2px] bg-[#3b82f6] w-full mb-6"></div>

      <RegistrationActionBar
        onSearchToggle={() => setShowSearch(!showSearch)}
        onNewClick={handleNewClick}
        onDeleteClick={() =>
          selected.length > 0 ? setIsDeleteOpen(true) : toast({ title: 'Selecione registros' })
        }
        showSearch={showSearch}
        searchQuery={search}
        onSearchChange={setSearch}
      />

      <div className="flex justify-between items-end border-b border-gray-200 mb-0">
        <div className="flex">
          <button
            onClick={() => setActiveTab('registros')}
            className={`px-6 py-2.5 text-sm font-medium ${
              activeTab === 'registros'
                ? 'bg-white border border-b-0 border-gray-200 border-t-2 border-t-[#3b82f6] text-gray-700'
                : 'text-[#3b82f6] hover:bg-gray-50/50'
            }`}
          >
            Registros
          </button>
          <button
            onClick={() => setActiveTab('cadastro')}
            className={`px-6 py-2.5 text-sm font-medium ${
              activeTab === 'cadastro'
                ? 'bg-white border border-b-0 border-gray-200 border-t-2 border-t-[#3b82f6] text-gray-700'
                : 'text-[#3b82f6] hover:bg-gray-50/50'
            }`}
          >
            Cadastro
          </button>
        </div>
        {activeTab === 'registros' && (
          <div className="pb-2 text-sm text-gray-600">Total: {filtered.length}</div>
        )}
      </div>

      {activeTab === 'registros' ? (
        <div className="bg-white border border-t-0 border-gray-200">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">
                  <Checkbox
                    checked={selected.length === filtered.length && filtered.length > 0}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead className="font-medium">Nome</TableHead>
                <TableHead className="font-medium">Cargo</TableHead>
                <TableHead className="font-medium">CPF/CNPJ</TableHead>
                <TableHead className="font-medium">Email</TableHead>
                <TableHead className="font-medium">Celular</TableHead>
                <TableHead className="font-medium">Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id} className="hover:bg-slate-50 border-b-gray-100">
                  <TableCell className="text-center">
                    <Checkbox
                      checked={selected.includes(item.id)}
                      onCheckedChange={() => toggleOne(item.id)}
                    />
                  </TableCell>
                  <TableCell className="py-3 font-medium text-gray-700">{item.nome}</TableCell>
                  <TableCell className="text-gray-600">{item.cargo}</TableCell>
                  <TableCell className="text-gray-600">{item.documento}</TableCell>
                  <TableCell className="text-gray-600">{item.email}</TableCell>
                  <TableCell className="text-gray-600">{item.telefone}</TableCell>
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
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                      <Edit2 className="h-4 w-4 text-gray-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="bg-white p-6 border border-t-0 border-gray-200">
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-1 space-y-1">
                <Label
                  className={`text-[11px] uppercase tracking-wide ${
                    errors.nome ? 'text-red-500' : 'text-[#3b82f6]'
                  }`}
                >
                  Nome
                </Label>
                <Input
                  className={`border-0 border-b-2 rounded-none px-0 shadow-none focus-visible:ring-0 bg-transparent ${
                    errors.nome ? 'border-red-500' : 'border-[#3b82f6]'
                  }`}
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
                {errors.nome && <span className="text-[10px] text-red-500">{errors.nome}</span>}
              </div>
              <div className="w-full sm:w-1/4 space-y-1">
                <Label className="text-[11px] uppercase tracking-wide text-gray-500">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger className="border-0 border-b border-gray-300 rounded-none px-0 shadow-none focus:ring-0 focus:border-[#3b82f6] bg-transparent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-1 space-y-1">
                <Label
                  className={`text-[11px] uppercase tracking-wide ${
                    errors.cargo ? 'text-red-500' : 'text-gray-500'
                  }`}
                >
                  Cargo
                </Label>
                <Input
                  className={`border-0 border-b rounded-none px-0 shadow-none focus-visible:ring-0 bg-transparent ${
                    errors.cargo
                      ? 'border-red-500'
                      : 'border-gray-300 focus-visible:border-[#3b82f6]'
                  }`}
                  value={formData.cargo}
                  onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                />
                {errors.cargo && <span className="text-[10px] text-red-500">{errors.cargo}</span>}
              </div>
              <div className="flex-1 space-y-1">
                <Label
                  className={`text-[11px] uppercase tracking-wide ${
                    errors.email ? 'text-red-500' : 'text-gray-500'
                  }`}
                >
                  Email
                </Label>
                <Input
                  type="email"
                  className={`border-0 border-b rounded-none px-0 shadow-none focus-visible:ring-0 bg-transparent ${
                    errors.email
                      ? 'border-red-500'
                      : 'border-gray-300 focus-visible:border-[#3b82f6]'
                  }`}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                {errors.email && <span className="text-[10px] text-red-500">{errors.email}</span>}
              </div>
              <div className="flex-1 space-y-1">
                <Label className="text-[11px] uppercase tracking-wide text-gray-500">Celular</Label>
                <Input
                  className="border-0 border-b border-gray-300 rounded-none px-0 shadow-none focus-visible:ring-0 focus-visible:border-[#3b82f6] bg-transparent"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                />
              </div>
              <div className="flex-1 space-y-1">
                <Label
                  className={`text-[11px] uppercase tracking-wide ${
                    errors.rd_station_id ? 'text-red-500' : 'text-gray-500'
                  }`}
                >
                  RD Station ID
                </Label>
                <Input
                  className={`border-0 border-b rounded-none px-0 shadow-none focus-visible:ring-0 bg-transparent ${
                    errors.rd_station_id
                      ? 'border-red-500'
                      : 'border-gray-300 focus-visible:border-[#3b82f6]'
                  }`}
                  value={formData.rd_station_id}
                  onChange={(e) => setFormData({ ...formData, rd_station_id: e.target.value })}
                />
                {errors.rd_station_id ? (
                  <span className="text-[10px] text-red-500">{errors.rd_station_id}</span>
                ) : (
                  <span className="text-[10px] text-gray-400">
                    O ID será validado no RD Station ao salvar.
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-[3] space-y-1">
                <Label
                  className={`text-[11px] uppercase tracking-wide ${
                    errors.usuario ? 'text-red-500' : 'text-gray-500'
                  }`}
                >
                  Usuário
                </Label>
                <Select
                  value={formData.usuario || 'none'}
                  onValueChange={(val) =>
                    setFormData({ ...formData, usuario: val === 'none' ? '' : val })
                  }
                >
                  <SelectTrigger
                    className={`border-0 border-b rounded-none px-0 shadow-none focus:ring-0 bg-transparent ${
                      errors.usuario ? 'border-red-500' : 'border-gray-300 focus:border-[#3b82f6]'
                    }`}
                  >
                    <SelectValue placeholder="Selecione um usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {usuarios.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} ({u.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.usuario && (
                  <span className="text-[10px] text-red-500">{errors.usuario}</span>
                )}
              </div>
              <div className="flex-1 space-y-1">
                <Label
                  className={`text-[11px] uppercase tracking-wide ${
                    errors.documento ? 'text-red-500' : 'text-gray-500'
                  }`}
                >
                  CPF/CNPJ
                </Label>
                <Input
                  className={`border-0 border-b rounded-none px-0 shadow-none focus-visible:ring-0 bg-transparent ${
                    errors.documento
                      ? 'border-red-500'
                      : 'border-gray-300 focus-visible:border-[#3b82f6]'
                  }`}
                  value={formData.documento}
                  onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
                />
                {errors.documento && (
                  <span className="text-[10px] text-red-500">{errors.documento}</span>
                )}
              </div>
            </div>

            <div className="flex gap-6">
              <div className="w-full sm:w-1/4 space-y-1">
                <Label className="text-[11px] uppercase tracking-wide text-gray-500">Dt. Cad</Label>
                <Input
                  disabled
                  className="bg-gray-100 border-0 rounded-none text-gray-600 h-9"
                  value={formattedDate}
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end items-center gap-3">
              {isSubmitting && (
                <span className="text-sm text-gray-500 animate-pulse">
                  Validando RD Station ID...
                </span>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  resetForm()
                  setActiveTab('registros')
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  )
}
