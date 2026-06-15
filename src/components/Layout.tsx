import { Outlet, useLocation } from 'react-router-dom'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from './AppSidebar'
import { AppHeader } from './AppHeader'

export default function Layout() {
  const location = useLocation()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex min-h-screen flex-col bg-brand-bg overflow-x-hidden">
        <AppHeader />
        <main key={location.pathname} className="flex-1 p-6 animate-in fade-in duration-500">
          <Outlet />
        </main>
        <footer className="border-t bg-white py-4 text-center text-xs text-gray-500">
          <p>
            Desenvolvido por <span className="text-[#00704a] font-medium">Skip</span> e{' '}
            <span className="text-[#00704a] font-medium">Pedro Garcia</span>
          </p>
        </footer>
      </SidebarInset>
    </SidebarProvider>
  )
}
