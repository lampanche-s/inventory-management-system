import { apiClient } from './apiClient'

export type FrontendRole = 'SUPER_ADMIN' | 'ADMIN' | 'FUNCIONARIO' | 'SOLICITANTE'

export type AuthenticatedUserResponse = {
  id: number
  nome: string
  usuario: string
  email: string | null
  perfil: string
  perfilLabel: string
  frontendRole: FrontendRole
  frontendRoleLabel: string
  ativo: boolean
  permissoes: string[]
  createdAt?: string
  updatedAt?: string
  lastSeenAt?: string | null
}

export type LoginResponse = {
  token: string
  tipoToken: string
  expiresIn: number
  usuario: AuthenticatedUserResponse
}

export async function loginRequest(usuario: string, senha: string) {
  const response = await apiClient.post<LoginResponse>('/auth/login', {
    usuario,
    senha,
  })

  return response.data
}

export async function meRequest() {
  const response = await apiClient.get<AuthenticatedUserResponse>('/auth/me')

  return response.data
}