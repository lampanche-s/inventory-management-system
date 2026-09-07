import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  post: vi.fn(),
}))

vi.mock('./apiClient', () => ({
  apiClient: {
    post: mocks.post,
  },
}))

import { getBackupBancoPostgres } from './configuracoesApi'

describe('configuracoes API', () => {
  beforeEach(() => {
    mocks.post.mockReset()
  })

  it('sends the exact current password in the POST body and requests a blob', async () => {
    const backup = new Blob(['backup'])
    mocks.post.mockResolvedValue({ data: backup })

    const result = await getBackupBancoPostgres(' current password ')

    expect(result).toBe(backup)
    expect(mocks.post).toHaveBeenCalledWith(
      '/configuracoes/backup-banco',
      { senhaAtual: ' current password ' },
      {
        responseType: 'blob',
        headers: {
          Accept: 'application/octet-stream',
        },
      },
    )
  })
})
