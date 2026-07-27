import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, FilePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { EmitirPropostaForm } from './EmitirPropostaForm'
import { getProposta, type Proposta } from '@/services/propostas'
import { PageLoading } from '@/components/PageLoading'

export default function EmitirPropostaPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const proposalId = searchParams.get('id')

  const [selectedProposta, setSelectedProposta] = useState<Proposta | null>(null)
  const [loading, setLoading] = useState<boolean>(!!proposalId)

  useEffect(() => {
    if (!proposalId) {
      setSelectedProposta(null)
      setLoading(false)
      return
    }

    let mounted = true
    setLoading(true)
    getProposta(proposalId)
      .then((data) => {
        if (mounted) setSelectedProposta(data)
      })
      .catch((err) => {
        console.error('Failed to load proposal', err)
        if (mounted) setSelectedProposta(null)
      })
      .finally(() => {
        if (mounted) setLoading(false)
      })

    return () => {
      mounted = false
    }
  }, [proposalId])

  const handleSaved = () => {
    navigate('/controle-propostas/propostas-criadas')
  }

  const handleCancel = () => {
    navigate('/controle-propostas/propostas-criadas')
  }

  if (loading) {
    return <PageLoading />
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] bg-slate-50 overflow-hidden">
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="text-slate-600 hover:text-slate-900 gap-1 px-2 h-8"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Button>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-2">
            <FilePlus className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-semibold text-slate-800">
              {selectedProposta
                ? `Editar Proposta ${selectedProposta.numero_proposta}`
                : 'Emitir Proposta'}
            </h1>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-white">
        <EmitirPropostaForm
          key={selectedProposta?.id || 'new'}
          selectedProposta={selectedProposta}
          onSaved={handleSaved}
          onCancel={handleCancel}
        />
      </div>
    </div>
  )
}
