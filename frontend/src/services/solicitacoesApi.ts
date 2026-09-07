import { apiClient } from './apiClient'
import type {
  RequestStatus,
  StockRequest,
} from '../types/domain'
import type {
  BackendMotivoMovimentacao,
  BackendTipoMovimentacao,
} from './movimentacoesApi'
import { getMovementReasonLabel } from './movimentacoesApi'

export type BackendStatusSolicitacao =
  | 'PENDENTE'
  | 'APROVADA'
  | 'REJEITADA'
  | 'CANCELADA'

export type SolicitacaoApiResponse = {
  id: number
  itemId: number
  itemNome: string
  itemSku: string
  solicitanteId: number
  solicitanteNome: string
  solicitanteUsuario: string
  aprovadorId?: number | null
  aprovadorNome?: string | null
  aprovadorUsuario?: string | null
  movimentacaoId?: number | null
  tipo: BackendTipoMovimentacao
  tipoLabel?: string
  quantidade: number
  motivo: BackendMotivoMovimentacao
  motivoLabel?: string
  observacao?: string | null
  codigoPedido?: string | null
  ordemNoPedido?: number | null
  status: BackendStatusSolicitacao
  statusLabel?: string
  justificativaDecisao?: string | null
  dataSolicitacao: string
  dataDecisao?: string | null
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

export type ListSolicitacoesParams = {
  page: number
  size: number
  search?: string
  status?: RequestStatus | 'ALL'
  data?: string
}

export type CreateSolicitacaoPayload = {
  itemId: number
  tipo: BackendTipoMovimentacao
  quantidade: number
  motivo: BackendMotivoMovimentacao
  observacao?: string | null
}

export type CreateSolicitacaoLotePayload = {
  itens: Array<{
    itemId: number
    quantidade: number
  }>
  tipo: BackendTipoMovimentacao
  motivo: BackendMotivoMovimentacao
  observacao?: string | null
}

export type CreateSolicitacaoLoteResponse = {
  codigoPedido: string
  totalItens: number
  solicitacoes: SolicitacaoApiResponse[]
}

export type DecidirSolicitacaoPayload = {
  justificativa?: string | null
}

export function mapFrontendRequestStatusToBackend(
  status: RequestStatus | 'ALL',
): BackendStatusSolicitacao | null {
  if (status === 'PENDING') {
    return 'PENDENTE'
  }

  if (status === 'APPROVED') {
    return 'APROVADA'
  }

  if (status === 'REJECTED') {
    return 'REJEITADA'
  }

  if (status === 'CANCELED') {
    return 'CANCELADA'
  }

  return null
}

export function mapBackendRequestStatusToFrontend(
  status: BackendStatusSolicitacao,
): RequestStatus {
  if (status === 'APROVADA') {
    return 'APPROVED'
  }

  if (status === 'REJEITADA') {
    return 'REJECTED'
  }

  if (status === 'CANCELADA') {
    return 'CANCELED'
  }

  return 'PENDING'
}

export function mapSolicitacaoToStockRequest(
  solicitacao: SolicitacaoApiResponse,
): StockRequest {
  return {
    id: String(solicitacao.id),
    itemCode: solicitacao.itemSku,
    itemName: solicitacao.itemNome,
    quantity: Number(solicitacao.quantidade ?? 0),
    requesterId: String(solicitacao.solicitanteId),
    requesterName: solicitacao.solicitanteNome,
    requestReason: solicitacao.observacao || getMovementReasonLabel(solicitacao.motivo),
    requestBatchCode: solicitacao.codigoPedido ?? undefined,
    requestBatchOrder: solicitacao.ordemNoPedido ?? undefined,
    status: mapBackendRequestStatusToFrontend(solicitacao.status),
    createdAt: solicitacao.dataSolicitacao,
    decisionNote: solicitacao.justificativaDecisao ?? undefined,
    decidedByName: solicitacao.aprovadorNome ?? undefined,
    decidedAt: solicitacao.dataDecisao ?? undefined,
  }
}

function buildQueryParams(params: ListSolicitacoesParams) {
  const queryParams = new URLSearchParams()

  queryParams.set('page', String(Math.max(params.page - 1, 0)))
  queryParams.set('size', String(params.size))
  queryParams.set('sort', 'dataSolicitacao,desc')

  if (params.search?.trim()) {
    queryParams.set('search', params.search.trim())
  }

  const backendStatus = mapFrontendRequestStatusToBackend(params.status ?? 'ALL')

  if (backendStatus) {
    queryParams.set('status', backendStatus)
  }

  if (params.data?.trim()) {
    queryParams.set('data', params.data.trim())
  }

  return queryParams
}

export async function listSolicitacoes(params: ListSolicitacoesParams) {
  const response = await apiClient.get<PageResponse<SolicitacaoApiResponse>>(
    `/solicitacoes?${buildQueryParams(params).toString()}`,
  )

  return response.data
}

export async function listMinhasSolicitacoes(params: ListSolicitacoesParams) {
  const response = await apiClient.get<PageResponse<SolicitacaoApiResponse>>(
    `/solicitacoes/minhas?${buildQueryParams(params).toString()}`,
  )

  return response.data
}

export async function createSolicitacao(payload: CreateSolicitacaoPayload) {
  const response = await apiClient.post<SolicitacaoApiResponse>('/solicitacoes', payload)

  return response.data
}

export async function createSolicitacoesLote(payload: CreateSolicitacaoLotePayload) {
  const response = await apiClient.post<CreateSolicitacaoLoteResponse>('/solicitacoes/lote', payload)

  return response.data
}

export async function approveSolicitacao(
  id: string,
  payload: DecidirSolicitacaoPayload,
) {
  const response = await apiClient.post<SolicitacaoApiResponse>(
    `/solicitacoes/${id}/aprovar`,
    payload,
  )

  return response.data
}

export async function rejectSolicitacao(
  id: string,
  payload: DecidirSolicitacaoPayload,
) {
  const response = await apiClient.post<SolicitacaoApiResponse>(
    `/solicitacoes/${id}/rejeitar`,
    payload,
  )

  return response.data
}

export async function cancelSolicitacao(id: string) {
  const response = await apiClient.post<SolicitacaoApiResponse>(
    `/solicitacoes/${id}/cancelar`,
  )

  return response.data
}
