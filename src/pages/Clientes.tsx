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
  getClientesPaginated,
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
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(50)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
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
        filter = `fantasia ~ "${s}" || documento ~ "${s}" || contato ~ "${s}"`
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
    const clearName = (item.fantasia || '').replace(/EditarDuplicar$/i, '').trim()
    setFormData({
      id: item.id,
      fantasia: clearName,
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
    const clearName = (item.fantasia || '').replace(/EditarDuplicar$/i, '').trim()
    setFormData({
      id: '',
      fantasia: clearName ? `${clearName} (Cópia)` : '',
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
    <div className="flex justify-between items-center bg-[#242c33] p-3 border-b border-[#313b45]">
      <div className="flex gap-2">
        <Button
          className="bg-[#005c31] hover:bg-[#004a27] text-white rounded h-8 px-5 text-xs font-bold shadow-sm transition-colors"
          onClick={() => setShowSearch(!showSearch)}
        >
          PESQUISAR
        </Button>
        <Button
          className="bg-[#005c31] hover:bg-[#004a27] text-white rounded h-8 px-5 text-xs font-bold shadow-sm transition-colors"
          onClick={() => {
            resetForm()
            setIsCreateOpen(true)
          }}
        >
          NOVO
        </Button>
        <Button
          className="bg-[#005c31] hover:bg-[#004a27] text-white rounded h-8 px-5 text-xs font-bold shadow-sm transition-colors"
          onClick={() =>
            selected.length > 0 ? setIsDeleteOpen(true) : toast({ title: 'Selecione registros' })
          }
        >
          EXCLUIR
        </Button>
      </div>
      <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
        <Select
          value={String(perPage)}
          onValueChange={(val) => {
            setPerPage(Number(val))
            setPage(1)
          }}
        >
          <SelectTrigger className="h-7 text-xs border-[#313b45] bg-[#1e252b] text-white w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1e252b] border-[#313b45] text-white">
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
        <span>
          {totalItems > 0 ? Math.min((page - 1) * perPage + 1, totalItems) : 0} -{' '}
          {Math.min(page * perPage, totalItems)} de {totalItems.toLocaleString('pt-BR')}
        </span>
        <div className="flex gap-1 items-center">
          <Button
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0 border-[#313b45] bg-[#1e252b] text-white hover:bg-[#242c33]"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft size={14} />
          </Button>
          <span className="px-2 text-white">
            {page} / {totalPages || 1}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="h-7 w-7 p-0 border-[#313b45] bg-[#1e252b] text-white hover:bg-[#242c33]"
            disabled={page >= totalPages || totalPages === 0}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight size={14} />
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <PageLayout title="Clientes" icon={UserCircle}>
      <div className="bg-[#1e252b] rounded-md shadow-lg border border-[#313b45] overflow-hidden flex flex-col text-slate-200">
        {/* Tabs */}
        <div className="flex bg-[#242c33] border-b border-[#313b45] px-2 pt-2">
          <button className="px-6 py-2.5 bg-[#1e252b] border-t-[3px] border-cyan-500 text-sm font-bold text-white rounded-t-sm">
            Registros
          </button>
          <button
            className="px-6 py-2.5 text-sm font-bold text-cyan-500 hover:text-cyan-400 transition-colors"
            onClick={() => {
              resetForm()
              setIsCreateOpen(true)
            }}
          >
            Cadastro
          </button>
        </div>

        <Toolbar />

        {showSearch && (
          <div className="p-3 bg-[#242c33] border-b border-[#313b45] animate-in slide-in-from-top-2">
            <Input
              placeholder="Buscar por fantasia, documento ou contato..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-md h-9 text-sm bg-[#1e252b] border-[#313b45] text-white placeholder:text-slate-500"
              autoFocus
            />
          </div>
        )}

        <div className="overflow-x-auto">
          <Table className="min-w-full text-xs">
            <TableHeader className="bg-[#242c33]">
              <TableRow className="border-b border-[#313b45] hover:bg-transparent">
                <TableHead className="w-12 px-4 py-3">
                  <Checkbox
                    checked={selected.length === data.length && data.length > 0}
                    onCheckedChange={toggleAll}
                    className="rounded-full border-slate-400 data-[state=checked]:bg-[#005c31] data-[state=checked]:border-[#005c31]"
                  />
                </TableHead>
                <TableHead className="py-3 text-white font-bold whitespace-nowrap">
                  Fantasia
                </TableHead>
                <TableHead className="py-3 text-white font-bold whitespace-nowrap">
                  Contato
                </TableHead>
                <TableHead className="py-3 text-white font-bold whitespace-nowrap">
                  Telefone / Celular
                </TableHead>
                <TableHead className="py-3 text-white font-bold whitespace-nowrap">
                  E-mail
                </TableHead>
                <TableHead className="py-3 text-white font-bold whitespace-nowrap">
                  Data Cad.
                </TableHead>
                <TableHead className="py-3 text-white font-bold whitespace-nowrap w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item) => {
                const clearFantasia = (item.fantasia || '').replace(/EditarDuplicar$/i, '').trim()
                return (
                  <TableRow
                    key={item.id}
                    className="border-b border-[#313b45] hover:bg-[#242c33]/80 group"
                  >
                    <TableCell className="px-4 py-3 align-top">
                      <Checkbox
                        checked={selected.includes(item.id)}
                        onCheckedChange={() => toggleOne(item.id)}
                        className="rounded-full border-slate-400 data-[state=checked]:bg-[#005c31] data-[state=checked]:border-[#005c31] mt-0.5"
                      />
                    </TableCell>
                    <TableCell className="py-3 align-top">
                      <div className="flex flex-col items-start gap-1">
                        <span className="text-white font-bold text-sm tracking-tight block">
                          {clearFantasia}
                        </span>
                        <div className="flex gap-2 text-[11px] text-slate-400 mt-1 select-none items-center">
                          <button
                            onClick={() => handleEdit(item)}
                            className="hover:text-white flex items-center gap-1 font-medium transition-colors cursor-pointer"
                          >
                            <Pencil size={11} /> Editar
                          </button>
                          <span className="text-slate-600">|</span>
                          <button
                            onClick={() => handleDuplicate(item)}
                            className="hover:text-white flex items-center gap-1 font-medium transition-colors cursor-pointer"
                          >
                            <Copy size={11} /> Duplicar
                          </button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3 align-top text-slate-300">{item.contato}</TableCell>
                    <TableCell className="py-3 align-top text-slate-300 whitespace-nowrap">
                      {item.telefone && <div>{item.telefone}</div>}
                      {item.celular && <div className="text-slate-500 mt-1">{item.celular}</div>}
                    </TableCell>
                    <TableCell className="py-3 align-top">
                      <a href={`mailto:${item.email}`} className="text-cyan-400 hover:underline">
                        {item.email}
                      </a>
                    </TableCell>
                    <TableCell className="py-3 align-top text-slate-400 whitespace-nowrap">
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
                )
              })}
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-slate-400">
                    Nenhum cliente encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="border-t border-[#313b45]">
          <Toolbar />
        </div>
      </div>

      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <SheetContent className="sm:max-w-md overflow-y-auto bg-[#1e252b] border-[#313b45] text-slate-200">
          <SheetHeader>
            <SheetTitle className="text-white">
              {formData.id ? 'Editar Cliente' : 'Novo Cliente'}
            </SheetTitle>
            <SheetDescription className="text-slate-400">
              Preencha os detalhes do cliente.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-4 py-6">
            <div className="space-y-2">
              <Label htmlFor="fantasia" className="text-slate-300">
                Fantasia
              </Label>
              <Input
                id="fantasia"
                placeholder="Nome fantasia"
                value={formData.fantasia}
                onChange={(e) => setFormData({ ...formData, fantasia: e.target.value })}
                className="bg-[#242c33] border-[#313b45] text-white placeholder:text-slate-500"
              />
              {errors.fantasia && <span className="text-red-400 text-xs">{errors.fantasia}</span>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="documento" className="text-slate-300">
                CPF/CNPJ
              </Label>
              <Input
                id="documento"
                placeholder="000.000.000-00 ou 00.000.000/0000-00"
                value={formData.documento}
                onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
                className="bg-[#242c33] border-[#313b45] text-white placeholder:text-slate-500"
              />
              {errors.documento && <span className="text-red-400 text-xs">{errors.documento}</span>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contato" className="text-slate-300">
                Contato
              </Label>
              <Input
                id="contato"
                placeholder="Nome do contato"
                value={formData.contato}
                onChange={(e) => setFormData({ ...formData, contato: e.target.value })}
                className="bg-[#242c33] border-[#313b45] text-white placeholder:text-slate-500"
              />
              {errors.contato && <span className="text-red-400 text-xs">{errors.contato}</span>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefone" className="text-slate-300">
                  Telefone
                </Label>
                <Input
                  id="telefone"
                  placeholder="(00) 0000-0000"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  className="bg-[#242c33] border-[#313b45] text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="celular" className="text-slate-300">
                  Celular
                </Label>
                <Input
                  id="celular"
                  placeholder="(00) 00000-0000"
                  value={formData.celular}
                  onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
                  className="bg-[#242c33] border-[#313b45] text-white placeholder:text-slate-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">
                E-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="email@exemplo.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-[#242c33] border-[#313b45] text-white placeholder:text-slate-500"
              />
              {errors.email && <span className="text-red-400 text-xs">{errors.email}</span>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dt_cad" className="text-slate-300">
                  Data de Cadastro
                </Label>
                <Input
                  id="dt_cad"
                  type="date"
                  value={formData.dt_cad}
                  onChange={(e) => setFormData({ ...formData, dt_cad: e.target.value })}
                  className="bg-[#242c33] border-[#313b45] text-white placeholder:text-slate-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status" className="text-slate-300">
                  Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger id="status" className="bg-[#242c33] border-[#313b45] text-white">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e252b] border-[#313b45] text-white">
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
              className="w-full sm:w-auto bg-[#005c31] hover:bg-[#004a27] text-white"
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
