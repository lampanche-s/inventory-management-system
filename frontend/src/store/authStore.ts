import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { SystemUser } from '../types/domain'
import type { AuthenticatedUserResponse, LoginResponse } from '../services/authApi'

type AuthRole = SystemUser['role']

type AuthUser = {
  id: string
  name: string
  username: string
  email: string
  role: AuthRole
  roleLabel: string
  permissions: string[]
}

type AuthStore = {
  token: string | null
  tokenType: string
  expiresIn: number | null
  currentUser: AuthUser | null
  currentRole: AuthRole
  isAuthenticated: boolean
  isSessionChecked: boolean
  isCheckingSession: boolean

  setSessionFromLogin: (response: LoginResponse) => void
  setSessionUser: (user: AuthenticatedUserResponse) => void
  setSessionChecking: (isCheckingSession: boolean) => void
  markSessionChecked: () => void
  logout: () => void
}

function mapApiUser(user: AuthenticatedUserResponse): AuthUser {
  return {
    id: String(user.id),
    name: user.nome,
    username: user.usuario,
    email: user.email ?? '',
    role: user.frontendRole,
    roleLabel: user.frontendRoleLabel,
    permissions: user.permissoes ?? [],
  }
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: null,
      tokenType: 'Bearer',
      expiresIn: null,
      currentUser: null,
      currentRole: 'ADMIN',
      isAuthenticated: false,
      isSessionChecked: false,
      isCheckingSession: false,

      setSessionFromLogin: (response) => {
        const mappedUser = mapApiUser(response.usuario)

        set({
          token: response.token,
          tokenType: response.tipoToken,
          expiresIn: response.expiresIn,
          currentUser: mappedUser,
          currentRole: mappedUser.role,
          isAuthenticated: true,
          isSessionChecked: true,
          isCheckingSession: false,
        })
      },

      setSessionUser: (user) => {
        const mappedUser = mapApiUser(user)

        set((state) => ({
          currentUser: mappedUser,
          currentRole: mappedUser.role,
          isAuthenticated: Boolean(state.token),
          isSessionChecked: true,
          isCheckingSession: false,
        }))
      },

      setSessionChecking: (isCheckingSession) => {
        set({
          isCheckingSession,
        })
      },

      markSessionChecked: () => {
        set({
          isSessionChecked: true,
          isCheckingSession: false,
        })
      },

      logout: () => {
        set({
          token: null,
          tokenType: 'Bearer',
          expiresIn: null,
          currentUser: null,
          currentRole: 'ADMIN',
          isAuthenticated: false,
          isSessionChecked: true,
          isCheckingSession: false,
        })
      },

    }),
    {
      name: 'stockroom-auth-store',
      partialize: (state) => ({
        token: state.token,
        tokenType: state.tokenType,
        expiresIn: state.expiresIn,
        currentUser: state.currentUser,
        currentRole: state.currentRole,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)

export function canCreateRequest(role: AuthRole) {
  return role === 'SOLICITANTE'
}

export function canManageRequests(role: AuthRole) {
  return role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'FUNCIONARIO'
}

export function isRequesterOnly(role: AuthRole) {
  return role === 'SOLICITANTE'
}
