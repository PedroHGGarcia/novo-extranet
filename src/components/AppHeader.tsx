import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, User, LogOut, User as UserIcon } from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'
import {
  getNotificacoes,
  markAsRead,
  markAllAsRead,
  type Notificacao,
} from '@/services/notificacoes'
import { cn } from '@/lib/utils'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
export function AppHeader() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])

  const loadNotificacoes = async () => {
    if (!user) return
    try {
      const data = await getNotificacoes()
      setNotificacoes(data)
    } catch (e) {
      // ignore
    }
  }

  useEffect(() => {
    loadNotificacoes()
  }, [user])

  useRealtime<Notificacao>(
    'notificacoes',
    () => {
      loadNotificacoes()
    },
    !!user,
  )

  const unreadCount = notificacoes.filter((n) => !n.lida).length

  const handleSignOut = () => {
    signOut()
    navigate('/login')
  }

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id)
      setNotificacoes((prev) => prev.map((n) => (n.id === id ? { ...n, lida: true } : n)))
    } catch (e) {
      // ignore
    }
  }

  const handleMarkAllAsRead = async () => {
    const unreadIds = notificacoes.filter((n) => !n.lida).map((n) => n.id)
    if (unreadIds.length === 0) return
    try {
      await markAllAsRead(unreadIds)
      setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })))
    } catch (e) {
      // ignore
    }
  }

  return (
    <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center gap-2 bg-brand-green px-4 text-white shadow-sm">
      <SidebarTrigger className="text-white hover:bg-white/10 hover:text-white focus-visible:ring-white/20" />
      <div className="flex-1 md:hidden flex justify-center select-none flex-col items-center">
        <span className="text-lg font-black tracking-widest text-white leading-none">BENER</span>
      </div>
      <div className="hidden md:flex flex-1" />
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative rounded-full text-white hover:bg-white/10 hover:text-white"
            >
              <Bell className="h-5 w-5 select-none" draggable={false} />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
              <span className="sr-only">Notificações</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <span className="text-sm font-semibold">Notificações</span>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="h-auto px-2 py-1 text-xs text-brand-green hover:text-brand-green/80"
                >
                  Marcar todas como lidas
                </Button>
              )}
            </div>
            <ScrollArea className="h-80">
              {notificacoes.length > 0 ? (
                <div className="flex flex-col">
                  {notificacoes.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => !n.lida && handleMarkAsRead(n.id)}
                      className={cn(
                        'flex cursor-pointer flex-col gap-1 border-b px-4 py-3 text-sm transition-colors hover:bg-muted/50',
                        !n.lida && 'bg-brand-green/5',
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className={cn('font-medium', !n.lida && 'text-brand-green')}>
                          {n.titulo}
                        </span>
                        {!n.lida && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-brand-green" />
                        )}
                      </div>
                      <span className="line-clamp-2 text-muted-foreground">{n.mensagem}</span>
                      <span className="mt-1 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(n.created), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
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
          </PopoverContent>
        </Popover>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full text-white hover:bg-white/10 hover:text-white"
            >
              <User className="h-6 w-6 select-none" draggable={false} />
              <span className="sr-only">Perfil</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name || 'Usuário'}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                to="/perfil"
                draggable={false}
                className="flex w-full cursor-pointer items-center select-none"
              >
                <UserIcon className="mr-2 h-4 w-4 select-none" draggable={false} />
                <span>Perfil</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="cursor-pointer text-red-600 focus:bg-red-50 focus:text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4 select-none" draggable={false} />
              <span>Sair</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
