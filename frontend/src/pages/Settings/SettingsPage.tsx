import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import { Download, RotateCcw } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  Input,
  MetricValue,
  Modal,
  PageHeader,
} from '../../components/ui'
import type { ApiErrorResponse } from '../../services/apiClient'
import {
  getBackupBancoPostgres,
  getConfiguracaoResumo,
  resetOperacional,
  type ConfiguracaoResumoResponse,
} from '../../services/configuracoesApi'
import { useAuthStore } from '../../store/authStore'

const emptySummary: ConfiguracaoResumoResponse = {
  itens: 0,
  movimentacoes: 0,
  fornecedores: 0,
  usuarios: 0,
  solicitacoes: 0,
  categorias: 0,
  totalRegistrosOperacionais: 0,
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

function downloadFile(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)
}

export function SettingsPage() {
  const currentRole = useAuthStore((state) => state.currentRole)

  const [summary, setSummary] = useState<ConfiguracaoResumoResponse>(emptySummary)
  const [isLoading, setIsLoading] = useState(true)
  const [isExportingDatabaseBackup, setIsExportingDatabaseBackup] = useState(false)
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false)
  const [backupPassword, setBackupPassword] = useState('')
  const [isResetting, setIsResetting] = useState(false)
  const [isResetModalOpen, setIsResetModalOpen] = useState(false)
  const [resetConfirmation, setResetConfirmation] = useState('')
  const [resetPassword, setResetPassword] = useState('')
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const isSuperAdmin = currentRole === 'SUPER_ADMIN'

  const dataSummary = useMemo(() => {
    return [
      {
        label: 'Items',
        value: summary.itens,
      },
      {
        label: 'Movements',
        value: summary.movimentacoes,
      },
      {
        label: 'Suppliers',
        value: summary.fornecedores,
      },
      {
        label: 'Categories',
        value: summary.categorias,
      },
      {
        label: 'Requests',
        value: summary.solicitacoes,
      },
    ]
  }, [summary])

  async function fetchSummary() {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const response = await getConfiguracaoResumo()
      setSummary(response)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
      setSummary(emptySummary)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => fetchSummary())
  }, [])

  function openBackupModal() {
    setBackupPassword('')
    setErrorMessage('')
    setFeedbackMessage('')
    setIsBackupModalOpen(true)
  }

  function closeBackupModal() {
    if (isExportingDatabaseBackup) {
      return
    }

    setIsBackupModalOpen(false)
    setBackupPassword('')
  }

  async function exportDatabaseBackup() {
    if (!backupPassword) {
      setErrorMessage('Enter your current password to confirm your identity.')
      return
    }

    setIsExportingDatabaseBackup(true)
    setErrorMessage('')
    setFeedbackMessage('')

    try {
      const backup = await getBackupBancoPostgres(backupPassword)

      downloadFile(
        `stockroom-database-${new Date().toISOString().slice(0, 10)}.backup`,
        backup,
      )

      setIsBackupModalOpen(false)
      setFeedbackMessage('PostgreSQL backup exported successfully.')
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setBackupPassword('')
      setIsExportingDatabaseBackup(false)
    }
  }
  function openResetModal() {
    setResetConfirmation('')
    setResetPassword('')
    setErrorMessage('')
    setFeedbackMessage('')
    setIsResetModalOpen(true)
  }

  function closeResetModal() {
    if (isResetting) {
      return
    }

    setIsResetModalOpen(false)
    setResetConfirmation('')
    setResetPassword('')
  }

  async function resetAllOperationalData() {
    if (resetConfirmation !== 'RESET_DATABASE') {
      setErrorMessage('Reset canceled. The confirmation text does not match.')
      return
    }

    if (!resetPassword) {
      setErrorMessage('Enter your current password to confirm your identity.')
      return
    }

    setIsResetting(true)
    setErrorMessage('')
    setFeedbackMessage('')

    try {
      await resetOperacional(resetConfirmation, resetPassword)

      await fetchSummary()

      setIsResetModalOpen(false)
      setResetConfirmation('')
      setResetPassword('')
      setFeedbackMessage('Operational data reset successfully.')
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Review operational data, create backups, and perform administrative actions."
      />

      {(errorMessage || feedbackMessage) && (
        <Card
          variant="soft"
          className={errorMessage ? 'border-red-400/20 bg-red-500/10' : undefined}
        >
          {errorMessage && (
            <p className="text-sm font-semibold text-red-200">
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

      <div className="grid gap-6">
        <Card>
          <div className="mb-6">
            <h2 className="font-display text-2xl font-bold text-nexus-navy">
              Database records
            </h2>

            <p className="mt-2 text-sm leading-6 text-nexus-muted">
              A quick view of the operational data stored by the system.
            </p>
          </div>

          <div className="space-y-3">
            {dataSummary.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between rounded-2xl border border-nexus-border bg-white/[0.035] px-4 py-3"
              >
                <span className="text-sm font-semibold text-slate-300">
                  {item.label}
                </span>

                <MetricValue
                  isLoading={isLoading}
                  size="sm"
                  minWidth="3.5ch"
                  className="inline-block font-display text-lg font-bold leading-none text-white tabular-nums"
                >
                  {item.value}
                </MetricValue>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <Badge variant="danger">Administrative zone</Badge>

            <h2 className="mt-3 font-display text-2xl font-bold text-white">
              Backup and operational reset
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-nexus-muted">
              Export a PostgreSQL backup. Reset removes items, suppliers, categories, movements, requests,
              and operational history while preserving users and roles.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            {isSuperAdmin && (
              <>
                <Button
                  variant="secondary"
                  onClick={openBackupModal}
                  disabled={isExportingDatabaseBackup || isResetting}
                >
                  <Download size={17} />
                  {isExportingDatabaseBackup ? 'Exporting...' : 'Export .backup'}
                </Button>

                <Button variant="danger" onClick={openResetModal} disabled={isResetting}>
                  <RotateCcw size={17} />
                  {isResetting ? 'Resetting...' : 'Reset data'}
                </Button>
              </>
            )}

            {!isSuperAdmin && (
              <p className="text-sm font-semibold text-slate-500">
                Full database backup export and data reset are restricted to the super administrator.
              </p>
            )}
          </div>
        </div>
      </Card>

      <Modal
        open={isBackupModalOpen}
        title="Export PostgreSQL backup"
        description="This sensitive export requires your current password."
        onClose={closeBackupModal}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={closeBackupModal}
              disabled={isExportingDatabaseBackup}
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              onClick={exportDatabaseBackup}
              disabled={isExportingDatabaseBackup || !backupPassword}
            >
              <Download size={17} />
              {isExportingDatabaseBackup ? 'Exporting...' : 'Export backup'}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            This file contains the complete PostgreSQL database, including user password hashes and
            operational data. Store it securely and review it before sharing.
          </div>

          <Input
            label="Current password"
            type="password"
            value={backupPassword}
            onChange={(event) => {
              setBackupPassword(event.target.value)
              setErrorMessage('')
            }}
            placeholder="Enter your current password"
            autoComplete="current-password"
            disabled={isExportingDatabaseBackup}
          />

          {errorMessage && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {errorMessage}
            </p>
          )}
        </div>
      </Modal>

      <Modal
        open={isResetModalOpen}
        title="Confirm operational reset"
        description="This action is irreversible and requires your current password."
        onClose={closeResetModal}
        footer={
          <>
            <Button variant="secondary" onClick={closeResetModal} disabled={isResetting}>
              Cancel
            </Button>

            <Button
              variant="danger"
              onClick={resetAllOperationalData}
              disabled={isResetting || resetConfirmation !== 'RESET_DATABASE' || !resetPassword}
            >
              <RotateCcw size={17} />
              {isResetting ? 'Resetting...' : 'Reset data'}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">
            Items, categories, suppliers, movements, requests, and operational history will be deleted.
            Users, roles, and the audit record for this action will be preserved.
          </div>

          <Input
            label="Confirmation"
            value={resetConfirmation}
            onChange={(event) => {
              setResetConfirmation(event.target.value)
              setErrorMessage('')
            }}
            placeholder="Type RESET_DATABASE"
            autoComplete="off"
            disabled={isResetting}
            helperText="Type RESET_DATABASE exactly."
          />

          <Input
            label="Current password"
            type="password"
            value={resetPassword}
            onChange={(event) => {
              setResetPassword(event.target.value)
              setErrorMessage('')
            }}
            placeholder="Enter your current password"
            autoComplete="current-password"
            disabled={isResetting}
          />

          {errorMessage && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {errorMessage}
            </p>
          )}
        </div>
      </Modal>
    </div>
  )
}
