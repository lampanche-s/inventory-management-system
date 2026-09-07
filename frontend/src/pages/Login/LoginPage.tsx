import { useState } from 'react'
import type { FormEvent } from 'react'
import axios from 'axios'
import {
  Boxes,
  Eye,
  EyeOff,
  LockKeyhole,
  UserRound,
} from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button } from '../../components/ui'
import { loginRequest } from '../../services/authApi'
import type { ApiErrorResponse } from '../../services/apiClient'
import { useAuthStore } from '../../store/authStore'
import type { SystemUser } from '../../types/domain'

type LoginFormState = {
  username: string
  password: string
}

const initialForm: LoginFormState = {
  username: '',
  password: '',
}

function getDestinationByRole(role: SystemUser['role']) {
  return role === 'SOLICITANTE' ? '/requests' : '/dashboard'
}

function getApiErrorMessage(error: unknown) {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return 'Could not connect to the server.'
  }

  return (
    error.response?.data?.message ||
    error.response?.data?.detail ||
    'Could not complete sign in.'
  )
}

function getApiStatus(error: unknown) {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return null
  }

  return error.response?.status ?? error.response?.data?.status ?? null
}

export function LoginPage() {
  const navigate = useNavigate()

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const setSessionFromLogin = useAuthStore((state) => state.setSessionFromLogin)
  const currentRole = useAuthStore((state) => state.currentRole)

  const [form, setForm] = useState<LoginFormState>(initialForm)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isAuthenticated) {
    return (
      <Navigate
        to={getDestinationByRole(currentRole)}
        replace
      />
    )
  }

  function updateField<K extends keyof LoginFormState>(
    field: K,
    value: LoginFormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))

    setError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const username = form.username.trim()
    const password = form.password

    setError('')

    if (!username || !password) {
      setError('Enter your username and password to continue.')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await loginRequest(username, password)
      setSessionFromLogin(response)
      navigate(getDestinationByRole(response.usuario.frontendRole))
    } catch (requestError) {
      const status = getApiStatus(requestError)
      const message = getApiErrorMessage(requestError)

      if (status === 401 || status === 423) {
        setError('Invalid username or password.')
        return
      }

      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="relative flex min-h-screen overflow-hidden items-center justify-center bg-[#f7f9fc] px-5 py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-24 -right-20 hidden text-[#0066ff] opacity-[0.055] lg:block"
      >
        <Boxes
          size={420}
          strokeWidth={1}
        />
      </div>

      <section className="relative z-10 w-full max-w-110 rounded-xl border border-nexus-border bg-white px-6 py-8 sm:px-9 sm:py-10">
        <div className="mb-8">
          <p className="text-sm font-semibold text-nexus-bright">
            Stockroom Inventory Operations
          </p>

          <h1 className="mt-2 text-[28px] font-bold tracking-tight text-black">
            Sign in
          </h1>

          <p className="mt-2 text-sm leading-6 text-nexus-muted">
            Enter your credentials to access the system.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="username"
              className="mb-2 block text-sm font-semibold text-black"
            >
              Username
            </label>

            <div className="flex h-12 items-center gap-3 rounded-lg border border-nexus-border bg-white px-4 transition-colors focus-within:border-nexus-bright">
              <UserRound size={18} className="text-nexus-bright" />

              <input
                id="username"
                value={form.username}
                onChange={(event) => updateField('username', event.target.value)}
                className="h-full min-w-0 flex-1 bg-transparent text-sm text-black outline-none placeholder:text-[#7b8ba3]"
                placeholder="Enter your username"
                autoComplete="username"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-semibold text-black"
            >
              Password
            </label>

            <div className="flex h-12 items-center gap-3 rounded-lg border border-nexus-border bg-white px-4 transition-colors focus-within:border-nexus-bright">
              <LockKeyhole size={18} className="text-nexus-bright" />

              <input
                id="password"
                value={form.password}
                onChange={(event) => updateField('password', event.target.value)}
                type={showPassword ? 'text' : 'password'}
                className="h-full min-w-0 flex-1 bg-transparent text-sm text-black outline-none placeholder:text-[#7b8ba3]"
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                disabled={isSubmitting}
              />

              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="text-nexus-bright transition-colors hover:text-nexus-blue"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                disabled={isSubmitting}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          <div className="pt-1">
            <Button type="submit" fullWidth disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </div>
        </form>
      </section>
    </main>
  )
}
