import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { navigationItems } from '../data/navigation'
import { useAuthStore } from '../store/authStore'

type RoleProtectedRouteProps = {
  children: ReactNode
}

function getFallbackPath(role: string) {
  return role === 'SOLICITANTE' ? '/requests' : '/dashboard'
}

function getProtectedNavigationPath(pathname: string) {
  const exactRoute = navigationItems.find((item) => item.path === pathname)

  if (exactRoute) {
    return exactRoute
  }

  const nestedRoute = navigationItems.find((item) => {
    if (item.path === '/') {
      return false
    }

    return pathname.startsWith(`${item.path}/`)
  })

  return nestedRoute
}

export function RoleProtectedRoute({ children }: RoleProtectedRouteProps) {
  const currentRole = useAuthStore((state) => state.currentRole)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  const currentRoute = getProtectedNavigationPath(location.pathname)

  if (!currentRoute) {
    return <Navigate to={getFallbackPath(currentRole)} replace />
  }

  const canAccess = currentRoute.allowedRoles.includes(currentRole)

  if (!canAccess) {
    return <Navigate to={getFallbackPath(currentRole)} replace />
  }

  return <>{children}</>
}
