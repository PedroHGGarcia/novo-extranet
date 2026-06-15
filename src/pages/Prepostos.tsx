import { useState, useEffect } from 'react'
import { Briefcase } from 'lucide-react'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RegistrationActionBar } from '@/components/RegistrationActionBar'
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal'
import {
  getPrepostos,
  getRepresentantes,
  createPreposto,
  deletePreposto,
} from '@/services/cadastros'
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
  const [formData, setFormData] = useState({ representante: '', nome: '', email: '', telefone: '' })
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
      setErrors({})
      await createPreposto({ ...formData, dt_cad: new Date().toLocaleDateString('pt-BR') })
      setIsCreateOpen(false)
      setFormData({ representante: '', nome: '', email: '', telefone: '' })
      toast({ title: 'Registro criado' })
    } catch (err) {
      setErrors(extractFieldErrors(err))
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
                <TableCell className="text-slate-600">{item.email}</TableCell>
                <TableCell className="text-slate-600 whitespace-nowrap">{item.telefone}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Preposto</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Select
                value={formData.representante}
                onValueChange={(v) => setFormData({ ...formData, representante: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um Representante" />
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
            <Input
              placeholder="Nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            />
            <Input
              placeholder="Email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              placeholder="Telefone"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
            />
          </div>
          <DialogFooter>
            <Button onClick={handleCreate}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <DeleteConfirmModal
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        count={selected.length}
        onConfirm={handleDelete}
      />
    </PageLayout>
  )
}
