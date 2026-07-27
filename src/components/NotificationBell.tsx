import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useNotificacoes } from '@/hooks/use-notificacoes'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function NotificationBell() {
  const { notificacoes, naoLidas, marcarComoLida, marcarTodasComoLidas } = useNotificacoes()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full text-white hover:bg-white/10 hover:text-white"
        >
          <Bell className="h-5 w-5 select-none" draggable={false} />
          {naoLidas.length > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm">
              {naoLidas.length > 9 ? '9+' : naoLidas.length}
            </span>
          )}
          <span className="sr-only">Notificações</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <span className="text-sm font-semibold">Notificações</span>
          {naoLidas.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={marcarTodasComoLidas}
              className="h-auto px-2 py-1 text-xs text-brand-green hover:text-brand-green/80"
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>
        <ScrollArea className="h-80">
          {notificacoes.length > 0 ? (
            <div className="flex flex-col">
              {notificacoes.slice(0, 20).map((n) => (
                <div
                  key={n.id}
                  onClick={() => !n.lida && marcarComoLida(n.id)}
                  className={cn(
                    'flex cursor-pointer flex-col gap-1 border-b px-4 py-3 text-sm transition-colors hover:bg-muted/50',
                    !n.lida && 'bg-brand-green/5',
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className={cn('font-medium', !n.lida && 'text-brand-green')}>
                      {n.titulo}
                    </span>
                    {!n.lida && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-green" />}
                  </div>
                  <span className="line-clamp-2 text-muted-foreground">{n.mensagem}</span>
                  <span className="mt-1 text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(n.created), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              Sem novas notificações
            </div>
          )}
        </ScrollArea>
        {notificacoes.length > 0 && (
          <div className="border-t p-2 text-center">
            <Link
              to="/notificacoes"
              className="text-xs font-medium text-brand-green hover:underline"
            >
              Ver todas
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
