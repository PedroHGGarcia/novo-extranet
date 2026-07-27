import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { getProjeto, type Projeto } from '@/services/projetos'
import { getPropostasPaginated, createPropostaRevision, type Proposta } from '@/services/propostas'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ChevronLeft,
  Pencil,
  Building2,
  FileText,
  Eye,
  Printer,
  GitBranch,
  Loader2,
  ShieldCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'

const formatCurrency = (v?: number) =>
  v ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v) : '-'

const statusColors: Record<string, string> = {
  'Em Andamento': 'bg-blue-100 text-blue-700',
  Concluído: 'bg-emerald-100 text-emerald-700',
  Cancelado: 'bg-rose-100 text-rose-700',
  Suspenso: 'bg-amber-100 text-amber-700',
}

const propStatusColors: Record<string, string> = {
  Aprovada: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Recusada: 'bg-rose-50 text-rose-700 border-rose-200',
  Excluída: 'bg-slate-100 text-slate-500 border-slate-300',
  'Em Análise': 'bg-amber-50 text-amber-700 border-amber-200',
}

export function ProjectDetail({
  projeto,
  onBack,
  onEdit,
}: {
  projeto: Projeto
  onBack: () => void
  onEdit: () => void
}) {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [projetoData, setProjetoData] = useState<Projeto>(projeto)
  const [propostas, setPropostas] = useState<Proposta[]>([])
  const [loading, setLoading] = useState(true)
  const [cloningId, setCloningId] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const loadData = async () => {
    try {
      const updated = await getProjeto(projeto.id)
      setProjetoData(updated)
      const res = await getPropostasPaginated(1, 100, '-created', `projeto = "${projeto.id}"`)
      setPropostas(res.items)
    } catch {
      /* intentionally ignored */
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [projeto.id])

  const debouncedReload = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => loadData(), 300)
  }

  useRealtime('propostas', debouncedReload)
  useRealtime('projetos', debouncedReload)

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const totalProjeto = propostas
    .filter((p) => p.status !== 'Excluída')
    .reduce((acc, p) => acc + (p.valor_final || 0), 0)

  const handleViewDetails = (propostaId: string) => {
    navigate(`/controle-propostas/emitir-proposta?edit=${propostaId}`)
  }

  const handleGeneratePDF = (propostaId: string) => {
    window.open(`/controle-propostas/proposta-pdf/${propostaId}`, '_blank')
  }

  const handleNewVersion = async (proposta: Proposta) => {
    setCloningId(proposta.id)
    try {
      const newRevision = await createPropostaRevision(proposta.id)
      toast({ title: 'Nova versão criada com sucesso' })
      navigate(`/controle-propostas/emitir-proposta?edit=${newRevision.id}`)
    } catch {
      toast({ title: 'Erro ao criar nova versão', variant: 'destructive' })
    } finally {
      setCloningId(null)
    }
  }

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6 w-full space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-2" /> Voltar
        </Button>
        <Button variant="outline" onClick={onEdit}>
          <Pencil className="h-4 w-4 mr-2" /> Editar
        </Button>
      </div>
      <Card className="shadow-sm">
        <CardHeader className="border-b">
          <CardTitle className="text-xl">{projetoData.nome}</CardTitle>
          <CardDescription>{projetoData.descricao || 'Sem descrição'}</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Cliente</p>
              <p className="font-medium">{projetoData.expand?.cliente?.fantasia || '-'}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <span
              className={cn(
                'px-2.5 py-1 rounded-full text-xs font-semibold',
                statusColors[projetoData.status] || 'bg-slate-100 text-slate-700',
              )}
            >
              {projetoData.status}
            </span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Responsável</p>
            <p className="font-medium">{projetoData.expand?.user?.name || 'Não definido'}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Data de Criação</p>
            <p className="font-medium">
              {new Date(projetoData.created).toLocaleDateString('pt-BR')}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card className="shadow-sm">
        <CardHeader className="border-b flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5" /> Propostas Vinculadas
            {propostas.some((p) => p.modelo_licitacao) && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0 h-5 bg-purple-50 text-purple-700 border-purple-200"
              >
                <ShieldCheck className="h-3 w-3 mr-1" />
                {propostas.filter((p) => p.modelo_licitacao).length} Licitação(ões)
              </Badge>
            )}
          </CardTitle>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total do Projeto</p>
            <p className="text-xl font-bold text-brand-blue">{formatCurrency(totalProjeto)}</p>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : propostas.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma proposta vinculada a este projeto.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Revisão</TableHead>
                  <TableHead>Versão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor Final</TableHead>
                  <TableHead>Data de Criação</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {propostas.map((p) => (
                  <TableRow
                    key={p.id}
                    className="cursor-pointer hover:bg-slate-50"
                    onClick={() => handleViewDetails(p.id)}
                  >
                    <TableCell className="font-medium text-brand-blue">
                      <div className="flex items-center gap-2">
                        {p.numero_proposta}
                        {p.modelo_licitacao && (
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1 py-0 h-4 bg-purple-50 text-purple-700 border-purple-200 uppercase whitespace-nowrap"
                          >
                            <ShieldCheck className="h-2.5 w-2.5 mr-0.5" />
                            Licitação
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {p.expand?.cliente?.fantasia || p.cliente_original || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {p.revisao || 'A'}
                      </Badge>
                    </TableCell>
                    <TableCell>{p.expand?.versao?.nome || p.versao_original || '-'}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs',
                          propStatusColors[p.status || ''] ||
                            'bg-amber-50 text-amber-700 border-amber-200',
                        )}
                      >
                        {p.status || 'Em Análise'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(p.valor_final)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(p.created).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Ver Detalhes"
                          onClick={() => handleViewDetails(p.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Gerar PDF"
                          onClick={() => handleGeneratePDF(p.id)}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Nova Versão"
                          disabled={cloningId === p.id}
                          onClick={() => handleNewVersion(p)}
                        >
                          {cloningId === p.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <GitBranch className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
