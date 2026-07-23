import { useState, useEffect } from 'react'
import { Loader2, Search, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  TableHead,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
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
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal'
import { DuplicateConflictDialog } from '@/components/DuplicateConflictDialog'
import {
  getRepresentantes,
  createRepresentante,
  updateRepresentante,
  deleteRepresentante,
  getByDocumento,
} from '@/services/cadastros'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import { extractFieldErrors, getErrorMessage } from '@/lib/pocketbase/errors'

export default function Representantes() {
  const [data, setData] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [conflictRecord, setConflictRecord] = useState<any>(null)
  const [isConflictOpen, setIsConflictOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [perPage] = useState(50)
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    fantasia: '',
    documento: '',
    sigla: '',
    telefone: '',
    cidade: '',
    uf: '',
    status: 'Ativo',
    dt_cad: new Date().toISOString().split('T')[0],
    coordenadas: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()

  const loadData = async () => {
    try {
      setIsLoading(true)
      setData(await getRepresentantes())
    } catch {
      setData([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('representantes', (e) => {
    if (e.action === 'create') {
      setData((prev) => [e.record, ...prev])
    } else if (e.action === 'update') {
      setData((prev) => prev.map((item) => (item.id === e.record.id ? e.record : item)))
    } else if (e.action === 'delete') {
      setData((prev) => prev.filter((item) => item.id !== e.record.id))
    }
  })

  const filtered = data.filter(
    (d) =>
      d.fantasia?.toLowerCase().includes(search.toLowerCase()) ||
      d.sigla?.toLowerCase().includes(search.toLowerCase()),
  )
  const paginated = filtered.slice((page - 1) * perPage, page * perPage)
  const totalPages = Math.ceil(filtered.length / perPage) || 1

  const toggleAll = () =>
    setSelected(
      selected.length === paginated.length && paginated.length > 0
        ? []
        : paginated.map((d) => d.id),
    )
  const toggleOne = (id: string) =>
    setSelected((p) => (p.includes(id) ? p.filter((i) => i !== id) : [...p, id]))

  const handleDelete = async () => {
    try {
      await Promise.all(selected.map((id) => deleteRepresentante(id)))
      setSelected([])
      toast({ title: 'Registros excluídos com sucesso' })
    } catch {
      toast({ title: 'Erro ao excluir', variant: 'destructive' })
    }
  }

  const resetForm = () => {
    setIsCreateOpen(false)
    setFormData({
      fantasia: '',
      documento: '',
      sigla: '',
      telefone: '',
      cidade: '',
      uf: '',
      status: 'Ativo',
      dt_cad: new Date().toISOString().split('T')[0],
      coordenadas: '',
    })
    setConflictRecord(null)
    setErrors({})
  }

  const handleCreate = async () => {
    let coords = null
    if (formData.coordenadas) {
      try {
        coords = JSON.parse(formData.coordenadas)
      } catch {
        return toast({ title: 'JSON de Coordenadas inválido', variant: 'destructive' })
      }
    }
    try {
      setIsSubmitting(true)
      setErrors({})
      if (formData.documento) {
        const existing = await getByDocumento('representantes', formData.documento)
        if (existing) {
          setConflictRecord(existing)
          setIsConflictOpen(true)
          setIsSubmitting(false)
          return
        }
      }
      await createRepresentante({
        ...formData,
        coordenadas: coords,
        dt_cad: formData.dt_cad.split('-').reverse().join('/'),
      })
      resetForm()
      toast({ title: 'Registro criado com sucesso' })
    } catch (err) {
      setErrors(extractFieldErrors(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleReplace = async () => {
    let coords = null
    if (formData.coordenadas) {
      try {
        coords = JSON.parse(formData.coordenadas)
      } catch {
        return
      }
    }
    try {
      setIsSubmitting(true)
      await updateRepresentante(conflictRecord.id, {
        ...formData,
        coordenadas: coords,
        dt_cad: formData.dt_cad.split('-').reverse().join('/'),
      })
      setIsConflictOpen(false)
      resetForm()
      toast({ title: 'Registro substituído com sucesso' })
    } catch {
      toast({ title: 'Erro ao substituir', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggleStatus = async (item: any, newStatus: string) => {
    if (updatingStatusId === item.id) return
    setUpdatingStatusId(item.id)
    // Optimistic update
    setData((prev) => prev.map((d) => (d.id === item.id ? { ...d, status: newStatus } : d)))
    try {
      await updateRepresentante(item.id, { status: newStatus })
      toast({ title: 'Status atualizado com sucesso' })
    } catch (err: any) {
      // Revert optimistic update on error
      setData((prev) => prev.map((d) => (d.id === item.id ? { ...d, status: item.status } : d)))
      toast({
        title: 'Erro ao atualizar status',
        description: getErrorMessage(err),
        variant: 'destructive',
      })
    } finally {
      setUpdatingStatusId(null)
    }
  }

  const handleMerge = async () => {
    let coords = undefined
    if (formData.coordenadas) {
      try {
        coords = JSON.parse(formData.coordenadas)
      } catch {
        return
      }
    }
    try {
      setIsSubmitting(true)
      const merged = { ...conflictRecord }
      const formatted = {
        ...formData,
        dt_cad: formData.dt_cad ? formData.dt_cad.split('-').reverse().join('/') : formData.dt_cad,
        ...(coords !== undefined ? { coordenadas: coords } : {}),
      }
      for (const [k, v] of Object.entries(formatted)) {
        if (v !== undefined && v !== null && String(v).trim() !== '') merged[k] = v
      }
      await updateRepresentante(conflictRecord.id, merged)
      setIsConflictOpen(false)
      resetForm()
      toast({ title: 'Registros mesclados com sucesso' })
    } catch {
      toast({ title: 'Erro ao mesclar', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6 w-full">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar representantes..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="pl-8 w-[250px] md:w-[350px] bg-background"
              />
            </div>
            <Button
              onClick={() => {
                resetForm()
                setIsCreateOpen(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" /> Novo Representante
            </Button>
            {selected.length > 0 && (
              <Button variant="destructive" onClick={() => setIsDeleteOpen(true)}>
                Excluir ({selected.length})
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground mr-2">
              {filtered.length > 0 ? Math.min((page - 1) * perPage + 1, filtered.length) : 0} -{' '}
              {Math.min(page * perPage, filtered.length)} de {filtered.length} registros
            </div>
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
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 bg-background"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <Card className="shadow-sm">
          <div className="overflow-x-auto min-h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selected.length === paginated.length && paginated.length > 0}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead>Fantasia</TableHead>
                  <TableHead>CPF/CNPJ</TableHead>
                  <TableHead>Sigla</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead>UF</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <TableRow key={`skeleton-${i}`}>
                      {Array.from({ length: 8 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                      Nenhum representante encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginated.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Checkbox
                          checked={selected.includes(item.id)}
                          onCheckedChange={() => toggleOne(item.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium text-foreground">{item.fantasia}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.documento || '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.sigla || '-'}</TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {item.telefone || '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.cidade || '-'}</TableCell>
                      <TableCell className="text-muted-foreground">{item.uf || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={item.status === 'Ativo'}
                            disabled={updatingStatusId === item.id}
                            onCheckedChange={(checked) =>
                              handleToggleStatus(item, checked ? 'Ativo' : 'Inativo')
                            }
                            aria-label={
                              item.status === 'Ativo'
                                ? 'Desativar representante'
                                : 'Ativar representante'
                            }
                          />
                          {item.status === 'Ativo' ? (
                            <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-green-100 text-green-700">
                              Ativo
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700">
                              {item.status || 'Inativo'}
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Novo Representante</SheetTitle>
            <SheetDescription>Insira os dados do novo representante.</SheetDescription>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sigla">Sigla</Label>
                <Input
                  id="sigla"
                  placeholder="Ex: REP"
                  value={formData.sigla}
                  onChange={(e) => setFormData({ ...formData, sigla: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  placeholder="(00) 0000-0000"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade</Label>
                <Input
                  id="cidade"
                  placeholder="Ex: São Paulo"
                  value={formData.cidade}
                  onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="uf">UF</Label>
                <Input
                  id="uf"
                  placeholder="Ex: SP"
                  value={formData.uf}
                  onChange={(e) => setFormData({ ...formData, uf: e.target.value })}
                />
              </div>
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
            <div className="space-y-2">
              <Label htmlFor="coordenadas">Coordenadas JSON</Label>
              <Textarea
                id="coordenadas"
                placeholder='Ex: [{"lat": -23, "lng": -46}]'
                value={formData.coordenadas}
                onChange={(e) => setFormData({ ...formData, coordenadas: e.target.value })}
                className="resize-none"
              />
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
    </div>
  )
}
