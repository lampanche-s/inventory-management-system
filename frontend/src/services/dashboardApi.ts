import { apiClient } from './apiClient'
import type { MovimentacaoApiResponse } from './movimentacoesApi'

export type DashboardResumoApiResponse = {
  totalItens: number
  valorTotalEstoque: number
  itensAbaixoMinimo: number
  itensZerados: number
  movimentacoesHoje: number
  totalEntradasHoje: number
  totalSaidasHoje: number
}

export type EstoqueCriticoApiResponse = {
  itemId?: number
  itemNome?: string
  itemSku?: string
  categoria?: string
  quantidadeAtual?: number
  estoqueMinimo?: number
  statusEstoque?: string
  statusEstoqueLabel?: string
}

export type CurvaAbcApiResponse = {
  itemId?: number
  itemNome?: string
  itemSku?: string
  valorTotal?: number
  percentual?: number
  classe?: string
}

export type DashboardApiResponse = {
  resumo: DashboardResumoApiResponse
  estoqueCritico: EstoqueCriticoApiResponse[]
  ultimasMovimentacoes: MovimentacaoApiResponse[]
  curvaAbc: CurvaAbcApiResponse[]
}

export async function getDashboard() {
  const response = await apiClient.get<DashboardApiResponse>('/dashboard')

  return response.data
}