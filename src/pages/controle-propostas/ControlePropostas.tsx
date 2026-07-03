import { useLocation, useNavigate, Outlet } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import EmitirLicitacao from './EmitirLicitacao'
import DashboardLicitacoes from './DashboardLicitacoes'

export default function ControlePropostas() {
  const location = useLocation()
  const navigate = useNavigate()

  const activeTab = location.pathname.includes('/emitir') ? 'emitir' : 'dashboard'

  const handleTabChange = (value: string) => {
    navigate(value === 'emitir' ? '/controle-propostas/emitir' : '/controle-propostas/dashboard')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-slate-50 overflow-hidden">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="flex flex-col flex-1 overflow-hidden"
      >
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 pt-3 shrink-0">
          <div className="max-w-7xl mx-auto">
            <TabsList className="bg-transparent h-11 w-full sm:w-auto justify-start p-0 gap-2">
              <TabsTrigger
                value="dashboard"
                className="data-[state=active]:bg-[#337ab7] data-[state=active]:text-white text-slate-600 rounded-md h-9 px-3 sm:px-4 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
              >
                Dashboard de Licitações
              </TabsTrigger>
              <TabsTrigger
                value="emitir"
                className="data-[state=active]:bg-[#337ab7] data-[state=active]:text-white text-slate-600 rounded-md h-9 px-3 sm:px-4 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
              >
                Emitir Licitação
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent
          value="emitir"
          forceMount
          className={cn(
            'mt-0 flex-1 flex flex-col overflow-hidden p-4',
            activeTab !== 'emitir' && 'hidden',
          )}
        >
          <EmitirLicitacao />
        </TabsContent>
        <TabsContent
          value="dashboard"
          forceMount
          className={cn(
            'mt-0 flex-1 overflow-y-auto p-4 sm:p-6',
            activeTab !== 'dashboard' && 'hidden',
          )}
        >
          <DashboardLicitacoes />
        </TabsContent>
      </Tabs>
      <Outlet />
    </div>
  )
}
