import { useState, useEffect } from 'react'
import { useRealtime } from '@/hooks/use-realtime'
import { useAuth } from '@/hooks/use-auth'
import { getProjetosPaginated, deleteProjeto, type Projeto } from '@/services/projetos'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'
import { ProjectForm } from '@/components/ProjectForm'
import { ProjectDetail } from '@/components/ProjectDetail'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import pb from '@/lib/pocketbase/client'

const statusColors: Record<string, string> = {
  'Em Andamento': 'bg-blue-100 text-blue-700',
  Concluído: 'bg-emerald-100 text-emerald-700',
  Cancelado: 'bg-rose-100 text-rose-700',
  Suspenso: 'bg-amber-100 text-amber-700',
}

export default function Projetos() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [view, setView] = useState<'list' | 'form' | 'detail'>('list')
  const [data, setData] = useState<Projeto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [clienteFilter, setClienteFilter] = useState('')
  const [clientes, setClientes] = useState<any[]>([])
  const [selectedProjeto, setSelectedProjeto] = useState<Projeto | null>(null)
  const [proposalCounts, setProposalCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    pb.collection('clientes')
      .getFullList({ sort: 'fantasia' })
      .then(setClientes)
      .catch(() => {})
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const filters: string[] = []
      if (debouncedSearch) {
        const s = debouncedSearch.replace(/"/g, '\\"')
        filters.push(`nome ~ "${s}"`)
      }
      if (statusFilter) filters.push(`status = "${statusFilter}"`)
      if (clienteFilter) filters.push(`cliente = "${clienteFilter}"`)
      const filter = filters.join(' && ')
      const res = await getProjetosPaginated(1, 100, filter)
      setData(res.items)
      const counts: Record<string, number> = {}
      for (const proj of res.items) {
        try {
          const props = await pb.collection('propostas').getList(1, 1, {
            filter: `projeto = "${proj.id}"`,
          })
          counts[proj.id] = props.totalItems
        } catch {
          counts[proj.id] = 0
        }
      }
      setProposalCounts(counts)
    } catch {
      setData([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [debouncedSearch, statusFilter, clienteFilter])

  useRealtime('projetos', loadData)

  const handleEdit = (item: Projeto) => {
    setSelectedProjeto(item)
    setView('form')
  }
  const handleDetail = (item: Projeto) => {
    setSelectedProjeto(item)
    setView('detail')
  }
  const handleDelete = async (id: string) => {
    try {
      await deleteProjeto(id)
      toast({ title: 'Projeto excluído com sucesso' })
      loadData()
    } catch {
      toast({ title: 'Erro ao excluir', variant: 'destructive' })
    }
  }

  if (view === 'form') {
    return (
      <ProjectForm
        projeto={selectedProjeto}
        onBack={() => {
          setSelectedProjeto(null)
          setView('list')
          loadData()
        }}
      />
    )
  }
  if (view === 'detail' && selectedProjeto) {
    return (
      <ProjectDetail
        projeto={selectedProjeto}
        onBack={() => {
          setSelectedProjeto(null)
          setView('list')
        }}
        onEdit={() => setView('form')}
      />
    )
  }

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6 w-full space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar projetos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 w-[250px] md:w-[350px] bg-background"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px] bg-background">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              <SelectItem value="Em Andamento">Em Andamento</SelectItem>
              <SelectItem value="Concluído">Concluído</SelectItem>
              <SelectItem value="Cancelado">Cancelado</SelectItem>
              <SelectItem value="Suspenso">Suspenso</SelectItem>
            </SelectContent>
          </Select>
          <Select value={clienteFilter} onValueChange={setClienteFilter}>
            <SelectTrigger className="w-[200px] bg-background">
              <SelectValue placeholder="Cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos</SelectItem>
              {clientes.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.fantasia}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => {
              setSelectedProjeto(null)
              setView('form')
            }}
          >
            <Plus className="h-4 w-4 mr-2" /> Novo Projeto
          </Button>
        </div>
      </div>
      <Card className="shadow-sm">
        <div className="overflow-x-auto min-h-[400px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome do Projeto</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Propostas</TableHead>
                <TableHead>Data Criação</TableHead>
                <TableHead className="w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                    Nenhum projeto encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => (
                  <TableRow
                    key={item.id}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => handleDetail(item)}
                  >
                    <TableCell className="font-medium">{item.nome}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.expand?.cliente?.fantasia || '-'}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap',
                          statusColors[item.status] || 'bg-slate-100 text-slate-700',
                        )}
                      >
                        {item.status || '-'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">{proposalCounts[item.id] || 0}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(item.created).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(item)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {user?.role === 'admin' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
  )
}
