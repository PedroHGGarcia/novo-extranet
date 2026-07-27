import { useState, useCallback, useEffect } from 'react'
import { getPropostasPaginated, updateProposta } from '@/services/propostas'
import { useRealtime } from '@/hooks/use-realtime'

interface PropostaFilters {
  search?: string
  status?: string
  dataInicio?: string
  dataFim?: string
}

interface UsePropostasOptions {
  page?: number
  perPage?: number
  sort?: string
  filters?: PropostaFilters
}

function buildFilter(filters: PropostaFilters): string {
  const parts: string[] = []
  if (filters.search) {
    const escaped = filters.search.replace(/"/g, '\\"')
    parts.push(`numero_proposta ~ "${escaped}"`)
  }
  if (filters.status) {
    parts.push(`status = "${filters.status}"`)
  }
  if (filters.dataInicio) {
    parts.push(`created >= "${filters.dataInicio}"`)
  }
  if (filters.dataFim) {
    parts.push(`created <= "${filters.dataFim}"`)
  }
  return parts.join(' && ')
}

export function usePropostas(options: UsePropostasOptions = {}) {
  const { page = 1, perPage = 50, sort = '-created', filters: initialFilters = {} } = options
  const [propostas, setPropostas] = useState<any[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<PropostaFilters>(initialFilters)

  const fetchPropostas = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const filter = buildFilter(filters)
      const res = await getPropostasPaginated(page, perPage, sort, filter)
      setPropostas(res.items)
      setTotalItems(res.totalItems)
      setTotalPages(res.totalPages)
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar propostas')
      setPropostas([])
    } finally {
      setIsLoading(false)
    }
  }, [page, perPage, sort, filters])

  useEffect(() => {
    fetchPropostas()
  }, [fetchPropostas])

  useRealtime('propostas', fetchPropostas)

  const createProposta = useCallback(async (data: any) => {
    const pb = (await import('@/lib/pocketbase/client')).default
    return pb.collection('propostas').create(data)
  }, [])

  const validateProposta = useCallback(async (id: string) => {
    return updateProposta(id, { status: 'Em Análise' })
  }, [])

  const approveProposta = useCallback(async (id: string) => {
    return updateProposta(id, { status: 'Aprovada' })
  }, [])

  return {
    propostas,
    totalItems,
    totalPages,
    isLoading,
    error,
    filters,
    setFilters,
    fetchPropostas,
    createProposta,
    updateProposta,
    validateProposta,
    approveProposta,
  }
}
