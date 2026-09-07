import { apiClient } from './apiClient'
import type { Supplier } from '../types/domain'
import { formatCpfCnpj, onlyDigits } from '../utils/masks'

export type FornecedorApiResponse = {
  id: number
  nome: string
  cnpj: string | null
  contato: string | null
  telefone: string | null
  email: string | null
  cidade: string | null
  cep: string | null
  logradouro: string | null
  bairro: string | null
  uf: string | null
  complemento: string | null
  score: number | null
  ativo: boolean
  createdAt?: string
  updatedAt?: string
}

export type FornecedorPayload = {
  nome: string
  cnpj?: string | null
  contato?: string | null
  telefone?: string | null
  email?: string | null
  cidade?: string | null
  cep?: string | null
  logradouro?: string | null
  bairro?: string | null
  uf?: string | null
  complemento?: string | null
  score?: number | null
  ativo?: boolean | null
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

export type ListFornecedoresParams = {
  page: number
  size: number
  search?: string
  status?: Supplier['status'] | 'ALL'
}

function emptyToNull(value: string | null | undefined) {
  const normalized = value?.trim()

  return normalized ? normalized : null
}

export function mapFornecedorToSupplier(fornecedor: FornecedorApiResponse): Supplier {
  return {
    id: String(fornecedor.id),
    name: fornecedor.nome,
    document: formatCpfCnpj(fornecedor.cnpj ?? ''),
    phone: fornecedor.telefone ?? '',
    email: fornecedor.email ?? '',
    cep: fornecedor.cep ?? '',
    address: fornecedor.logradouro ?? '',
    number: fornecedor.complemento ?? '',
    neighborhood: fornecedor.bairro ?? '',
    city: fornecedor.cidade ?? '',
    state: fornecedor.uf ?? '',
    status: fornecedor.ativo ? 'ACTIVE' : 'INACTIVE',
  }
}

export function mapSupplierToFornecedorPayload(supplier: Omit<Supplier, 'id'>): FornecedorPayload {
  return {
    nome: supplier.name.trim(),
    cnpj: onlyDigits(supplier.document) || null,
    contato: null,
    telefone: emptyToNull(supplier.phone),
    email: emptyToNull(supplier.email),
    cidade: emptyToNull(supplier.city),
    cep: emptyToNull(supplier.cep),
    logradouro: emptyToNull(supplier.address),
    bairro: emptyToNull(supplier.neighborhood),
    uf: emptyToNull(supplier.state)?.toUpperCase() ?? null,
    complemento: emptyToNull(supplier.number),
    score: 0,
    ativo: supplier.status === 'ACTIVE',
  }
}

export async function listFornecedores(params: ListFornecedoresParams) {
  const queryParams = new URLSearchParams()

  queryParams.set('page', String(Math.max(params.page - 1, 0)))
  queryParams.set('size', String(params.size))
  queryParams.set('sort', 'nome,asc')

  if (params.search?.trim()) {
    queryParams.set('search', params.search.trim())
  }

  if (params.status && params.status !== 'ALL') {
    queryParams.set('ativo', String(params.status === 'ACTIVE'))
  }

  const response = await apiClient.get<PageResponse<FornecedorApiResponse>>(
    `/fornecedores?${queryParams.toString()}`,
  )

  return response.data
}

export async function getFornecedor(id: string) {
  const response = await apiClient.get<FornecedorApiResponse>(`/fornecedores/${id}`)

  return response.data
}

export async function createFornecedor(payload: FornecedorPayload) {
  const response = await apiClient.post<FornecedorApiResponse>('/fornecedores', payload)

  return response.data
}

export async function updateFornecedor(id: string, payload: FornecedorPayload) {
  const response = await apiClient.put<FornecedorApiResponse>(`/fornecedores/${id}`, payload)

  return response.data
}

export async function deleteFornecedor(id: string) {
  await apiClient.delete(`/fornecedores/${id}`)
}