import { Outlet } from 'react-router-dom'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { AppHeader } from './AppHeader'

export default function Layout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex min-h-screen flex-col bg-brand-bg overflow-x-hidden">
        <AppHeader />
        <main className="flex-1 p-6 animate-fade-in">
          <Outlet />
        </main>
        <footer className="border-t bg-white py-4 text-center text-xs text-gray-500">
          <p>© 2017-2026 Pack System Soluções Web - Todos os direitos reservados.</p>
          <p className="my-1">11 3042.6242 | contato@packsystem.com.br</p>
          <p>© Shareware Software</p>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  )
}
