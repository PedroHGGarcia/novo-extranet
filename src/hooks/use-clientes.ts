import { useState, useCallback, useEffect } from 'react'
import {
  getClientesPaginated,
  createCliente as svcCreateCliente,
  updateCliente as svcUpdateCliente,
  deleteCliente as svcDeleteCliente,
} from '@/services/cadastros'
import { useRealtime } from '@/hooks/use-realtime'
import { useToast } from '@/hooks/use-toast'

interface UseClientesOptions {
  page?: number
  perPage?: number
  filter?: string
}

export function useClientes(options: UseClientesOptions = {}) {
  const { page = 1, perPage = 50, filter = '' } = options
  const [clientes, setClientes] = useState<any[]>([])
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchClientes = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await getClientesPaginated(page, perPage, filter)
      setClientes(res.items)
      setTotalItems(res.totalItems)
      setTotalPages(res.totalPages)
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar clientes')
      setClientes([])
    } finally {
      setIsLoading(false)
    }
  }, [page, perPage, filter])

  useEffect(() => {
    fetchClientes()
  }, [fetchClientes])

  useRealtime('clientes', fetchClientes)

  const getCliente = useCallback(async (id: string) => {
    const pb = (await import('@/lib/pocketbase/client')).default
    return pb.collection('clientes').getOne(id)
  }, [])

  const createCliente = useCallback(
    async (data: any) => {
      try {
        const result = await svcCreateCliente(data)
        toast({ title: 'Cliente criado com sucesso' })
        await fetchClientes()
        return result
      } catch (err: any) {
        toast({ title: 'Erro ao criar cliente', variant: 'destructive' })
        throw err
      }
    },
    [fetchClientes, toast],
  )

  const updateCliente = useCallback(
    async (id: string, data: any) => {
      try {
        const result = await svcUpdateCliente(id, data)
        toast({ title: 'Cliente atualizado com sucesso' })
        await fetchClientes()
        return result
      } catch (err: any) {
        toast({ title: 'Erro ao atualizar cliente', variant: 'destructive' })
        throw err
      }
    },
    [fetchClientes, toast],
  )

  const deleteCliente = useCallback(
    async (id: string) => {
      try {
        await svcDeleteCliente(id)
        toast({ title: 'Cliente excluído com sucesso' })
        await fetchClientes()
      } catch (err: any) {
        toast({ title: 'Erro ao excluir cliente', variant: 'destructive' })
        throw err
      }
    },
    [fetchClientes, toast],
  )

  return {
    clientes,
    totalItems,
    totalPages,
    isLoading,
    error,
    fetchClientes,
    getCliente,
    createCliente,
    updateCliente,
    deleteCliente,
  }
}
