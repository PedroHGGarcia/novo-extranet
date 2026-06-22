import { useState, useEffect } from 'react'
import {
  Globe,
  Pencil,
  Copy,
  ArrowUpDown,
  Loader2,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from 'lucide-react'
import { format } from 'date-fns'
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
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal'
import { getRegioes, createRegiao, updateRegiao, deleteRegiao } from '@/services/cadastros'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import { extractFieldErrors } from '@/lib/pocketbase/errors'
import pb from '@/lib/pocketbase/client'
import { cn } from '@/lib/utils'

export default function Regioes() {
  const [data, setData] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'registros' | 'cadastro'>('registros')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({ nome: '', uf: '', status: 'Ativo' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pageSize, setPageSize] = useState(50)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortConfig, setSortConfig] = useState({ key: 'nome', direction: 'asc' })
  const { toast } = useToast()

  const loadData = async () => setData(await getRegioes().catch(() => []))

  useEffect(() => {
    loadData()
  }, [])

  useRealtime('regioes', loadData)

  const filtered = data.filter((d) => d.nome?.toLowerCase().includes(search.toLowerCase()))

  const sortedData = [...filtered].sort((a, b) => {
    let valA = a[sortConfig.key] || ''
    let valB = b[sortConfig.key] || ''
    if (sortConfig.key === 'atualizado_por') {
      valA = a.expand?.atualizado_por?.name || ''
      valB = b.expand?.atualizado_por?.name || ''
    }
    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1
    return 0
  })

  const totalPages = Math.ceil(sortedData.length / pageSize) || 1
  const start = sortedData.length > 0 ? (currentPage - 1) * pageSize + 1 : 0
  const end = Math.min(currentPage * pageSize, sortedData.length)
  const paginationText = `${start}-${end} de ${sortedData.length}`
  const paginatedData = sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const toggleAll = () =>
    setSelected(
      selected.length === paginatedData.length && paginatedData.length > 0
        ? []
        : paginatedData.map((d) => d.id),
    )
  const toggleOne = (id: string) =>
    setSelected((p) => (p.includes(id) ? p.filter((i) => i !== id) : [...p, id]))

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const handleDelete = async () => {
    try {
      await Promise.all(selected.map((id) => deleteRegiao(id)))
      setSelected([])
      toast({ title: 'Registros excluídos' })
      setIsDeleteOpen(false)
    } catch (e) {
      toast({ title: 'Erro ao excluir', variant: 'destructive' })
    }
  }

  const handleSave = async () => {
    try {
      setIsSubmitting(true)
      setErrors({})
      const payload = { ...formData, atualizado_por: pb.authStore.record?.id }
      if (editingId) {
        await updateRegiao(editingId, payload)
        toast({ title: 'Registro atualizado' })
      } else {
        await createRegiao(payload)
        toast({ title: 'Registro criado' })
      }
      setActiveTab('registros')
      setEditingId(null)
    } catch (err) {
      setErrors(extractFieldErrors(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const openForm = (item?: any, copy = false) => {
    if (item) {
      setFormData({
        nome: copy ? `${item.nome} (Cópia)` : item.nome,
        uf: item.uf || '',
        status: item.status,
      })
      setEditingId(copy ? null : item.id)
    } else {
      setFormData({ nome: '', uf: '', status: 'Ativo' })
      setEditingId(null)
    }
    setActiveTab('cadastro')
  }

  const renderToolbar = () => (
    <div className="flex gap-2 mb-4 mt-4">
      <Button
        onClick={() => setShowSearch(!showSearch)}
        className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-[3px] h-8 px-5 text-xs font-bold uppercase tracking-wider shadow-sm transition-colors"
      >
        Pesquisar
      </Button>
      <Button
        onClick={() => openForm()}
        className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-[3px] h-8 px-5 text-xs font-bold uppercase tracking-wider shadow-sm transition-colors"
      >
        Novo
      </Button>
      <Button
        onClick={() =>
          selected.length > 0 ? setIsDeleteOpen(true) : toast({ title: 'Selecione registros' })
        }
        className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-[3px] h-8 px-5 text-xs font-bold uppercase tracking-wider shadow-sm transition-colors"
      >
        Excluir
      </Button>
    </div>
  )

  const PaginationBar = () => (
    <div className="flex items-center justify-end gap-4 py-2 px-4 bg-gray-50/80">
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7 border-gray-300 text-gray-500"
          onClick={() => setCurrentPage(1)}
          disabled={currentPage === 1}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7 border-gray-300 text-gray-500"
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          className="h-7 w-7 p-0 bg-emerald-700 text-white hover:bg-emerald-800 hover:text-white border-0 rounded-[3px]"
        >
          {currentPage}
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7 border-gray-300 text-gray-500"
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7 border-gray-300 text-gray-500"
          onClick={() => setCurrentPage(totalPages)}
          disabled={currentPage === totalPages}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
      <span className="text-xs text-gray-600 font-medium">{paginationText}</span>
      <Select
        value={pageSize.toString()}
        onValueChange={(v) => {
          setPageSize(Number(v))
          setCurrentPage(1)
        }}
      >
        <SelectTrigger className="w-[70px] h-7 rounded-[3px] border-gray-300 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="10">10</SelectItem>
          <SelectItem value="50">50</SelectItem>
          <SelectItem value="100">100</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )

  return (
    <div className="p-6 max-w-[1400px] mx-auto min-h-[calc(100vh-4rem)] bg-[#f8fafc]">
      <div className="flex items-center gap-2 text-gray-900">
        <Globe className="h-6 w-6 text-emerald-800" />
        <h1 className="text-2xl font-bold tracking-tight text-emerald-900">Regiões</h1>
      </div>

      {renderToolbar()}

      {showSearch && (
        <div className="mb-4">
          <Input
            placeholder="Pesquisar por nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm bg-white border-gray-300"
          />
        </div>
      )}

      <div className="bg-white rounded-t-sm border border-b-0 border-gray-200">
        <div className="flex border-b border-gray-200">
          <button
            className={cn(
              'px-6 py-2.5 text-[13px] font-bold tracking-wide uppercase border-t-2 transition-colors',
              activeTab === 'registros'
                ? 'border-t-emerald-700 border-x border-gray-200 border-b-0 bg-white text-emerald-700'
                : 'border-t-transparent border-x border-transparent bg-transparent text-emerald-700/70 hover:bg-emerald-50/50',
            )}
            onClick={() => setActiveTab('registros')}
          >
            Registros
          </button>
          <button
            className={cn(
              'px-6 py-2.5 text-[13px] font-bold tracking-wide uppercase border-t-2 transition-colors -ml-[1px]',
              activeTab === 'cadastro'
                ? 'border-t-emerald-700 border-x border-gray-200 border-b-0 bg-white text-emerald-700'
                : 'border-t-transparent border-x border-transparent bg-transparent text-emerald-700/70 hover:bg-emerald-50/50',
            )}
            onClick={() => setActiveTab('cadastro')}
          >
            Cadastro
          </button>
        </div>
      </div>

      <div className="bg-white border border-t-0 border-gray-200 shadow-sm rounded-b-sm">
        {activeTab === 'registros' ? (
          <div className="flex flex-col">
            <div className="border-b border-gray-200">
              <PaginationBar />
            </div>

            <div className="overflow-x-auto min-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-white hover:bg-white border-b-gray-200">
                    <TableHead className="w-12 text-center px-4">
                      <Checkbox
                        checked={
                          selected.length === paginatedData.length && paginatedData.length > 0
                        }
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead
                      className="text-emerald-700 font-bold text-[12px] py-3 select-none"
                      onClick={() => handleSort('nome')}
                    >
                      <div className="flex items-center gap-1 cursor-pointer hover:text-emerald-800">
                        Nome <ArrowUpDown className="h-3 w-3 opacity-50" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-emerald-700 font-bold text-[12px] py-3 select-none"
                      onClick={() => handleSort('updated')}
                    >
                      <div className="flex items-center gap-1 cursor-pointer hover:text-emerald-800">
                        Última Atualização <ArrowUpDown className="h-3 w-3 opacity-50" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-emerald-700 font-bold text-[12px] py-3 select-none"
                      onClick={() => handleSort('atualizado_por')}
                    >
                      <div className="flex items-center gap-1 cursor-pointer hover:text-emerald-800">
                        Atualizado por <ArrowUpDown className="h-3 w-3 opacity-50" />
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-emerald-700 font-bold text-[12px] py-3 select-none"
                      onClick={() => handleSort('status')}
                    >
                      <div className="flex items-center gap-1 cursor-pointer hover:text-emerald-800">
                        Status <ArrowUpDown className="h-3 w-3 opacity-50" />
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((item) => (
                    <TableRow key={item.id} className="hover:bg-emerald-50/30 border-b-gray-100">
                      <TableCell className="text-center px-4 py-2">
                        <Checkbox
                          checked={selected.includes(item.id)}
                          onCheckedChange={() => toggleOne(item.id)}
                        />
                      </TableCell>
                      <TableCell className="py-2">
                        <div className="text-[13px] font-medium text-gray-800 uppercase">
                          {item.nome}
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <button
                            onClick={() => openForm(item)}
                            className="flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-800 hover:underline transition-colors font-medium"
                          >
                            <Pencil className="h-3 w-3" /> Editar
                          </button>
                          <button
                            onClick={() => openForm(item, true)}
                            className="flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-800 hover:underline transition-colors font-medium"
                          >
                            <Copy className="h-3 w-3" /> Duplicar
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="text-[13px] text-gray-600 py-2">
                        {item.updated ? format(new Date(item.updated), 'dd/MM/yyyy HH:mm:ss') : '-'}
                      </TableCell>
                      <TableCell className="text-[13px] text-gray-700 py-2">
                        {item.expand?.atualizado_por?.name || '-'}
                      </TableCell>
                      <TableCell className="py-2">
                        <span
                          className={cn(
                            'text-white px-2.5 py-0.5 rounded-[3px] text-[10px] font-bold tracking-wider uppercase',
                            item.status === 'Ativo' ? 'bg-[#10b981]' : 'bg-gray-400',
                          )}
                        >
                          {item.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {paginatedData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-gray-500">
                        Nenhum registro encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="border-t border-gray-200">
              <PaginationBar />
            </div>
          </div>
        ) : (
          <div className="p-8 max-w-2xl bg-white min-h-[400px]">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="nome" className="text-gray-800 font-semibold text-sm">
                  Nome
                </Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="border-gray-300 focus-visible:ring-emerald-700 h-9"
                />
                {errors.nome && <span className="text-red-500 text-xs">{errors.nome}</span>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="uf" className="text-gray-800 font-semibold text-sm">
                  UF
                </Label>
                <Input
                  id="uf"
                  value={formData.uf}
                  onChange={(e) => setFormData({ ...formData, uf: e.target.value })}
                  className="border-gray-300 focus-visible:ring-emerald-700 h-9"
                />
                {errors.uf && <span className="text-red-500 text-xs">{errors.uf}</span>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="status" className="text-gray-800 font-semibold text-sm">
                  Status
                </Label>
                <Select
                  value={formData.status}
                  onValueChange={(val) => setFormData({ ...formData, status: val })}
                >
                  <SelectTrigger id="status" className="border-gray-300 focus:ring-emerald-700 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-6 border-t border-gray-100">
                <Button
                  onClick={handleSave}
                  disabled={isSubmitting}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-[3px] h-9 px-6 font-semibold shadow-sm"
                >
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setActiveTab('registros')}
                  className="rounded-[3px] h-9 px-6 font-semibold border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {renderToolbar()}

      <DeleteConfirmModal
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        count={selected.length}
        onConfirm={handleDelete}
      />
    </div>
  )
}
