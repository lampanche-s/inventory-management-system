import { useEffect } from 'react'
import type { ReactNode } from 'react'
import { AppLoading } from '../components/ui/AppLoading'
import { meRequest } from '../services/authApi'
import { useAuthStore } from '../store/authStore'

type AuthBootstrapProps = {
  children: ReactNode
}

export function AuthBootstrap({ children }: AuthBootstrapProps) {
  const token = useAuthStore((state) => state.token)
  const isSessionChecked = useAuthStore((state) => state.isSessionChecked)
  const setSessionUser = useAuthStore((state) => state.setSessionUser)
  const setSessionChecking = useAuthStore((state) => state.setSessionChecking)
  const markSessionChecked = useAuthStore((state) => state.markSessionChecked)
  const logout = useAuthStore((state) => state.logout)

  useEffect(() => {
    let isMounted = true

    async function validateSession() {
      if (!token) {
        markSessionChecked()
        return
      }

      setSessionChecking(true)

      try {
        const user = await meRequest()

        if (isMounted) {
          setSessionUser(user)
        }
      } catch {
        if (isMounted) {
          logout()
        }
      }
    }

    validateSession()

    return () => {
      isMounted = false
    }
  }, [
    token,
    setSessionUser,
    setSessionChecking,
    markSessionChecked,
    logout,
  ])

  if (!isSessionChecked) {
    return <AppLoading />
  }

  return <>{children}</>
}
