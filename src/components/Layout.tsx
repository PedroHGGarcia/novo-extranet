import { useLocation } from 'react-router-dom'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { AppHeader } from './AppHeader'
import { MenuAccessGuard } from './ProtectedRoute'

export default function Layout() {
  const location = useLocation()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex min-h-screen flex-col bg-slate-50 dark:bg-[hsl(222,47%,7%)] overflow-x-hidden">
        <AppHeader />
        <main
          key={location.pathname}
          className="flex-1 p-4 md:p-6 lg:p-8 animate-in fade-in duration-500"
        >
          <MenuAccessGuard />
        </main>
        <footer className="border-t border-border bg-white dark:bg-card py-4 text-center text-xs text-muted-foreground select-none">
          <p>
            Desenvolvido por{' '}
            <span className="text-brand-green font-medium">Pedro Garcia - Comercial</span>
          </p>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  )
}
