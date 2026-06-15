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
import { Textarea } from '@/components/ui/textarea'
import { RegistrationActionBar } from '@/components/RegistrationActionBar'
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal'
import { getRepresentantes, createRepresentante, deleteRepresentante } from '@/services/cadastros'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

export default function Representantes() {
  const [data, setData] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [selected, setSelected] = useState<string[]>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    fantasia: '',
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

  const loadData = async () => setData(await getRepresentantes().catch(() => []))
  useEffect(() => {
    loadData()
  }, [])
  useRealtime('representantes', loadData)

  const filtered = data.filter(
    (d) =>
      d.fantasia?.toLowerCase().includes(search.toLowerCase()) ||
      d.sigla?.toLowerCase().includes(search.toLowerCase()),
  )

  const toggleAll = () =>
    setSelected(
      selected.length === filtered.length && filtered.length > 0 ? [] : filtered.map((d) => d.id),
    )
  const toggleOne = (id: string) =>
    setSelected((p) => (p.includes(id) ? p.filter((i) => i !== id) : [...p, id]))

  const handleDelete = async () => {
    try {
      await Promise.all(selected.map((id) => deleteRepresentante(id)))
      setSelected([])
      toast({ title: 'Registros excluídos' })
    } catch (e) {
      toast({ title: 'Erro ao excluir', variant: 'destructive' })
    }
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
      await createRepresentante({
        ...formData,
        coordenadas: coords,
        dt_cad: formData.dt_cad.split('-').reverse().join('/'),
      })
      setIsCreateOpen(false)
      setFormData({
        fantasia: '',
        sigla: '',
        telefone: '',
        cidade: '',
        uf: '',
        status: 'Ativo',
        dt_cad: new Date().toISOString().split('T')[0],
        coordenadas: '',
      })
      toast({ title: 'Registro criado' })
    } catch (err) {
      setErrors(extractFieldErrors(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PageLayout title="Representantes" icon={Briefcase}>
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
              <SortableHead>Sigla</SortableHead>
              <SortableHead>Telefone</SortableHead>
              <SortableHead>Cidade</SortableHead>
              <SortableHead>UF</SortableHead>
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
                <TableCell className="text-slate-600">{item.sigla}</TableCell>
                <TableCell className="text-slate-600 whitespace-nowrap">{item.telefone}</TableCell>
                <TableCell className="text-slate-600">{item.cidade}</TableCell>
                <TableCell className="text-slate-600">{item.uf}</TableCell>
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
    </PageLayout>
  )
}
