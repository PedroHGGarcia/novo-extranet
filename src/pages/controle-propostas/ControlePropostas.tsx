import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function ControlePropostas() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'emitir-proposta') {
      navigate('/controle-propostas/emitir-proposta', { replace: true })
    } else {
      navigate('/controle-propostas/propostas-criadas', { replace: true })
    }
  }, [searchParams, navigate])

  return null
}
