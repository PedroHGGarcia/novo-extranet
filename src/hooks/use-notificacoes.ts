import { useState, useCallback, useEffect, useRef } from 'react'
import {
  getNotificacoes,
  markAsRead,
  markAllAsRead,
  type Notificacao,
} from '@/services/notificacoes'
import { useAuth } from '@/hooks/use-auth'
import { useRealtime } from '@/hooks/use-realtime'

export function useNotificacoes() {
  const { user } = useAuth()
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const loadingRef = useRef(false)

  const fetchNotificacoes = useCallback(async () => {
    if (!user) return
    if (loadingRef.current) return
    loadingRef.current = true
    setIsLoading(true)
    try {
      const data = await getNotificacoes()
      setNotificacoes(data)
    } catch {
      setNotificacoes([])
    } finally {
      setIsLoading(false)
      loadingRef.current = false
    }
  }, [user])

  useEffect(() => {
    fetchNotificacoes()
  }, [fetchNotificacoes])

  const { connectionError } = useRealtime<Notificacao>('notificacoes', fetchNotificacoes, !!user)

  const naoLidas = notificacoes.filter((n) => !n.lida)

  const marcarComoLida = useCallback(async (id: string) => {
    try {
      await markAsRead(id)
      setNotificacoes((prev) => prev.map((n) => (n.id === id ? { ...n, lida: true } : n)))
    } catch {
      // ignore
    }
  }, [])

  const marcarTodasComoLidas = useCallback(async () => {
    const unreadIds = notificacoes.filter((n) => !n.lida).map((n) => n.id)
    if (unreadIds.length === 0) return
    try {
      await markAllAsRead(unreadIds)
      setNotificacoes((prev) => prev.map((n) => ({ ...n, lida: true })))
    } catch {
      // ignore
    }
  }, [notificacoes])

  return {
    notificacoes,
    naoLidas,
    isLoading,
    connectionError,
    marcarComoLida,
    marcarTodasComoLidas,
    fetchNotificacoes,
  }
}
