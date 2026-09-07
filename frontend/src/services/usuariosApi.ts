import { apiClient } from './apiClient'
import type { FrontendRole } from './authApi'

export type BackendRole = 'SUPER_ADMINISTRADOR' | 'ADMINISTRADOR' | 'USUARIO' | 'SOLICITANTE'

export type UsuarioApiResponse = {
  id: number
  nome: string
  usuario: string
  email: string | null
  perfil: BackendRole
  perfilLabel: string
  frontendRole: FrontendRole
  frontendRoleLabel: string
  ativo: boolean
  permissoes?: string[]
  createdAt?: string
  updatedAt?: string
  lastSeenAt?: string | null
  online?: boolean | null
  statusOnlineLabel?: string | null
  ultimaVezOnlineLabel?: string | null
}

export type PageResponse<T> = {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

export type ListUsuariosParams = {
  page: number
  size: number
  search?: string
  role?: FrontendRole | 'ALL'
  status?: 'ACTIVE' | 'INACTIVE' | 'ALL'
}

export type CreateUsuarioPayload = {
  nome: string
  usuario: string
  email?: string | null
  senha: string
  perfil: BackendRole
}

export type UpdateUsuarioPayload = {
  nome: string
  usuario: string
  email?: string | null
  senha?: string
  perfil: BackendRole
  ativo: boolean
}

export type AlterarMinhaSenhaPayload = {
  senhaAtual: string
  novaSenha: string
}

export function toBackendRole(role: FrontendRole): BackendRole {
  if (role === 'SUPER_ADMIN') {
    return 'SUPER_ADMINISTRADOR'
  }

  if (role === 'ADMIN') {
    return 'ADMINISTRADOR'
  }

  if (role === 'FUNCIONARIO') {
    return 'USUARIO'
  }

  return 'SOLICITANTE'
}

export function toFrontendRoleFromBackend(perfil: BackendRole): FrontendRole {
  if (perfil === 'SUPER_ADMINISTRADOR') {
    return 'SUPER_ADMIN'
  }

  if (perfil === 'ADMINISTRADOR') {
    return 'ADMIN'
  }

  if (perfil === 'USUARIO') {
    return 'FUNCIONARIO'
  }

  return 'SOLICITANTE'
}

export async function listUsuarios(params: ListUsuariosParams) {
  const queryParams = new URLSearchParams()

  queryParams.set('page', String(Math.max(params.page - 1, 0)))
  queryParams.set('size', String(params.size))
  queryParams.set('sort', 'nome,asc')

  if (params.search?.trim()) {
    queryParams.set('search', params.search.trim())
  }

  if (params.role && params.role !== 'ALL') {
    queryParams.set('perfil', toBackendRole(params.role))
  }

  if (params.status && params.status !== 'ALL') {
    queryParams.set('ativo', String(params.status === 'ACTIVE'))
  }

  const response = await apiClient.get<PageResponse<UsuarioApiResponse>>(
    `/usuarios?${queryParams.toString()}`,
  )

  return response.data
}

export async function createUsuario(payload: CreateUsuarioPayload) {
  const response = await apiClient.post<UsuarioApiResponse>('/usuarios', payload)

  return response.data
}

export async function updateUsuario(id: string, payload: UpdateUsuarioPayload) {
  const response = await apiClient.put<UsuarioApiResponse>(`/usuarios/${id}`, payload)

  return response.data
}

export async function deactivateUsuario(id: string) {
  const response = await apiClient.patch<UsuarioApiResponse>(`/usuarios/${id}/desativar`)

  return response.data
}

export async function reactivateUsuario(id: string) {
  const response = await apiClient.patch<UsuarioApiResponse>(`/usuarios/${id}/reativar`)

  return response.data
}

export async function deleteUsuario(id: string) {
  await apiClient.delete(`/usuarios/${id}`)
}
export async function alterarMinhaSenha(payload: AlterarMinhaSenhaPayload) {
  await apiClient.patch('/usuarios/minha-senha', payload)
}