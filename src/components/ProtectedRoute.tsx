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
      description: 'Você não tem permissão para acessar este módulo.',
      variant: 'destructive',
    })
  }, [])
  return <Navigate to="/dashboard" replace />
}

export function BiddingPermissionRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return null

  if (user?.role === 'admin') return <Outlet />

  const isDashboardRoute = location.pathname.includes('/dashboard')
  const hasBiddingPerm = user?.can_issue_bidding_proposals === true
  const hasDashboardMenuAccess = hasMenuAccess(user, 'dashboard_licitacoes')

  if (isDashboardRoute) {
    if (!hasBiddingPerm && !hasDashboardMenuAccess) {
      return <BiddingPermissionDenied />
    }
  } else {
    if (!hasBiddingPerm) {
      return <BiddingPermissionDenied />
    }
  }

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
