import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Button, Input, Modal, Select } from '../../components/ui'
import type { SystemUser } from '../../types/domain'
import { exceedsBcryptPasswordLimit } from '../../utils/password'

export type UserFormSubmitData = {
  name: string
  username: string
  email: string
  role: Exclude<SystemUser['role'], 'SUPER_ADMIN'>
  status: SystemUser['status']
  password?: string
}

type EditableUser = SystemUser & {
  username?: string
}

type UserFormModalProps = {
  open: boolean
  onClose: () => void
  onSave: (user: UserFormSubmitData) => Promise<void> | void
  initialUser?: EditableUser | null
  isSaving?: boolean
  canManageAdmins?: boolean
  canOnlyManageRequesters?: boolean
}

type UserFormState = {
  name: string
  username: string
  email: string
  role: Exclude<SystemUser['role'], 'SUPER_ADMIN'>
  status: SystemUser['status']
  password: string
  confirmPassword: string
}

const initialState: UserFormState = {
  name: '',
  username: '',
  email: '',
  role: 'FUNCIONARIO',
  status: 'ACTIVE',
  password: '',
  confirmPassword: '',
}

const allRoleOptions = [
  { label: 'Administrator', value: 'ADMIN' },
  { label: 'Employee', value: 'FUNCIONARIO' },
  { label: 'Requester', value: 'SOLICITANTE' },
]

const limitedRoleOptions = [
  { label: 'Employee', value: 'FUNCIONARIO' },
  { label: 'Requester', value: 'SOLICITANTE' },
]

const requesterOnlyRoleOptions = [
  { label: 'Requester', value: 'SOLICITANTE' },
]

const statusOptions = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
]

function getInitialState(canOnlyManageRequesters = false): UserFormState {
  return {
    ...initialState,
    role: canOnlyManageRequesters ? 'SOLICITANTE' : initialState.role,
  }
}

function getStateFromUser(
  user?: EditableUser | null,
  canManageAdmins = false,
  canOnlyManageRequesters = false,
): UserFormState {
  if (!user) {
    return getInitialState(canOnlyManageRequesters)
  }

  const safeRole = canOnlyManageRequesters
    ? 'SOLICITANTE'
    : user.role === 'SUPER_ADMIN'
      ? 'ADMIN'
      : user.role === 'ADMIN' && !canManageAdmins
        ? 'FUNCIONARIO'
        : user.role

  return {
    name: user.name,
    username: user.username ?? '',
    email: user.email,
    role: safeRole,
    status: user.status,
    password: '',
    confirmPassword: '',
  }
}

