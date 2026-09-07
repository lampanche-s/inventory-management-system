import { apiClient } from './apiClient'
import type { InventoryCategory } from '../types/domain'

export type CategoriaApiResponse = {
  id: number
  nome: string
  ativo?: boolean
  createdAt?: string
  updatedAt?: string
}

export type CategoriaPayload = {
  nome: string
}

export function mapCategoriaToInventoryCategory(
  categoria: CategoriaApiResponse,
): InventoryCategory {
  return {
    id: String(categoria.id),
    name: categoria.nome,
    createdAt: categoria.createdAt ?? new Date().toISOString(),
  }
}

export async function listCategorias() {
  const response = await apiClient.get<CategoriaApiResponse[]>('/categorias')

  return response.data
}

export async function createCategoria(payload: CategoriaPayload) {
  const response = await apiClient.post<CategoriaApiResponse>('/categorias', payload)

  return response.data
}

export async function updateCategoria(id: string, payload: CategoriaPayload) {
  const response = await apiClient.put<CategoriaApiResponse>(`/categorias/${id}`, payload)

  return response.data
}

export async function deleteCategoria(id: string) {
  await apiClient.delete(`/categorias/${id}`)
}

export async function linkItemCategoria(categoriaId: string, itemId: string) {
  const response = await apiClient.post(`/categorias/${categoriaId}/itens/${itemId}`)

  return response.data
}

export async function unlinkItemCategoria(categoriaId: string, itemId: string) {
  const response = await apiClient.delete(`/categorias/${categoriaId}/itens/${itemId}`)

  return response.data
}