import { useState, useEffect } from 'react'
import {
  UserCircle,
  Loader2,
  Pencil,
  Copy,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetDescription,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal'
import {
  getClientes,
  createCliente,
  updateCliente,
  deleteCliente,
  getByDocumento,
} from '@/services/cadastros'
import { DuplicateConflictDialog } from '@/components/DuplicateConflictDialog'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

export default function Clientes() {
  const [data, setData] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [conflictRecord, setConflictRecord] = useState<any>(null)
  const [isConflictOpen, setIsConflictOpen] = useState(false)

  const [formData, setFormData] = useState({
    id: '',
    fantasia: '',
    documento: '',
    contato: '',
    telefone: '',
    celular: '',
    email: '',
    dt_cad: new Date().toISOString().split('T')[0],
    status: 'Ativo',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()

  const loadData = async () => setData(await getClientes().catch(() => []))
  useEffect(() => {
    loadData()
  }, [])
  useRealtime('clientes', loadData)

  const filtered = data.filter(
    (d) =>
      d.fantasia?.toLowerCase().includes(search.toLowerCase()) ||
      d.contato?.toLowerCase().includes(search.toLowerCase()),
  )

  const resetForm = () => {
    setFormData({
      id: '',
      fantasia: '',
      documento: '',
      contato: '',
      telefone: '',
      celular: '',
      email: '',
      dt_cad: new Date().toISOString().split('T')[0],
      status: 'Ativo',
    })
    setConflictRecord(null)
    setErrors({})
  }

  const handleEdit = (item: any) => {
    setFormData({
      id: item.id,
      fantasia: item.fantasia || '',
      documento: item.documento || '',
      contato: item.contato || '',
      telefone: item.telefone || '',
      celular: item.celular || '',
      email: item.email || '',
      dt_cad: item.dt_cad
        ? item.dt_cad.split('/').reverse().join('-')
        : new Date().toISOString().split('T')[0],
      status: item.status || 'Ativo',
    })
    setIsCreateOpen(true)
  }

  const handleDuplicate = (item: any) => {
    setFormData({
      id: '',
      fantasia: item.fantasia ? `${item.fantasia} (Cópia)` : '',
      documento: '',
      contato: item.contato || '',
      telefone: item.telefone || '',
      celular: item.celular || '',
      email: item.email || '',
      dt_cad: new Date().toISOString().split('T')[0],
      status: 'Ativo',
    })
    setIsCreateOpen(true)
  }

  const toggleAll = () =>
    setSelected(
      selected.length === filtered.length && filtered.length > 0 ? [] : filtered.map((d) => d.id),
    )
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

  const handleSave = async () => {
    try {
      setIsSubmitting(true)
      setErrors({})

      const dataToSave = {
        ...formData,
        dt_cad: formData.dt_cad ? formData.dt_cad.split('-').reverse().join('/') : '',
      }

      if (formData.id) {
        await updateCliente(formData.id, dataToSave)
        toast({ title: 'Registro atualizado com sucesso' })
        setIsCreateOpen(false)
        resetForm()
      } else {
        if (formData.documento) {
          const existing = await getByDocumento('clientes', formData.documento)
          if (existing) {
            setConflictRecord(existing)
            setIsConflictOpen(true)
            setIsSubmitting(false)
            return
          }
        }
        await createCliente(dataToSave)
        toast({ title: 'Registro criado com sucesso' })
        setIsCreateOpen(false)
        resetForm()
      }
    } catch (err) {
      setErrors(extractFieldErrors(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReplace = async () => {
    try {
      setIsSubmitting(true)
      await updateCliente(conflictRecord.id, {
        ...formData,
        dt_cad: formData.dt_cad ? formData.dt_cad.split('-').reverse().join('/') : '',
      })
      setIsConflictOpen(false)
      setIsCreateOpen(false)
      resetForm()
      toast({ title: 'Registro substituído com sucesso' })
    } catch (err) {
      toast({ title: 'Erro ao substituir', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleMerge = async () => {
    try {
      setIsSubmitting(true)
      const formattedFormData = {
        ...formData,
        dt_cad: formData.dt_cad ? formData.dt_cad.split('-').reverse().join('/') : '',
      }

      const mergedData = { ...conflictRecord }
      for (const [key, value] of Object.entries(formattedFormData)) {
        if (value !== undefined && value !== null && String(value).trim() !== '' && key !== 'id') {
          mergedData[key] = value
        }
      }

      await updateCliente(conflictRecord.id, mergedData)
      setIsConflictOpen(false)
      setIsCreateOpen(false)
      resetForm()
      toast({ title: 'Registros mesclados com sucesso' })
    } catch (err) {
      toast({ title: 'Erro ao mesclar', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const Toolbar = () => (
    <div className="flex justify-between items-center bg-white p-2 border-b border-slate-200">
      <div className="flex gap-1.5">
        <Button
          className="bg-brand-green hover:bg-brand-green/90 text-white rounded h-8 px-4 text-xs font-bold shadow-sm transition-colors"
          onClick={() => setShowSearch(!showSearch)}
        >
          PESQUISAR
        </Button>
        <Button
          className="bg-brand-green hover:bg-brand-green/90 text-white rounded h-8 px-4 text-xs font-bold shadow-sm transition-colors"
          onClick={() => {
            resetForm()
            setIsCreateOpen(true)
          }}
        >
          NOVO
        </Button>
        <Button
          className="bg-brand-green hover:bg-brand-green/90 text-white rounded h-8 px-4 text-xs font-bold shadow-sm transition-colors"
          onClick={() =>
            selected.length > 0 ? setIsDeleteOpen(true) : toast({ title: 'Selecione registros' })
          }
        >
          EXCLUIR
        </Button>
      </div>
      <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mr-2">
        <span>
          1 - {filtered.length} of {filtered.length}
        </span>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled>
            <ChevronLeft size={14} />
          </Button>
          <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled>
            <ChevronRight size={14} />
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <PageLayout title="Clientes" icon={UserCircle}>
      <div className="bg-white rounded shadow-sm border border-slate-200 overflow-hidden flex flex-col">
        <Toolbar />

        {showSearch && (
          <div className="p-3 bg-slate-50 border-b border-slate-200 animate-in slide-in-from-top-2">
            <Input
              placeholder="Buscar por fantasia ou contato..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md h-9 text-sm bg-white"
              autoFocus
            />
          </div>
        )}

        <div className="overflow-x-auto">
          <Table className="min-w-full text-xs">
            <TableHeader className="bg-slate-50">
              <TableRow className="border-b border-slate-200 hover:bg-transparent">
                <TableHead className="w-12 px-4 py-3">
                  <Checkbox
                    checked={selected.length === filtered.length && filtered.length > 0}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead className="py-3 text-slate-600 font-bold whitespace-nowrap">
                  Fantasia
                </TableHead>
                <TableHead className="py-3 text-slate-600 font-bold whitespace-nowrap">
                  Contato
                </TableHead>
                <TableHead className="py-3 text-slate-600 font-bold whitespace-nowrap">
                  Telefone / Celular
                </TableHead>
                <TableHead className="py-3 text-slate-600 font-bold whitespace-nowrap">
                  E-mail
                </TableHead>
                <TableHead className="py-3 text-slate-600 font-bold whitespace-nowrap">
                  Data Cad.
                </TableHead>
                <TableHead className="py-3 text-slate-600 font-bold whitespace-nowrap w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow
                  key={item.id}
                  className="border-b border-slate-100 hover:bg-slate-50/80 group"
                >
                  <TableCell className="px-4 py-3 align-top">
                    <Checkbox
                      checked={selected.includes(item.id)}
                      onCheckedChange={() => toggleOne(item.id)}
                    />
                  </TableCell>
                  <TableCell className="py-3 align-top">
                    <div className="text-brand-green font-bold text-sm tracking-tight">
                      {item.fantasia}
                    </div>
                    <div className="flex gap-2 text-[10.5px] mt-1.5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(item)}
                        className="hover:text-brand-green flex items-center gap-1 font-medium transition-colors"
                      >
                        <Pencil size={11} /> Editar
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        onClick={() => handleDuplicate(item)}
                        className="hover:text-brand-green flex items-center gap-1 font-medium transition-colors"
                      >
                        <Copy size={11} /> Duplicar
                      </button>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 align-top text-slate-700">{item.contato}</TableCell>
                  <TableCell className="py-3 align-top text-slate-700 whitespace-nowrap">
                    {item.telefone && <div>{item.telefone}</div>}
                    {item.celular && <div className="text-slate-400 mt-1">{item.celular}</div>}
                  </TableCell>
                  <TableCell className="py-3 align-top">
                    <a href={`mailto:${item.email}`} className="text-brand-green hover:underline">
                      {item.email}
                    </a>
                  </TableCell>
                  <TableCell className="py-3 align-top text-slate-500 whitespace-nowrap">
                    {item.dt_cad}
                  </TableCell>
                  <TableCell className="py-3 align-top">
                    {item.status === 'Ativo' && (
                      <div className="flex justify-center" title="Ativo">
                        <CheckCircle2 size={16} className="text-green-500" />
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-slate-500">
                    Nenhum cliente encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="border-t border-slate-200">
          <Toolbar />
        </div>
      </div>

      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{formData.id ? 'Editar Cliente' : 'Novo Cliente'}</SheetTitle>
            <SheetDescription>Preencha os detalhes do cliente.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-6">
            <div className="space-y-2">
              <Label htmlFor="fantasia">Fantasia</Label>
              <Input
                id="fantasia"
                placeholder="Nome fantasia"
                value={formData.fantasia}
                onChange={(e) => setFormData({ ...formData, fantasia: e.target.value })}
              />
              {errors.fantasia && <span className="text-red-500 text-xs">{errors.fantasia}</span>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="documento">CPF/CNPJ</Label>
              <Input
                id="documento"
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                value={formData.documento}
                onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
              />
              {errors.documento && <span className="text-red-500 text-xs">{errors.documento}</span>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contato">Contato</Label>
              <Input
                id="contato"
                placeholder="Nome do contato"
                value={formData.contato}
                onChange={(e) => setFormData({ ...formData, contato: e.target.value })}
              />
              {errors.contato && <span className="text-red-500 text-xs">{errors.contato}</span>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  placeholder="(00) 0000-0000"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="celular">Celular</Label>
                <Input
                  id="celular"
                  placeholder="(00) 00000-0000"
                  value={formData.celular}
                  onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@exemplo.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              {errors.email && <span className="text-red-500 text-xs">{errors.email}</span>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dt_cad">Data de Cadastro</Label>
                <Input
                  id="dt_cad"
                  type="date"
                  value={formData.dt_cad}
                  onChange={(e) => setFormData({ ...formData, dt_cad: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <SheetFooter className="mt-4">
            <Button
              onClick={handleSave}
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-brand-green hover:bg-brand-green/90"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'Salvando...' : 'Salvar'}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
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
