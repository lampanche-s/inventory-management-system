import {
  useEffect,
  useRef,
  useState } from 'react'
import axios from 'axios'
import {
  Edit3,
  Plus,
  Search,
  Trash2,
  } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  ConfirmModal,
  Pagination,
  SearchInput,
  Select,
  Table,
  type TableColumn,
  PageHeader,
} from '../../components/ui'
import type { ApiErrorResponse } from '../../services/apiClient'
import {
  createUsuario,
  deactivateUsuario,
  deleteUsuario,
  listUsuarios,
  reactivateUsuario,
  toBackendRole,
  updateUsuario,
  type UsuarioApiResponse,
} from '../../services/usuariosApi'
import { useAuthStore } from '../../store/authStore'
import type { SystemUser } from '../../types/domain'
import { formatDateTime } from '../../utils/formatters'
import {
  beginLatestRequest,
  isLatestRequest,
} from '../../utils/latestRequest'
import { UserFormModal } from './UserFormModal'
import type { UserFormSubmitData } from './UserFormModal'

const USERS_PER_PAGE = 10

type UserView = SystemUser & {
  username: string
  updatedAt?: string
}

const roleOptions = [
  { label: 'All roles', value: 'ALL' },
  { label: 'Administrators', value: 'ADMIN' },
  { label: 'Employees', value: 'FUNCIONARIO' },
  { label: 'Requesters', value: 'SOLICITANTE' },
]

const statusOptions = [
  { label: 'All statuses', value: 'ALL' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
]

function getRoleBadge(role: SystemUser['role']) {
  if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
    return <Badge variant="info">Admin</Badge>
  }

  if (role === 'FUNCIONARIO') {
    return <Badge variant="success">Employee</Badge>
  }

  return <Badge variant="warning">Requester</Badge>
}

function getStatusBadge(status: SystemUser['status']) {
  if (status === 'ACTIVE') {
    return <Badge variant="success">Active</Badge>
  }

  return <Badge variant="neutral">Inactive</Badge>
}

function mapApiUserToView(user: UsuarioApiResponse): UserView {
  return {
    id: String(user.id),
    name: user.nome,
    username: user.usuario,
    email: user.email ?? '',
    role: user.frontendRole,
    status: user.ativo ? 'ACTIVE' : 'INACTIVE',
    lastSeen: user.lastSeenAt ? formatDateTime(user.lastSeenAt) : 'Never signed in',
    passwordSet: true,
    passwordUpdatedAt: user.updatedAt,
    updatedAt: user.updatedAt,
  }
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
    'Could not complete the operation.'
  )
}

function getEmptyDescription(errorMessage: string | null) {
  if (errorMessage) {
    return errorMessage
  }

  return 'Create a user or change the current filters.'
}

