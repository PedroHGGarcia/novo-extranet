import { useState, useEffect, useCallback } from 'react'
import { History, RotateCcw, Loader2, Filter } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import {
  getHistoricoImportacoes,
  rollbackImportacao,
  isWithin24h,
  type HistoricoImportacao,
} from '@/services/historico-importacoes'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 20

export default function HistoricoImportacoes() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [historico, setHistorico] = useState<HistoricoImportacao[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [tipoFilter, setTipoFilter] = useState<string>('todos')
  const [isLoading, setIsLoading] = useState(true)
  const [rollbackTarget, setRollbackTarget] = useState<HistoricoImportacao | null>(null)
  const [isRollingBack, setIsRollingBack] = useState(false)

  const loadHistorico = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    try {
      let filter = `usuario = "${user.id}"`
      if (tipoFilter !== 'todos') filter += ` && tipo = "${tipoFilter}"`
      const res = await getHistoricoImportacoes(page, PAGE_SIZE, filter)
      setHistorico(res.items as HistoricoImportacao[])
      setTotalPages(res.totalPages)
      setTotalItems(res.totalItems)
    } catch {
      setHistorico([])
    } finally {
      setIsLoading(false)
    }
  }, [user, page, tipoFilter])

  useEffect(() => {
    loadHistorico()
  }, [loadHistorico])

  const handleRollback = async () => {
    if (!rollbackTarget) return
    setIsRollingBack(true)
    try {
      const { deleted } = await rollbackImportacao(rollbackTarget.id)
      toast({
        title: 'Reversão concluída',
        description: `${deleted} registro(s) removido(s).`,
        className: 'bg-emerald-600 text-white',
      })
      setRollbackTarget(null)
      await loadHistorico()
    } catch (err: any) {
      toast({
        title: 'Erro ao reverter importação',
        description: err?.message || 'Erro inesperado',
        variant: 'destructive',
      })
    } finally {
      setIsRollingBack(false)
    }
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      concluido: 'bg-green-100 text-green-700',
      parcial: 'bg-amber-100 text-amber-700',
      cancelado: 'bg-red-100 text-red-700',
    }
    return map[status] || 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6 w-full space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <History className="h-6 w-6 text-brand-green" />
            Histórico de Importações
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Acompanhe e reverta importações recentes (até 24h)
          </p>
        </div>
        <Select
          value={tipoFilter}
          onValueChange={(v) => {
            setTipoFilter(v)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-[180px] bg-background">
            <Filter className="h-4 w-4 mr-1.5 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            <SelectItem value="clientes">Clientes</SelectItem>
            <SelectItem value="produtos">Produtos</SelectItem>
            <SelectItem value="propostas">Propostas</SelectItem>
            <SelectItem value="representantes">Representantes</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="border-b">
          <CardTitle className="text-base">{totalItems} importação(ões) encontrada(s)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : historico.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground text-sm">
              Nenhuma importação encontrada.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Arquivo</TableHead>
                    <TableHead className="text-center">Total</TableHead>
                    <TableHead className="text-center">Sucesso</TableHead>
                    <TableHead className="text-center">Erros</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historico.map((h) => {
                    const canRollback =
                      (h.status === 'concluido' || h.status === 'parcial') && isWithin24h(h.created)
                    return (
                      <TableRow key={h.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(h.created).toLocaleString('pt-BR')}
                        </TableCell>
                        <TableCell className="font-medium capitalize">{h.tipo}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm">
                          {h.arquivo_original}
                        </TableCell>
                        <TableCell className="text-center">{h.quantidade_registros}</TableCell>
                        <TableCell className="text-center text-green-600 font-medium">
                          {h.quantidade_sucesso}
                        </TableCell>
                        <TableCell className="text-center text-red-600 font-medium">
                          {h.quantidade_erro}
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={cn(
                              'rounded-full px-2 py-0.5 text-xs font-medium',
                              statusBadge(h.status),
                            )}
                          >
                            {h.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          {canRollback ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setRollbackTarget(h)}
                              className="text-orange-600 hover:bg-orange-50"
                            >
                              <RotateCcw className="h-4 w-4 mr-1" /> Reverter
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
            Anterior
          </Button>
          <span className="text-sm font-medium">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Próximo
          </Button>
        </div>
      )}

      <Dialog open={!!rollbackTarget} onOpenChange={(open) => !open && setRollbackTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Reversão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja reverter a importação de{' '}
              <strong>{rollbackTarget?.arquivo_original}</strong>? Todos os{' '}
              <strong>{rollbackTarget?.quantidade_sucesso}</strong> registros criados serão
              excluídos. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRollbackTarget(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleRollback} disabled={isRollingBack}>
              {isRollingBack && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Reverter Importação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
