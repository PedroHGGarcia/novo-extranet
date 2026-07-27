import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { useRealtime } from '@/hooks/use-realtime'
import { PropostasCriadasList } from './PropostasCriadasList'
import { PropostasExcluidasList } from './PropostasExcluidasList'
import { EmitirPropostaForm } from './EmitirPropostaForm'
import type { Proposta } from '@/services/propostas'

type TabValue = 'propostas-criadas' | 'emitir-proposta' | 'propostas-excluidas'

const VALID_TABS: TabValue[] = ['propostas-criadas', 'emitir-proposta', 'propostas-excluidas']

export default function ControlePropostas() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [editingProposta, setEditingProposta] = useState<Proposta | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  useRealtime('propostas', () => {
    setRefreshKey((k) => k + 1)
  })

  const tabParam = searchParams.get('tab') as TabValue | null
  const activeTab: TabValue =
    tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'propostas-criadas'

  const handleTabChange = (value: string) => {
    setSearchParams(value === 'propostas-criadas' ? {} : { tab: value }, { replace: true })
  }

  const handleEdit = (proposta: Proposta) => {
    setEditingProposta(proposta)
    setSearchParams({ tab: 'emitir-proposta' }, { replace: true })
  }

  const handleSaved = () => {
    setEditingProposta(null)
    setRefreshKey((k) => k + 1)
    setSearchParams({ tab: 'propostas-criadas' }, { replace: true })
  }

  const handleCancel = () => {
    setEditingProposta(null)
    setSearchParams({ tab: 'propostas-criadas' }, { replace: true })
  }

  const handleNewProposta = () => {
    setEditingProposta(null)
    setSearchParams({ tab: 'emitir-proposta' }, { replace: true })
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-slate-50 overflow-hidden">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="flex flex-col flex-1 overflow-hidden"
      >
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 pt-3 shrink-0">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <TabsList className="bg-transparent h-11 w-full sm:w-auto justify-start p-0 gap-2">
              <TabsTrigger
                value="propostas-criadas"
                className="data-[state=active]:bg-[#337ab7] data-[state=active]:text-white text-slate-600 rounded-md h-9 px-3 sm:px-4 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
              >
                Propostas Criadas
              </TabsTrigger>
              <TabsTrigger
                value="emitir-proposta"
                onClick={handleNewProposta}
                className="data-[state=active]:bg-[#337ab7] data-[state=active]:text-white text-slate-600 rounded-md h-9 px-3 sm:px-4 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
              >
                Emitir Proposta
              </TabsTrigger>
              <TabsTrigger
                value="propostas-excluidas"
                className="data-[state=active]:bg-[#337ab7] data-[state=active]:text-white text-slate-600 rounded-md h-9 px-3 sm:px-4 text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
              >
                Propostas Excluídas
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent
          value="propostas-criadas"
          forceMount
          className={cn(
            'mt-0 flex-1 flex flex-col overflow-hidden',
            activeTab !== 'propostas-criadas' && 'hidden',
          )}
        >
          <PropostasCriadasList key={refreshKey} onEdit={handleEdit} />
        </TabsContent>

        <TabsContent
          value="emitir-proposta"
          forceMount
          className={cn(
            'mt-0 flex-1 flex flex-col overflow-hidden',
            activeTab !== 'emitir-proposta' && 'hidden',
          )}
        >
          <EmitirPropostaForm
            key={editingProposta?.id || 'new'}
            selectedProposta={editingProposta}
            onSaved={handleSaved}
            onCancel={handleCancel}
          />
        </TabsContent>

        <TabsContent
          value="propostas-excluidas"
          forceMount
          className={cn(
            'mt-0 flex-1 flex flex-col overflow-hidden',
            activeTab !== 'propostas-excluidas' && 'hidden',
          )}
        >
          <PropostasExcluidasList />
        </TabsContent>
      </Tabs>
    </div>
  )
}
