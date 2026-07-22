import { useState, useEffect } from 'react'
import { getProjeto, type Projeto } from '@/services/projetos'
import { getPropostasPaginated, type Proposta } from '@/services/propostas'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ChevronLeft, Pencil, Building2, FileText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRealtime } from '@/hooks/use-realtime'

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
  const [projetoData, setProjetoData] = useState<Projeto>(projeto)
  const [propostas, setPropostas] = useState<Proposta[]>([])
  const [loading, setLoading] = useState(true)

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

  useRealtime('propostas', loadData)
  useRealtime('projetos', loadData)

  const totalProjeto = propostas
    .filter((p) => p.status !== 'Excluída')
    .reduce((acc, p) => acc + (p.valor_final || 0), 0)

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
          </CardTitle>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Total do Projeto</p>
            <p className="text-xl font-bold text-brand-blue">{formatCurrency(totalProjeto)}</p>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : propostas.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma proposta vinculada.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Versão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Valor Final</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {propostas.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium text-brand-blue">
                      {p.numero_proposta}
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
