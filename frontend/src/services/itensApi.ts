import { apiClient } from './apiClient'
import type { InventoryItem, ItemStatus, ItemUnit } from '../types/domain'
import { subtractDaysFromDateOnly } from '../utils/formatters'

export type BackendUnidadeMedida =
  | 'UNIDADE'
  | 'CAIXA'
  | 'PACOTE'
  | 'PAR'
  | 'LITRO'
  | 'QUILO'

export type BackendStatusEstoque =
  | 'ZERADO'
  | 'ABAIXO_MINIMO'
  | 'SAUDAVEL'

export type ItemApiResponse = {
  id: number
  nome: string
  sku: string
  categoria?: string | null
  categoriaLabel?: string | null
  unidade: BackendUnidadeMedida
  unidadeLabel?: string
  fornecedorId?: number | null
  fornecedorNome?: string | null
  corredor?: string | null
  prateleira?: string | null
  localizacao?: string | null
  localizacaoFormatada?: string | null
  quantidadeAtual?: number | null
  estoqueMinimo?: number | null
  precoMedio?: number | null
  valorEmEstoque?: number | null
  dataValidade?: string | null
  diasAvisoValidade?: number | null
  possuiValidade?: boolean
  validadeEmAlerta?: boolean
  validadeVencida?: boolean
  diasParaVencer?: number | null
  statusEstoque?: BackendStatusEstoque | null
  statusEstoqueLabel?: string | null
  abaixoDoMinimo?: boolean | null
  imagemUrl?: string | null
  ativo: boolean
  createdAt?: string
  updatedAt?: string
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

export type ListItensParams = {
  page: number
  size: number
  search?: string
  category?: string
  status?: ItemStatus | 'ALL'
  active?: boolean
}

export type CreateItemPayload = {
  nome: string
  sku?: string | null
  categoria: string
  unidade: BackendUnidadeMedida
  fornecedorId: number
  corredor?: string | null
  prateleira?: string | null
  localizacao?: string | null
  quantidadeInicial: number
  estoqueMinimo: number
  precoMedio: number
  dataValidade?: string | null
  diasAvisoValidade?: number | null
  imagemUrl?: string | null
}

export type UpdateItemPayload = {
  nome: string
  categoria: string
  unidade: BackendUnidadeMedida
  fornecedorId: number
  corredor?: string | null
  prateleira?: string | null
  localizacao?: string | null
  estoqueMinimo: number
  precoMedio: number
  dataValidade?: string | null
  diasAvisoValidade?: number | null
  imagemUrl?: string | null
}

export function mapFrontendStatusToBackend(
  status: ItemStatus | 'ALL',
): BackendStatusEstoque | null {
  if (status === 'OUT_OF_STOCK') {
    return 'ZERADO'
  }

  if (status === 'LOW_STOCK') {
    return 'ABAIXO_MINIMO'
  }

  if (status === 'NORMAL') {
    return 'SAUDAVEL'
  }

  return null
}

export function mapBackendStatusToFrontend(status: BackendStatusEstoque): ItemStatus {
  if (status === 'ZERADO') {
    return 'OUT_OF_STOCK'
  }

  if (status === 'ABAIXO_MINIMO') {
    return 'LOW_STOCK'
  }

  return 'NORMAL'
}

export function mapFrontendUnitToBackend(unit: ItemUnit): BackendUnidadeMedida {
  if (unit === 'CX') {
    return 'CAIXA'
  }

  if (unit === 'PCT') {
    return 'PACOTE'
  }

  if (unit === 'PAR') {
    return 'PAR'
  }

  if (unit === 'KG') {
    return 'QUILO'
  }

  if (unit === 'L') {
    return 'LITRO'
  }

  return 'UNIDADE'
}

export function mapBackendUnitToFrontend(unit: BackendUnidadeMedida): ItemUnit {
  if (unit === 'CAIXA') {
    return 'CX'
  }

  if (unit === 'PACOTE') {
    return 'PCT'
  }

  if (unit === 'PAR') {
    return 'PAR'
  }

  if (unit === 'QUILO') {
    return 'KG'
  }

  if (unit === 'LITRO') {
    return 'L'
  }

  return 'UN'
}

export function mapItemApiToInventoryItem(item: ItemApiResponse): InventoryItem {
  return {
    id: String(item.id),
    code: item.sku,
    name: item.nome,
    category: item.categoria ?? '',
    unit: mapBackendUnitToFrontend(item.unidade),
    currentStock: Number(item.quantidadeAtual ?? 0),
    minimumStock: Number(item.estoqueMinimo ?? 0),
    averagePrice: Number(item.precoMedio ?? 0),
    supplierId: item.fornecedorId ? String(item.fornecedorId) : null,
    supplierName: item.fornecedorNome ?? '',
    aisle: item.corredor ?? '',
    shelf: item.prateleira ?? '',
    location: item.localizacaoFormatada || item.localizacao || '',
    expirationDate: item.dataValidade ?? undefined,
    expirationWarningDate:
      item.dataValidade && item.diasAvisoValidade !== null && item.diasAvisoValidade !== undefined
        ? subtractDaysFromDateOnly(item.dataValidade, Number(item.diasAvisoValidade))
        : undefined,
    status: item.statusEstoque ? mapBackendStatusToFrontend(item.statusEstoque) : 'NORMAL',
    updatedAt: item.updatedAt ?? item.createdAt ?? new Date().toISOString(),
  }
}

export async function listItens(params: ListItensParams) {
  const queryParams = new URLSearchParams()

  queryParams.set('page', String(Math.max(params.page - 1, 0)))
  queryParams.set('size', String(params.size))
  queryParams.set('sort', 'nome,asc')
  queryParams.set('ativo', String(params.active ?? true))

  if (params.search?.trim()) {
    queryParams.set('search', params.search.trim())
  }

  if (params.category?.trim()) {
    queryParams.set('categoria', params.category.trim())
  }

  const backendStatus = mapFrontendStatusToBackend(params.status ?? 'ALL')

  if (backendStatus) {
    queryParams.set('status', backendStatus)
  }

  const response = await apiClient.get<PageResponse<ItemApiResponse>>(
    `/itens?${queryParams.toString()}`,
  )

  return response.data
}

export async function getItem(id: string) {
  const response = await apiClient.get<ItemApiResponse>(`/itens/${id}`)

  return response.data
}

export async function createItem(payload: CreateItemPayload) {
  const response = await apiClient.post<ItemApiResponse>('/itens', payload)

  return response.data
}

export async function updateItem(id: string, payload: UpdateItemPayload) {
  const response = await apiClient.put<ItemApiResponse>(`/itens/${id}`, payload)

  return response.data
}

export async function deactivateItem(id: string) {
  await apiClient.patch(`/itens/${id}/desativar`)
}

export async function reactivateItem(id: string) {
  await apiClient.patch(`/itens/${id}/reativar`)
}
