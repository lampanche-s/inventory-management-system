import axios from 'axios'

export type ApiErrorResponse = {
  timestamp?: string
  status?: number
  error?: string
  message?: string
  detail?: string
  path?: string
  fieldErrors?: Array<{
    field: string
    message: string
  }> | null
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

apiClient.interceptors.request.use((config) => {
  const rawStore = localStorage.getItem('stockroom-auth-store')

  if (!rawStore) {
    return config
  }

  try {
    const parsedStore = JSON.parse(rawStore)
    const token = parsedStore?.state?.token

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  } catch {
    return config
  }

  return config
})
