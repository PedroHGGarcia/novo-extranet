import { useState, useEffect } from 'react'
import { UserCircle } from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RegistrationActionBar } from '@/components/RegistrationActionBar'
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal'
import { getClientes, createCliente, deleteCliente } from '@/services/cadastros'
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
  const [formData, setFormData] = useState({
    fantasia: '',
    contato: '',
    telefone: '',
    celular: '',
    email: '',
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

  const handleCreate = async () => {
    try {
      setErrors({})
      await createCliente({ ...formData, dt_cad: new Date().toLocaleDateString('pt-BR') })
      setIsCreateOpen(false)
      setFormData({
        fantasia: '',
        contato: '',
        telefone: '',
        celular: '',
        email: '',
        status: 'Ativo',
      })
      toast({ title: 'Registro criado' })
    } catch (err) {
      setErrors(extractFieldErrors(err))
    }
  }

  return (
    <PageLayout title="Clientes" icon={UserCircle}>
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
              <SortableHead>Fantasia</SortableHead>
              <SortableHead>Contato</SortableHead>
              <SortableHead>Telefone</SortableHead>
              <SortableHead>Celular</SortableHead>
              <SortableHead>Email</SortableHead>
              <SortableHead>Status</SortableHead>
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
                  <div className="text-slate-700">{item.fantasia}</div>
                </TableCell>
                <TableCell className="text-slate-600">{item.contato}</TableCell>
                <TableCell className="text-slate-600 whitespace-nowrap">{item.telefone}</TableCell>
                <TableCell className="text-slate-600 whitespace-nowrap">{item.celular}</TableCell>
                <TableCell className="text-slate-600">{item.email}</TableCell>
                <TableCell>
                  <span
                    className={`text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase ${item.status === 'Ativo' ? 'bg-[#5cb85c]' : 'bg-slate-400'}`}
                  >
                    {item.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Cliente</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Input
                placeholder="Fantasia"
                value={formData.fantasia}
                onChange={(e) => setFormData({ ...formData, fantasia: e.target.value })}
              />
              {errors.fantasia && <span className="text-red-500 text-xs">{errors.fantasia}</span>}
            </div>
            <Input
              placeholder="Contato"
              value={formData.contato}
              onChange={(e) => setFormData({ ...formData, contato: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              />
              <Input
                placeholder="Celular"
                value={formData.celular}
                onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
              />
            </div>
            <div>
              <Input
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              {errors.email && <span className="text-red-500 text-xs">{errors.email}</span>}
            </div>
            <Input
              placeholder="Status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
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
