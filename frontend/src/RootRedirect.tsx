import { Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

export function RootRedirect() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const currentRole = useAuthStore((state) => state.currentRole)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (currentRole === 'SOLICITANTE') {
    return <Navigate to="/requests" replace />
  }

  return <Navigate to="/dashboard" replace />
}
