import { useState, useEffect } from 'react'
import { User } from 'lucide-react'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { RegistrationActionBar } from '@/components/RegistrationActionBar'
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal'
import { getGerentes, createGerente, deleteGerente } from '@/services/cadastros'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

export default function Gerentes() {
  const [data, setData] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [formData, setFormData] = useState({ nome: '', email: '', telefone: '', status: 'Ativo' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()

  const loadData = async () => setData(await getGerentes().catch(() => []))
  useEffect(() => {
    loadData()
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

  const handleCreate = async () => {
    try {
      setErrors({})
      await createGerente(formData)
      setIsCreateOpen(false)
      setFormData({ nome: '', email: '', telefone: '', status: 'Ativo' })
      toast({ title: 'Registro criado' })
    } catch (err) {
      setErrors(extractFieldErrors(err))
    }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-2 mb-3 text-gray-800">
        <User className="h-6 w-6" />
        <h1 className="text-xl font-semibold">Gerentes</h1>
      </div>
      <div className="h-[2px] bg-[#3b82f6] w-full mb-6"></div>

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

      <div className="flex justify-between items-end border-b border-gray-200 mb-0">
        <div className="flex">
          <button className="px-6 py-2.5 bg-white border border-b-0 border-gray-200 border-t-2 border-t-[#3b82f6] text-sm font-medium text-gray-700">
            Registros
          </button>
          <button className="px-6 py-2.5 text-[#3b82f6] text-sm font-medium hover:bg-gray-50/50">
            Cadastro
          </button>
        </div>
        <div className="pb-2 text-sm text-gray-600">Total: {filtered.length}</div>
      </div>

      <div className="bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12 text-center">
                <Checkbox
                  checked={selected.length === filtered.length && filtered.length > 0}
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead className="text-[#3b82f6] font-semibold">Nome</TableHead>
              <TableHead className="text-[#3b82f6] font-semibold">Email</TableHead>
              <TableHead className="text-[#3b82f6] font-semibold">Telefone</TableHead>
              <TableHead className="text-[#3b82f6] font-semibold">Status</TableHead>
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
                <TableCell className="text-gray-600">{item.email}</TableCell>
                <TableCell className="text-gray-600">{item.telefone}</TableCell>
                <TableCell>
                  <span className="bg-[#16a34a] text-white text-[11px] px-2 py-0.5 rounded-sm font-medium tracking-wide">
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
            <DialogTitle>Novo Gerente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Input
                placeholder="Nome"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              />
              {errors.nome && <span className="text-red-500 text-xs">{errors.nome}</span>}
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
              placeholder="Telefone"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
            />
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
    </div>
  )
}