export function UserFormModal({
  open,
  onClose,
  onSave,
  initialUser,
  isSaving = false,
  canManageAdmins = false,
  canOnlyManageRequesters = false,
}: UserFormModalProps) {
  const [form, setForm] = useState<UserFormState>(() =>
    getStateFromUser(initialUser, canManageAdmins, canOnlyManageRequesters),
  )
  const [formError, setFormError] = useState('')

  const isEditing = Boolean(initialUser)

  const roleOptions = useMemo(() => {
    if (canOnlyManageRequesters) {
      return requesterOnlyRoleOptions
    }

    return canManageAdmins ? allRoleOptions : limitedRoleOptions
  }, [canManageAdmins, canOnlyManageRequesters])

  function updateField<K extends keyof UserFormState>(
    field: K,
    value: UserFormState[K],
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))

    setFormError('')
  }

  function resetAndClose() {
    if (isSaving) {
      return
    }

    setForm(getInitialState(canOnlyManageRequesters))
    setFormError('')
    onClose()
  }

  function validateForm() {
    const name = form.name.trim()
    const username = form.username.trim()
    const email = form.email.trim()
    const password = form.password
    const confirmPassword = form.confirmPassword

    if (!name) {
      setFormError('Enter the user name.')
      return false
    }

    if (!username) {
      setFormError('Enter the sign-in username.')
      return false
    }

    if (username.length < 3) {
      setFormError('The username must contain at least 3 characters.')
      return false
    }

    if (canOnlyManageRequesters && form.role !== 'SOLICITANTE') {
      setFormError('Your role can create requester accounts only.')
      return false
    }

    if (!canManageAdmins && form.role === 'ADMIN') {
      setFormError('Your role can create employee or requester accounts only.')
      return false
    }

    if (email && !email.includes('@')) {
      setFormError('Enter a valid email address or leave the field blank.')
      return false
    }

    const hasPassword = password.length > 0
    const hasConfirmation = confirmPassword.length > 0

    if (!isEditing && !hasPassword) {
      setFormError('Set an initial password for the user.')
      return false
    }

    if (!isEditing && password.length < 6) {
      setFormError('The initial password must contain at least 6 characters.')
      return false
    }

    if (isEditing && !hasPassword && !hasConfirmation) {
      return true
    }

    if (isEditing && (hasPassword || hasConfirmation) && password.length < 6) {
      setFormError('The new password must contain at least 6 characters.')
      return false
    }

    if (hasPassword && exceedsBcryptPasswordLimit(password)) {
      setFormError('The password must not exceed 72 bytes in UTF-8.')
      return false
    }

    if (password !== confirmPassword) {
      setFormError('The password confirmation does not match.')
      return false
    }

    return true
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!validateForm()) {
      return
    }

    await onSave({
      name: form.name.trim(),
      username: form.username.trim(),
      email: form.email.trim(),
      role: form.role,
      status: form.status,
      password: form.password.trim() ? form.password : undefined,
    })
  }

  return (
    <Modal
      open={open}
      title={isEditing ? 'Edit user' : 'New user'}
      description={
        isEditing
          ? 'Update details, role, status, and optionally set a new password.'
          : 'Create a user and set the initial access password.'
      }
      onClose={resetAndClose}
      footer={
        <>
          <Button variant="secondary" onClick={resetAndClose} disabled={isSaving}>
            Cancel
          </Button>

          <Button type="submit" form="user-form" disabled={isSaving}>
            {isSaving
              ? 'Saving...'
              : isEditing
                ? 'Save changes'
                : 'Save user'}
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={handleSubmit} className="grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <Input
            label="Name"
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
            placeholder="Example: Alex Morgan"
            required
            disabled={isSaving}
          />
        </div>

        <Input
          label="Username"
          value={form.username}
          onChange={(event) => updateField('username', event.target.value)}
          placeholder="Example: alex.morgan"
          required
          disabled={isSaving}
          helperText="This username will be used to sign in."
        />

        <Input
          label="Optional email"
          type="email"
          value={form.email}
          onChange={(event) => updateField('email', event.target.value)}
          placeholder="Example: alex@example.com"
          disabled={isSaving}
        />

        <Select
          label="Role"
          value={form.role}
          onChange={(event) => updateField('role', event.target.value as UserFormState['role'])}
          options={roleOptions}
          required
          disabled={isSaving}
        />

        <Select
          label="Status"
          value={form.status}
          onChange={(event) => updateField('status', event.target.value as SystemUser['status'])}
          options={statusOptions}
          required
          disabled={isSaving}
        />

        <Input
          label={isEditing ? 'Optional new password' : 'Initial password'}
          type="password"
          value={form.password}
          onChange={(event) => updateField('password', event.target.value)}
          placeholder={isEditing ? 'Leave blank to keep the current password' : 'At least 6 characters'}
          required={!isEditing}
          disabled={isSaving}
        />

        <Input
          label={isEditing ? 'Confirm new password' : 'Confirm password'}
          type="password"
          value={form.confirmPassword}
          onChange={(event) => updateField('confirmPassword', event.target.value)}
          placeholder={isEditing ? 'Repeat only when changing it' : 'Repeat the password'}
          required={!isEditing}
          disabled={isSaving}
        />

        {formError && (
          <div className="md:col-span-2 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
            {formError}
          </div>
        )}
      </form>
    </Modal>
  )
}
