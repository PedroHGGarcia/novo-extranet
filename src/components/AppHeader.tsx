import { Bell, User } from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center gap-2 bg-brand-green px-4 text-white shadow-sm">
      <SidebarTrigger className="text-white hover:bg-white/10 hover:text-white focus-visible:ring-white/20" />
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10 hover:text-white rounded-full"
        >
          <Bell className="h-5 w-5" />
          <span className="sr-only">Notificações</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10 hover:text-white rounded-full"
        >
          <User className="h-6 w-6" />
          <span className="sr-only">Perfil</span>
        </Button>
      </div>
    </header>
  )
}
