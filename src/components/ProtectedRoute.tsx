import { useEffect } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { hasMenuAccess, getMenuKeyForPath } from '@/lib/menu-access'

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

export function MenuAccessGuard() {
  const location = useLocation()
  const { user, loading } = useAuth()
  const { toast } = useToast()

  if (loading) return null

  const menuKey = getMenuKeyForPath(location.pathname)
  if (menuKey && !hasMenuAccess(user, menuKey)) {
    toast({ title: 'Você não tem permissão para acessar esta área.', variant: 'destructive' })
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
