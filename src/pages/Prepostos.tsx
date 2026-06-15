import { useState, useEffect } from 'react'
import { Briefcase, Loader2 } from 'lucide-react'
import { PageLayout } from '@/components/PageLayout'
import { PaginationBar } from '@/components/PaginationBar'
import { SortableHead } from '@/components/SortableHead'
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
import { RegistrationActionBar } from '@/components/RegistrationActionBar'
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal'
import {
  getPrepostos,
  getRepresentantes,
  createPreposto,
  updatePreposto,
  deletePreposto,
  getByDocumento,
} from '@/services/cadastros'
import { DuplicateConflictDialog } from '@/components/DuplicateConflictDialog'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

export default function Prepostos() {
  const [data, setData] = useState<any[]>([])
  const [reps, setReps] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [conflictRecord, setConflictRecord] = useState<any>(null)
  const [isConflictOpen, setIsConflictOpen] = useState(false)

  const resetForm = () => {
    setIsCreateOpen(false)
    setFormData({
      representante: '',
      nome: '',
      documento: '',
      email: '',
      telefone: '',
      dt_cad: new Date().toISOString().split('T')[0],
    })
    setConflictRecord(null)
  }

  const [formData, setFormData] = useState({
    representante: '',
    nome: '',
    documento: '',
    email: '',
    telefone: '',
    dt_cad: new Date().toISOString().split('T')[0],
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()

  const loadData = async () => setData(await getPrepostos().catch(() => []))
  useEffect(() => {
    loadData()
    getRepresentantes()
      .then(setReps)
      .catch(() => {})
  }, [])
  useRealtime('prepostos', loadData)

  const filtered = data.filter(
    (d) =>
      d.nome?.toLowerCase().includes(search.toLowerCase()) ||
      d.representante?.toLowerCase().includes(search.toLowerCase()),
  )

  const toggleAll = () =>
    setSelected(
      selected.length === filtered.length && filtered.length > 0 ? [] : filtered.map((d) => d.id),
    )
  const toggleOne = (id: string) =>
    setSelected((p) => (p.includes(id) ? p.filter((i) => i !== id) : [...p, id]))

  const handleDelete = async () => {
    try {
      await Promise.all(selected.map((id) => deletePreposto(id)))
      setSelected([])
      toast({ title: 'Registros excluídos' })
    } catch (e) {
      toast({ title: 'Erro ao excluir', variant: 'destructive' })
    }
  }

  const handleCreate = async () => {
    try {
      setIsSubmitting(true)
      setErrors({})

      if (formData.documento) {
        const existing = await getByDocumento('prepostos', formData.documento)
        if (existing) {
          setConflictRecord(existing)
          setIsConflictOpen(true)
          setIsSubmitting(false)
          return
        }
      }

      await createPreposto({
        ...formData,
        dt_cad: formData.dt_cad.split('-').reverse().join('/'),
      })
      resetForm()
      toast({ title: 'Registro criado' })
    } catch (err) {
      setErrors(extractFieldErrors(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReplace = async () => {
    try {
      setIsSubmitting(true)
      await updatePreposto(conflictRecord.id, {
        ...formData,
        dt_cad: formData.dt_cad.split('-').reverse().join('/'),
      })
      setIsConflictOpen(false)
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
        dt_cad: formData.dt_cad ? formData.dt_cad.split('-').reverse().join('/') : formData.dt_cad,
      }

      const mergedData = { ...conflictRecord }
      for (const [key, value] of Object.entries(formattedFormData)) {
        if (value !== undefined && value !== null && String(value).trim() !== '') {
          mergedData[key] = value
        }
      }

      await updatePreposto(conflictRecord.id, mergedData)
      setIsConflictOpen(false)
      resetForm()
      toast({ title: 'Registros mesclados com sucesso' })
    } catch (err) {
      toast({ title: 'Erro ao mesclar', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PageLayout title="Prepostos" icon={Briefcase}>
      <RegistrationActionBar
        onSearchToggle={() => setShowSearch(!showSearch)}
        onNewClick={() => setIsCreateOpen(true)}
        onDeleteClick={() =>
          selected.length > 0 ? setIsDeleteOpen(true) : toast({ title: 'Selecione registros' })
        }
        showSearch={showSearch}
        searchQuery={search}
        onSearchChange={setSearch}
      />
      <PaginationBar total={filtered.length} displayTotal={filtered.length} />
      <div className="overflow-x-auto bg-white rounded-md shadow-sm border border-slate-200">
        <Table className="min-w-full text-sm">
          <TableHeader>
            <TableRow className="border-b-2 border-slate-200 hover:bg-transparent">
              <TableHead className="w-10">
                <Checkbox
                  checked={selected.length === filtered.length && filtered.length > 0}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <SortableHead>Representante</SortableHead>
              <SortableHead>Nome</SortableHead>
              <SortableHead>CPF/CNPJ</SortableHead>
              <SortableHead>E-mail</SortableHead>
              <SortableHead>Telefone</SortableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item) => (
              <TableRow key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                <TableCell>
                  <Checkbox
                    checked={selected.includes(item.id)}
                    onCheckedChange={() => toggleOne(item.id)}
                  />
                </TableCell>
                <TableCell>
                  <div className="text-slate-700">{item.representante}</div>
                </TableCell>
                <TableCell className="text-slate-600">{item.nome}</TableCell>
                <TableCell className="text-slate-600">{item.documento}</TableCell>
                <TableCell className="text-slate-600">{item.email}</TableCell>
                <TableCell className="text-slate-600 whitespace-nowrap">{item.telefone}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Novo Preposto</SheetTitle>
            <SheetDescription>
              Adicione um preposto e associe-o a um representante.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-6">
            <div className="space-y-2">
              <Label htmlFor="representante">Representante</Label>
              <Select
                value={formData.representante}
                onValueChange={(v) => setFormData({ ...formData, representante: v })}
              >
                <SelectTrigger id="representante">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {reps.map((r) => (
                    <SelectItem key={r.id} value={r.fantasia}>
                      {r.fantasia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.representante && (
                <span className="text-red-500 text-xs">{errors.representante}</span>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                placeholder="Nome completo"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
              {errors.nome && <span className="text-red-500 text-xs">{errors.nome}</span>}
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
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  placeholder="(00) 00000-0000"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dt_cad">Data de Cadastro</Label>
                <Input
                  id="dt_cad"
                  type="date"
                  value={formData.dt_cad}
                  onChange={(e) => setFormData({ ...formData, dt_cad: e.target.value })}
                />
              </div>
            </div>
          </div>
          <SheetFooter className="mt-4">
            <Button onClick={handleCreate} disabled={isSubmitting} className="w-full sm:w-auto">
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