export function UsersPage() {
  const currentRole = useAuthStore((state) => state.currentRole)
  const isEmployeeUserManager = currentRole === 'FUNCIONARIO'

  const [users, setUsers] = useState<UserView[]>([])
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<SystemUser['role'] | 'ALL'>('ALL')
  const [status, setStatus] = useState<SystemUser['status'] | 'ALL'>('ALL')
  const [page, setPage] = useState(1)
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [isUserModalOpen, setIsUserModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserView | null>(null)
  const [userToDelete, setUserToDelete] = useState<UserView | null>(null)

  const usersRequestSequenceRef = useRef(0)

  async function fetchUsers() {
    const requestSequence = beginLatestRequest(usersRequestSequenceRef)

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const response = await listUsuarios({
        page,
        size: USERS_PER_PAGE,
        search,
        role: isEmployeeUserManager ? 'SOLICITANTE' : role,
        status,
      })

      if (!isLatestRequest(usersRequestSequenceRef, requestSequence)) {
        return
      }

      setUsers(response.content.map(mapApiUserToView))
      setTotalElements(response.totalElements)
      setTotalPages(Math.max(response.totalPages, 1))
    } catch (error) {
      if (!isLatestRequest(usersRequestSequenceRef, requestSequence)) {
        return
      }

      setErrorMessage(getApiErrorMessage(error))
      setUsers([])
      setTotalElements(0)
      setTotalPages(1)
    } finally {
      if (isLatestRequest(usersRequestSequenceRef, requestSequence)) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => fetchUsers())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, role, status, currentRole, refreshVersion])

  function openCreateModal() {
    setEditingUser(null)
    setIsUserModalOpen(true)
  }

  function openEditModal(user: UserView) {
    setEditingUser(user)
    setIsUserModalOpen(true)
  }

  function closeUserModal() {
    if (isSaving) {
      return
    }

    setEditingUser(null)
    setIsUserModalOpen(false)
  }

  async function handleSaveUser(user: UserFormSubmitData) {
    setIsSaving(true)
    setErrorMessage(null)
    setFeedbackMessage(null)

    try {
      if (editingUser) {
        await updateUsuario(editingUser.id, {
          nome: user.name,
          usuario: user.username,
          email: user.email || null,
          perfil: toBackendRole(user.role),
          ativo: user.status === 'ACTIVE',
          ...(user.password ? { senha: user.password } : {}),
        })

        setFeedbackMessage('User updated successfully.')
      } else {
        await createUsuario({
          nome: user.name,
          usuario: user.username,
          email: user.email || null,
          senha: user.password ?? '',
          perfil: toBackendRole(user.role),
        })

        setFeedbackMessage('User created successfully.')
      }

      closeUserModal()
      setSearch('')
      setRole(isEmployeeUserManager ? 'SOLICITANTE' : 'ALL')
      setStatus('ALL')
      setPage(1)
      setRefreshVersion((value) => value + 1)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleToggleUserStatus(user: UserView) {
    setErrorMessage(null)
    setFeedbackMessage(null)

    try {
      if (user.status === 'ACTIVE') {
        await deactivateUsuario(user.id)
        setFeedbackMessage('User deactivated successfully.')
      } else {
        await reactivateUsuario(user.id)
        setFeedbackMessage('User reactivated successfully.')
      }

      setRefreshVersion((value) => value + 1)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    }
  }

  async function handleConfirmDelete() {
    if (!userToDelete) {
      return
    }

    setErrorMessage(null)
    setFeedbackMessage(null)

    try {
      await deleteUsuario(userToDelete.id)
      setFeedbackMessage('User deleted successfully.')
      setUserToDelete(null)
      setPage(1)
      setRefreshVersion((value) => value + 1)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    }
  }

  const visibleUsers = users.filter((user) => {
    if (user.role === 'SUPER_ADMIN') {
      return false
    }

    if (isEmployeeUserManager) {
      return user.role === 'SOLICITANTE'
    }

    return true
  })
  function clearFilters() {
    setSearch('')
    setRole(isEmployeeUserManager ? 'SOLICITANTE' : 'ALL')
    setStatus('ALL')
    setPage(1)
  }

  const columns: TableColumn<UserView>[] = [
    {
      key: 'user',
      header: 'User',
      render: (user) => (
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-500/15 font-display text-sm font-bold text-blue-300">
            {user.name
              .split(' ')
              .map((part) => part[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()}
          </div>

          <div>
            <p className="font-semibold text-white">{user.name}</p>
            <p className="mt-1 text-xs text-slate-500">
              @{user.username}{user.email ? ` · ${user.email}` : ''}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      align: 'center',
      render: (user) => getRoleBadge(user.role),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (user) => getStatusBadge(user.status),
    },
    {
      key: 'lastSeen',
      header: 'Last access',
      render: (user) => (
        <span className="text-xs font-medium text-slate-400">
          {user.lastSeen}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (user) => {
        if (isEmployeeUserManager) {
          return (
            <span className="text-xs font-semibold text-slate-500">
              View only
            </span>
          )
        }

        return (
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => openEditModal(user)}
            >
              <Edit3 size={15} />
              Edit
            </Button>

            {user.role === 'ADMIN' && currentRole !== 'SUPER_ADMIN' ? (
              <Button size="sm" variant="secondary" disabled>
                Protected
              </Button>
            ) : (
              <Button
                size="sm"
                variant={user.status === 'ACTIVE' ? 'danger' : 'secondary'}
                onClick={() => handleToggleUserStatus(user)}
              >
                {user.status === 'ACTIVE' ? 'Deactivate' : 'Reactivate'}
              </Button>
            )}

            {(user.role !== 'ADMIN' || currentRole === 'SUPER_ADMIN') && (
              <Button
                size="sm"
                variant="danger"
                onClick={() => setUserToDelete(user)}
              >
                <Trash2 size={15} />
                Delete
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  const visibleColumns = currentRole === 'SUPER_ADMIN'
    ? columns
    : columns.filter((column) => column.key !== 'lastSeen')

  const pageTitle = isLoading ? 'Loading users...' : `${totalElements} record(s)`

  return (
    <div className="space-y-6">
      <PageHeader
        title="Users"
        description="Manage users, roles, status, and initial access passwords."
        actions={
            <Button onClick={openCreateModal}>
              <Plus size={17} />
              New user
            </Button>
        }
      />

      {(errorMessage || feedbackMessage) && (
        <Card variant="soft">
          {errorMessage && (
            <p className="text-sm font-semibold text-red-300">
              {errorMessage}
            </p>
          )}

          {feedbackMessage && (
            <p className="text-sm font-semibold text-green-300">
              {feedbackMessage}
            </p>
          )}
        </Card>
      )}

      <Card variant="soft">
        <div className="grid gap-4 xl:grid-cols-[1fr_220px_220px_auto] xl:items-end">
          <SearchInput
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder="Search by name, email, username, or role..."
          />

          <Select
            aria-label="Filter by role"
            value={role}
            onChange={(event) => {
              setRole(event.target.value as SystemUser['role'] | 'ALL')
              setPage(1)
            }}
            options={isEmployeeUserManager ? [{ label: 'Requesters', value: 'SOLICITANTE' }] : roleOptions}
            disabled={isEmployeeUserManager}
          />

          <Select
            aria-label="Filter by status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as SystemUser['status'] | 'ALL')
              setPage(1)
            }}
            options={statusOptions}
          />

          <Button variant="secondary" onClick={clearFilters}>
            <Search size={17} />
            Clear
          </Button>
        </div>
      </Card>

      <Card>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-nexus-navy">
              Registered users
            </h2>

            <p className="mt-1 text-sm text-nexus-muted">
              {pageTitle}
            </p>
          </div>
        </div>

        <Table
          columns={visibleColumns}
          data={isLoading ? [] : visibleUsers}
          emptyTitle={isLoading ? 'Loading users...' : 'No users found'}
          emptyDescription={isLoading ? 'Wait while the records are loaded.' : getEmptyDescription(errorMessage)}
        />
      </Card>

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={totalElements}
        onPageChange={setPage}
      />

      {isUserModalOpen ? (
        <UserFormModal
          key={`${editingUser?.id ?? 'new-user'}-${currentRole}`}
          open
          onClose={closeUserModal}
          onSave={handleSaveUser}
          initialUser={editingUser}
          isSaving={isSaving}
          canManageAdmins={currentRole === 'SUPER_ADMIN'}
          canOnlyManageRequesters={isEmployeeUserManager}
        />
      ) : null}

      <ConfirmModal
        open={Boolean(userToDelete)}
        title="Delete user"
        description="Confirm deletion of the selected user."
        confirmLabel="Delete user"
        danger
        onClose={() => setUserToDelete(null)}
        onConfirm={handleConfirmDelete}
      >
        {userToDelete
          ? `"${userToDelete.name}" will be removed from the user directory.`
          : undefined}
      </ConfirmModal>
    </div>
  )
}
