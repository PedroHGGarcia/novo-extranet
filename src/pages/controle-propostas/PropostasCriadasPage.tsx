import { useNavigate } from 'react-router-dom'
import { Plus, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PropostasCriadasList } from './PropostasCriadasList'
import type { Proposta } from '@/services/propostas'

export default function PropostasCriadasPage() {
  const navigate = useNavigate()

  const handleEdit = (proposta: Proposta) => {
    navigate(`/controle-propostas/emitir-proposta?id=${proposta.id}`)
  }

  const handleNewProposta = () => {
    navigate('/controle-propostas/emitir-proposta')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-slate-50 overflow-hidden">
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold text-slate-800">Propostas Criadas</h1>
        </div>
        <Button
          onClick={handleNewProposta}
          className="bg-primary hover:bg-primary/90 text-primary-foreground gap-2 h-9 px-4 text-xs font-medium"
        >
          <Plus className="h-4 w-4" /> Emitir Proposta
        </Button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <PropostasCriadasList onEdit={handleEdit} />
      </div>
    </div>
  )
}
