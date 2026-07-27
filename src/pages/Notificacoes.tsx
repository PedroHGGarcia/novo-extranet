import { useState, useEffect, useCallback } from 'react'
import { Bell, CheckCheck, Filter } from 'lucide-react'
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
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import {
  getNotificacoes,
  markAsRead,
  markAllAsRead,
  type Notificacao,
} from '@/services/notificacoes'
import { useRealtime } from '@/hooks/use-realtime'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import pb from '@/lib/pocketbase/client'

const PAGE_SIZE = 20

export default function Notificacoes() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filter, setFilter] = useState<'todas' | 'naolidas' | 'lidas'>('todas')
  const [typeFilter, setTypeFilter] = useState<'todos' | 'info' | 'alerta' | 'sucesso'>('todos')
  const [isLoading, setIsLoading] = useState(true)

  const loadNotificacoes = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    try {
      let filterStr = `user = "${user.id}"`
      if (filter === 'naolidas') filterStr += ' && lida = false'
      if (filter === 'lidas') filterStr += ' && lida = true'
      if (typeFilter !== 'todos') filterStr += ` && tipo = "${typeFilter}"`

      const res = await pb.collection('notificacoes').getList<Notificacao>(page, PAGE_SIZE, {
        filter: filterStr,
        sort: '-created',
      })
      setNotificacoes(res.items)
      setTotalPages(res.totalPages)
    } catch {
      setNotificacoes([])
    } finally {
      setIsLoading(false)
    }
  }, [user, page, filter, typeFilter])

  useEffect(() => {
    loadNotificacoes()
  }, [loadNotificacoes])

  useRealtime<Notificacao>('notificacoes', loadNotificacoes, !!user)

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id)
      setNotificacoes((prev) => prev.map((n) => (n.id === id ? { ...n, lida: true } : n)))
    } catch {
      // ignore
    }
  }

  const handleMarkAll = async () => {
    const unreadIds = notificacoes.filter((n) => !n.lida).map((n) => n.id)
    if (unreadIds.length === 0) return
    try {
      await markAllAsRead(unreadIds)
      setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })))
      toast({ title: 'Todas as notificações foram marcadas como lidas' })
    } catch {
      toast({ title: 'Erro ao marcar notificações', variant: 'destructive' })
    }
  }

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6 w-full space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6 text-brand-green" />
            Notificações
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Gerencie todas as suas notificações</p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={filter}
            onValueChange={(v) => {
              setFilter(v as any)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-[140px] bg-background">
              <Filter className="h-4 w-4 mr-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem value="naolidas">Não lidas</SelectItem>
              <SelectItem value="lidas">Lidas</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={typeFilter}
            onValueChange={(v) => {
              setTypeFilter(v as any)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-[120px] bg-background">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos tipos</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="alerta">Alerta</SelectItem>
              <SelectItem value="sucesso">Sucesso</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleMarkAll}>
            <CheckCheck className="h-4 w-4 mr-2" /> Marcar todas
          </Button>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader className="border-b">
          <CardTitle className="text-base">Lista de Notificações</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : notificacoes.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground text-sm">
              Nenhuma notificação encontrada.
            </div>
          ) : (
            <div className="flex flex-col">
              {notificacoes.map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.lida && handleMarkAsRead(n.id)}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 border-b px-4 py-3 transition-colors hover:bg-muted/50',
                    !n.lida && 'bg-brand-green/5',
                  )}
                >
                  <div
                    className={cn(
                      'mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full',
                      n.tipo === 'info'
                        ? 'bg-blue-500'
                        : n.tipo === 'alerta'
                          ? 'bg-orange-500'
                          : 'bg-green-500',
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium', !n.lida && 'text-brand-green')}>
                      {n.titulo}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">{n.mensagem}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(n.created), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                </div>
              ))}
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
    </div>
  )
}
