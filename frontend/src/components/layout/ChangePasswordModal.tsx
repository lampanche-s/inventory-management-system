import { useState } from 'react'
import type { FormEvent } from 'react'
import axios from 'axios'
import { Button, Input, Modal } from '../ui'
import { useAuthStore } from '../../store/authStore'
import type { ApiErrorResponse } from '../../services/apiClient'
import { alterarMinhaSenha } from '../../services/usuariosApi'
import { exceedsBcryptPasswordLimit } from '../../utils/password'

type ChangePasswordModalProps = {
  open: boolean
  onClose: () => void
}

type PasswordFormState = {
  currentPassword: string
  password: string
  confirmPassword: string
}

const initialForm: PasswordFormState = {
  currentPassword: '',
  password: '',
  confirmPassword: '',
}

function getApiErrorMessage(error: unknown) {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return 'Could not connect to the server.'
  }

  const firstFieldError = error.response?.data?.fieldErrors?.[0]?.message

  return (
    firstFieldError ||
    error.response?.data?.message ||
    error.response?.data?.detail ||
    'Could not change the password.'
  )
}

export function ChangePasswordModal({
  open,
  onClose,
}: ChangePasswordModalProps) {
  const currentUser = useAuthStore((state) => state.currentUser)
  const [form, setForm] = useState<PasswordFormState>(initialForm)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  function updateField<K extends keyof PasswordFormState>(
    field: K,
    value: PasswordFormState[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }))
    setError('')
    setSuccessMessage('')
  }

  function resetAndClose() {
    if (isSaving) {
      return
    }

    setForm(initialForm)
    setError('')
    setSuccessMessage('')
    onClose()
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const senhaAtual = form.currentPassword
    const novaSenha = form.password

    if (!senhaAtual.trim()) {
      setError('Enter your current password.')
      return
    }

    if (novaSenha.length < 6) {
      setError('The new password must contain at least 6 characters.')
      return
    }

    if (exceedsBcryptPasswordLimit(novaSenha)) {
      setError('The new password must not exceed 72 bytes in UTF-8.')
      return
    }

    if (form.password !== form.confirmPassword) {
      setError('The password confirmation does not match.')
      return
    }

    if (senhaAtual === novaSenha) {
      setError('The new password must be different from the current password.')
      return
    }

    setIsSaving(true)
    setError('')
    setSuccessMessage('')

    try {
      await alterarMinhaSenha({ senhaAtual, novaSenha })
      setForm(initialForm)
      setSuccessMessage('Password updated successfully.')
    } catch (apiError) {
      setError(getApiErrorMessage(apiError))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      title="Change my password"
      description="Update the password for your own account."
      onClose={resetAndClose}
      footer={
        <>
          <Button variant="secondary" onClick={resetAndClose} disabled={isSaving}>
            Cancel
          </Button>

          <Button type="submit" form="change-own-password-form" disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save password'}
          </Button>
        </>
      }
    >
      <form
        id="change-own-password-form"
        onSubmit={handleSubmit}
        className="grid gap-5 md:grid-cols-2"
      >
        <div className="md:col-span-2 rounded-lg border border-[#d5e0ee] bg-[#f8fbff] p-5">
          <p className="font-bold text-nexus-navy">Current user</p>

          <p className="mt-2 text-sm leading-6 text-nexus-muted">
            {currentUser?.name ?? 'Authenticated user'}
          </p>
        </div>

        <div className="md:col-span-2">
          <Input label="Current password" type="password" value={form.currentPassword} onChange={(event) => updateField('currentPassword', event.target.value)} placeholder="Enter your current password" required disabled={isSaving} />
        </div>

        <Input label="New password" type="password" value={form.password} onChange={(event) => updateField('password', event.target.value)} placeholder="At least 6 characters" required disabled={isSaving} />

        <Input label="Confirm new password" type="password" value={form.confirmPassword} onChange={(event) => updateField('confirmPassword', event.target.value)} placeholder="Repeat the new password" required disabled={isSaving} />

        {error && <div className="md:col-span-2 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-500">{error}</div>}

        {successMessage && <div className="md:col-span-2 rounded-lg border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm font-semibold text-green-500">{successMessage}</div>}

      </form>
    </Modal>
  )
}
