import { apiClient } from './apiClient'
import type { InventoryMovement, MovementType } from '../types/domain'

export type BackendTipoMovimentacao = 'ENTRADA' | 'SAIDA'

export type BackendMotivoMovimentacao =
  | 'REPOSICAO_ESTOQUE'
  | 'USO_INTERNO'
  | 'TRANSFERENCIA_SETOR'
  | 'AJUSTE_INVENTARIO'
  | 'DEVOLUCAO'
  | 'PERDA_AVARIA'

export type MovimentacaoApiResponse = {
  id: number
  itemId: number
  itemNome: string
  itemSku: string
  tipo: BackendTipoMovimentacao
  tipoLabel?: string
  quantidade: number
  motivo: BackendMotivoMovimentacao | 'CADASTRO_INICIAL'
  motivoLabel?: string
  observacao?: string | null
  usuarioId: number
  usuarioNome: string
  dataHora: string
  saldoAnterior: number
  saldoPosterior: number
}

export type MovimentacaoPayload = {
  itemId: number
  tipo: BackendTipoMovimentacao
  quantidade: number
  motivo: BackendMotivoMovimentacao
  observacao?: string | null
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

export type ListMovimentacoesParams = {
  page: number
  size: number
  search?: string
  type?: MovementType | 'ALL'
  itemId?: string
  data?: string
  dataInicio?: string
  dataFim?: string
}

function extractRequesterName(observacao?: string | null) {
  if (!observacao) {
    return undefined
  }

  const match = observacao.match(/(?:Requester|Solicitante):\s*([^|]+)/i)

  return match?.[1]?.trim() || undefined
}

function cleanObservation(observacao?: string | null) {
  if (!observacao) {
    return ''
  }

  return observacao
    .replace(/^(?:Requester|Solicitante):\s*[^|]+(\s*\|\s*)?/i, '')
    .trim()
}

export function getMovementReasonLabel(reason: BackendMotivoMovimentacao | 'CADASTRO_INICIAL') {
  const labels: Record<BackendMotivoMovimentacao | 'CADASTRO_INICIAL', string> = {
    REPOSICAO_ESTOQUE: 'Stock replenishment',
    USO_INTERNO: 'Internal use',
    TRANSFERENCIA_SETOR: 'Department transfer',
    AJUSTE_INVENTARIO: 'Inventory adjustment',
    DEVOLUCAO: 'Return',
    PERDA_AVARIA: 'Loss / damage',
    CADASTRO_INICIAL: 'Initial stock',
  }

  return labels[reason]
}

function buildMovementReason(movimentacao: MovimentacaoApiResponse) {
  const motivo = getMovementReasonLabel(movimentacao.motivo)
  const requesterName = extractRequesterName(movimentacao.observacao)
  const observacao = cleanObservation(movimentacao.observacao)

  const detalhes = [
    requesterName ? `Requester: ${requesterName}` : null,
    observacao || null,
  ].filter(Boolean)

  if (detalhes.length === 0) {
    return motivo
  }

  return `${motivo} · ${detalhes.join(' · ')}`
}

export function mapFrontendMovementTypeToBackend(type: MovementType): BackendTipoMovimentacao {
  return type === 'IN' ? 'ENTRADA' : 'SAIDA'
}

export function mapBackendMovementTypeToFrontend(type: BackendTipoMovimentacao): MovementType {
  return type === 'ENTRADA' ? 'IN' : 'OUT'
}

export function mapMovimentacaoToInventoryMovement(
  movimentacao: MovimentacaoApiResponse,
): InventoryMovement {
  return {
    id: String(movimentacao.id),
    itemCode: movimentacao.itemSku,
    itemName: movimentacao.itemNome,
    type: mapBackendMovementTypeToFrontend(movimentacao.tipo),
    quantity: Number(movimentacao.quantidade ?? 0),
    userName: movimentacao.usuarioNome,
    requesterName: extractRequesterName(movimentacao.observacao),
    reason: buildMovementReason(movimentacao),
    createdAt: movimentacao.dataHora,
  }
}

export async function listMovimentacoes(params: ListMovimentacoesParams) {
  const queryParams = new URLSearchParams()

  queryParams.set('page', String(Math.max(params.page - 1, 0)))
  queryParams.set('size', String(params.size))
  queryParams.set('sort', 'dataHora,desc')

  if (params.search?.trim()) {
    queryParams.set('search', params.search.trim())
  }

  if (params.type && params.type !== 'ALL') {
    queryParams.set('tipo', mapFrontendMovementTypeToBackend(params.type))
  }

  if (params.itemId?.trim()) {
    queryParams.set('itemId', params.itemId.trim())
  }

  if (params.data?.trim()) {
    queryParams.set('data', params.data.trim())
  }

  if (params.dataInicio?.trim()) {
    queryParams.set('dataInicio', params.dataInicio.trim())
  }

  if (params.dataFim?.trim()) {
    queryParams.set('dataFim', params.dataFim.trim())
  }

  const response = await apiClient.get<PageResponse<MovimentacaoApiResponse>>(
    `/movimentacoes?${queryParams.toString()}`,
  )

  return response.data
}

export async function listMovimentacoesRecentes(limit = 5) {
  const response = await apiClient.get<MovimentacaoApiResponse[]>(
    `/movimentacoes/recentes?limit=${limit}`,
  )

  return response.data
}

export async function createMovimentacao(payload: MovimentacaoPayload) {
  const response = await apiClient.post<MovimentacaoApiResponse>('/movimentacoes', payload)

  return response.data
}
