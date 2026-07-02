import { useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return null
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

function BiddingPermissionDenied() {
  const { toast } = useToast()
  useEffect(() => {
    toast({
      title: 'Acesso Negado',
      description: 'Você não tem permissão para acessar o módulo de Emitir Proposta de Licitação.',
      variant: 'destructive',
    })
  }, [])
  return <Navigate to="/dashboard" replace />
}

export function BiddingPermissionRoute() {
  const { user, loading } = useAuth()
  if (loading) return null
  const hasPermission = user?.role === 'admin' || user?.can_issue_bidding_proposals === true
  if (!hasPermission) return <BiddingPermissionDenied />
  return <Outlet />
}
