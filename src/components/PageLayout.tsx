import { ReactNode } from 'react'
import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface PageLayoutProps {
  title: string
  icon: LucideIcon
  children: ReactNode
}

export function PageLayout({ title, icon: Icon, children }: PageLayoutProps) {
  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-[calc(100vh-3.5rem)]">
      <div className="bg-white mb-4 shadow-sm border-b">
        {/* Title area */}
        <div className="flex items-center gap-2 p-4 pb-3 border-b">
          <Icon className="w-6 h-6 text-slate-800" />
          <h1 className="text-xl font-normal text-slate-800">{title}</h1>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 p-4">
          <Button className="bg-[#337ab7] hover:bg-[#286090] rounded text-xs font-semibold h-9 px-4 uppercase text-white">
            Pesquisar
          </Button>
          <Button className="bg-[#337ab7] hover:bg-[#286090] rounded text-xs font-semibold h-9 px-4 uppercase text-white">
            Novo
          </Button>
          <Button className="bg-[#337ab7] hover:bg-[#286090] rounded text-xs font-semibold h-9 px-4 uppercase text-white">
            Excluir
          </Button>
        </div>
      </div>

      {/* Main Content Area with Tabs */}
      <div className="px-4 flex-1 flex flex-col pb-4">
        <Tabs defaultValue="registros" className="flex-1 flex flex-col">
          <TabsList className="bg-transparent h-10 w-full justify-start p-0 flex border-b border-[#337ab7]">
            <TabsTrigger
              value="registros"
              className="data-[state=active]:bg-white data-[state=active]:border-t-2 data-[state=active]:border-t-[#337ab7] data-[state=active]:border-x data-[state=active]:border-x-slate-300 data-[state=active]:border-b-white data-[state=active]:border-b rounded-t-sm rounded-b-none h-10 px-6 text-sm text-slate-500 data-[state=active]:text-slate-700 relative top-[1px]"
            >
              Registros
            </TabsTrigger>
            <TabsTrigger
              value="cadastro"
              className="data-[state=active]:bg-white data-[state=active]:border-t-2 data-[state=active]:border-t-[#337ab7] data-[state=active]:border-x data-[state=active]:border-x-slate-300 data-[state=active]:border-b-white data-[state=active]:border-b rounded-t-sm rounded-b-none h-10 px-6 text-sm text-[#337ab7] relative top-[1px]"
            >
              Cadastro
            </TabsTrigger>
          </TabsList>

          <div className="bg-white border-x border-b border-[#dddddd] flex-1 shadow-sm overflow-hidden">
            {children}
          </div>
        </Tabs>
      </div>
    </div>
  )
}
