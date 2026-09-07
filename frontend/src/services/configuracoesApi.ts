import { apiClient } from './apiClient'

export type ConfiguracaoResumoResponse = {
  itens: number
  movimentacoes: number
  fornecedores: number
  usuarios: number
  solicitacoes: number
  categorias: number
  totalRegistrosOperacionais: number
}

export async function getConfiguracaoResumo() {
  const response = await apiClient.get<ConfiguracaoResumoResponse>('/configuracoes/resumo')

  return response.data
}

export async function getBackupOperacional() {
  const response = await apiClient.get('/configuracoes/backup-operacional')

  return response.data
}

export async function getBackupBancoPostgres(senhaAtual: string) {
  const response = await apiClient.post<Blob>(
    '/configuracoes/backup-banco',
    { senhaAtual },
    {
      responseType: 'blob',
      headers: {
        Accept: 'application/octet-stream',
      },
    },
  )

  return response.data
}

export async function resetOperacional(confirmacao: string, senhaAtual: string) {
  await apiClient.post('/configuracoes/reset-operacional', {
    confirmacao,
    senhaAtual,
  })
}
