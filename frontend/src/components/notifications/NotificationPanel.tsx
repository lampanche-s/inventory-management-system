import { useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import type { LucideIcon } from 'lucide-react'
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  FileClock,
  PackagePlus,
  PackageX,
  XCircle,
} from 'lucide-react'
import type { ApiErrorResponse } from '../../services/apiClient'
import {
  listItens,
  mapItemApiToInventoryItem,
} from '../../services/itensApi'
import {
  listMovimentacoes,
  mapMovimentacaoToInventoryMovement,
} from '../../services/movimentacoesApi'
import {
  listMinhasSolicitacoes,
  listSolicitacoes,
  mapSolicitacaoToStockRequest,
} from '../../services/solicitacoesApi'
import { useAuthStore } from '../../store/authStore'
import type {
  InventoryItem,
  InventoryMovement,
  StockRequest,
} from '../../types/domain'
import { fetchAllPages } from '../../utils/pagination'
import { formatDateTime } from '../../utils/formatters'
import { Button } from '../ui'

type NotificationVariant = 'danger' | 'warning' | 'success' | 'info' | 'neutral'

type NotificationCategory =
  | 'ALL'
  | 'MOVEMENTS'
  | 'EXPIRATION'
  | 'REPLENISHMENT'
  | 'ITEMS'
  | 'REQUESTS'

type NotificationItem = {
  id: string
  title: string
  description: string
  date?: string
  icon: LucideIcon
  variant: NotificationVariant
  category: Exclude<NotificationCategory, 'ALL'>
}

type NotificationPanelProps = {
  onClose: () => void
}

const CRITICAL_NOTIFICATION_LIMIT = 12
const REGULAR_NOTIFICATION_LIMIT = 8
const ITEM_NOTIFICATION_LIMIT = 6

const variantClasses: Record<NotificationVariant, string> = {
  danger: 'bg-red-500/15 text-red-300',
  warning: 'bg-amber-500/15 text-amber-300',
  success: 'bg-green-500/15 text-green-300',
  info: 'bg-blue-500/15 text-blue-300',
  neutral: 'bg-slate-500/15 text-slate-300',
}

const filterLabels: Record<NotificationCategory, string> = {
  ALL: 'All',
  MOVEMENTS: 'Receipts/issues',
  EXPIRATION: 'Expiring',
  REPLENISHMENT: 'Replenishment',
  ITEMS: 'Items',
  REQUESTS: 'Requests',
}

function getSafeTime(value?: string) {
  if (!value) {
    return 0
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 0
  }

  return date.getTime()
}

function isExpirationRelevant(expirationDate?: string, expirationWarningDate?: string) {
  if (!expirationDate) {
    return false
  }

  if (!expirationWarningDate) {
    return true
  }

  const today = new Date()
  const warningDate = new Date(`${expirationWarningDate}T00:00:00`)

  return today >= warningDate
}

function getNotificationDate(notification: NotificationItem) {
  return getSafeTime(notification.date)
}

function sortNotifications(notifications: NotificationItem[]) {
  const criticalCategories: Array<NotificationItem['category']> = [
    'REPLENISHMENT',
    'EXPIRATION',
  ]

  return notifications.slice().sort((a, b) => {
    const aCritical = criticalCategories.includes(a.category)
    const bCritical = criticalCategories.includes(b.category)

    if (aCritical !== bCritical) {
      return aCritical ? -1 : 1
    }

    return getNotificationDate(b) - getNotificationDate(a)
  })
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
    'Could not load notifications.'
  )
}

function buildReplenishmentAlerts(items: InventoryItem[]): NotificationItem[] {
  return items
    .filter((item) => item.status === 'OUT_OF_STOCK' || item.status === 'LOW_STOCK')
    .slice()
    .sort((a, b) => {
      const aSeverity = a.status === 'OUT_OF_STOCK' ? 0 : 1
      const bSeverity = b.status === 'OUT_OF_STOCK' ? 0 : 1

      return aSeverity - bSeverity || a.name.localeCompare(b.name)
    })
    .slice(0, CRITICAL_NOTIFICATION_LIMIT)
    .map((item) => ({
      id: `stock-${item.id}`,
      title: item.status === 'OUT_OF_STOCK' ? 'Out of stock' : 'Low stock',
      description:
        item.status === 'OUT_OF_STOCK'
          ? `${item.name} has no stock. Recommended minimum: ${item.minimumStock} ${item.unit}.`
          : `${item.name} has ${item.currentStock} ${item.unit}. Minimum: ${item.minimumStock} ${item.unit}.`,
      date: item.updatedAt,
      icon: item.status === 'OUT_OF_STOCK' ? PackageX : AlertTriangle,
      variant: item.status === 'OUT_OF_STOCK' ? 'danger' : 'warning',
      category: 'REPLENISHMENT',
    }))
}

function buildExpirationAlerts(items: InventoryItem[]): NotificationItem[] {
  return items
    .filter((item) => isExpirationRelevant(item.expirationDate, item.expirationWarningDate))
    .slice()
    .sort((a, b) => getSafeTime(a.expirationDate) - getSafeTime(b.expirationDate))
    .slice(0, CRITICAL_NOTIFICATION_LIMIT)
    .map((item) => ({
      id: `exp-${item.id}`,
      title: 'Item nearing expiration',
      description: `${item.name} expires on ${item.expirationDate}. Location: ${item.location || 'not specified'}.`,
      date: item.expirationDate,
      icon: CalendarClock,
      variant: 'warning',
      category: 'EXPIRATION',
    }))
}

function buildItemAlerts(items: InventoryItem[]): NotificationItem[] {
  return items
    .slice()
    .sort((a, b) => getSafeTime(b.updatedAt) - getSafeTime(a.updatedAt))
    .slice(0, ITEM_NOTIFICATION_LIMIT)
    .map((item) => ({
      id: `item-${item.id}`,
      title: 'Item created or updated',
      description: `${item.name} is stored at ${item.location || 'an unspecified location'}. Current stock: ${item.currentStock} ${item.unit}.`,
      date: item.updatedAt,
      icon: PackagePlus,
      variant: 'info',
      category: 'ITEMS',
    }))
}

function buildRequestAlerts(requests: StockRequest[]): NotificationItem[] {
  return requests
    .slice()
    .sort((a, b) => {
      const aDate = getSafeTime(a.decidedAt ?? a.createdAt)
      const bDate = getSafeTime(b.decidedAt ?? b.createdAt)

      return bDate - aDate
    })
    .slice(0, REGULAR_NOTIFICATION_LIMIT)
    .map((request) => {
      if (request.status === 'PENDING') {
        return {
          id: `req-${request.id}`,
          title: 'Pending request',
          description: `${request.requesterName} requested ${request.quantity} unit(s) of ${request.itemName}. Reason: ${request.requestReason || 'not specified'}.`,
          date: request.createdAt,
          icon: ClipboardCheck,
          variant: 'warning',
          category: 'REQUESTS',
        }
      }

      if (request.status === 'APPROVED') {
        return {
          id: `req-${request.id}`,
          title: 'Request approved',
          description: `${request.itemName} was approved for ${request.requesterName}.${request.decisionNote ? ` Decision note: ${request.decisionNote}` : ''}`,
          date: request.decidedAt ?? request.createdAt,
          icon: CheckCircle2,
          variant: 'success',
          category: 'REQUESTS',
        }
      }

      if (request.status === 'REJECTED') {
        return {
          id: `req-${request.id}`,
          title: 'Request rejected',
          description: `${request.itemName} was rejected for ${request.requesterName}.${request.decisionNote ? ` Decision note: ${request.decisionNote}` : ''}`,
          date: request.decidedAt ?? request.createdAt,
          icon: XCircle,
          variant: 'danger',
          category: 'REQUESTS',
        }
      }

      return {
        id: `req-${request.id}`,
        title: 'Request canceled',
        description: `${request.requesterName} canceled the request for ${request.itemName}.`,
        date: request.decidedAt ?? request.createdAt,
        icon: XCircle,
        variant: 'neutral',
        category: 'REQUESTS',
      }
    })
}

function buildMovementAlerts(movements: InventoryMovement[]): NotificationItem[] {
  return movements
    .slice()
    .sort((a, b) => getSafeTime(b.createdAt) - getSafeTime(a.createdAt))
    .slice(0, REGULAR_NOTIFICATION_LIMIT)
    .map((movement) => ({
      id: `mov-${movement.id}`,
      title: movement.type === 'IN' ? 'Receipt recorded' : 'Issue recorded',
      description: `${movement.quantity} unit(s) of ${movement.itemName}. Reason: ${movement.reason}.`,
      date: movement.createdAt,
      icon: FileClock,
      variant: movement.type === 'IN' ? 'success' : 'info',
      category: 'MOVEMENTS',
    }))
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const currentRole = useAuthStore((state) => state.currentRole)

  const [items, setItems] = useState<InventoryItem[]>([])
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [requests, setRequests] = useState<StockRequest[]>([])
  const [activeFilter, setActiveFilter] = useState<NotificationCategory>('ALL')
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  async function fetchNotifications() {
    setIsLoading(true)
    setErrorMessage('')

    try {
      if (currentRole === 'SOLICITANTE') {
        const requestsResponse = await listMinhasSolicitacoes({
          page: 1,
          size: 20,
          status: 'ALL',
        })

        setItems([])
        setMovements([])
        setRequests(requestsResponse.content.map(mapSolicitacaoToStockRequest))
        return
      }

      const [itemRecords, movementsResponse, requestsResponse] = await Promise.all([
        fetchAllPages((pageNumber, pageSize) =>
          listItens({
            page: pageNumber,
            size: pageSize,
            status: 'ALL',
            active: true,
          }),
        ),
        listMovimentacoes({
          page: 1,
          size: 20,
          type: 'ALL',
        }),
        listSolicitacoes({
          page: 1,
          size: 20,
          status: 'ALL',
        }),
      ])

      setItems(itemRecords.map(mapItemApiToInventoryItem))
      setMovements(movementsResponse.content.map(mapMovimentacaoToInventoryMovement))
      setRequests(requestsResponse.content.map(mapSolicitacaoToStockRequest))
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
      setItems([])
      setMovements([])
      setRequests([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => fetchNotifications())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRole])

  const notifications = useMemo<NotificationItem[]>(() => {
    const requestAlerts = buildRequestAlerts(requests)

    if (currentRole === 'SOLICITANTE') {
      return sortNotifications(requestAlerts)
    }

    return sortNotifications([
      ...buildReplenishmentAlerts(items),
      ...buildExpirationAlerts(items),
      ...requestAlerts,
      ...buildMovementAlerts(movements),
      ...buildItemAlerts(items),
    ])
  }, [currentRole, items, movements, requests])

  const filterOptions = useMemo(() => {
    const categories: NotificationCategory[] = [
      'ALL',
      'MOVEMENTS',
      'EXPIRATION',
      'REPLENISHMENT',
      'ITEMS',
      'REQUESTS',
    ]

    if (currentRole === 'SOLICITANTE') {
      return categories.filter((category) => category === 'ALL' || category === 'REQUESTS')
    }

    return categories
  }, [currentRole])

  const filteredNotifications = useMemo(() => {
    if (activeFilter === 'ALL') {
      return notifications
    }

    return notifications.filter((notification) => notification.category === activeFilter)
  }, [activeFilter, notifications])

  function getFilterCount(category: NotificationCategory) {
    if (category === 'ALL') {
      return notifications.length
    }

    return notifications.filter((notification) => notification.category === category).length
  }

  return (
    <div className="notification-panel absolute right-0 top-14 z-50 flex w-[min(92vw,460px)] flex-col overflow-hidden rounded-[1.75rem] border border-nexus-border bg-nexus-panel shadow-premium">
      <header className="notification-panel-header shrink-0 border-b border-nexus-border px-5 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold tracking-normal text-nexus-bright">
              Activity center
            </p>

            <h2 className="mt-1 font-display text-xl font-bold text-white">
              Notifications
            </h2>

            <p className="notification-panel-muted mt-1 text-xs text-slate-500">
              {isLoading
                ? 'Loading alerts...'
                : `${filteredNotifications.length} of ${notifications.length} alert(s)`}
            </p>
          </div>

          <Button size="sm" variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>

        <div className="notification-filter-scroll mt-4 flex gap-2 overflow-x-auto overflow-y-hidden pb-2 sm:flex-nowrap sm:overflow-x-auto">
          {filterOptions.map((filter) => {
            const isActive = activeFilter === filter
            const count = getFilterCount(filter)

            return (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={[
                  'shrink-0 rounded-2xl border px-3 py-2 text-xs font-bold transition',
                  isActive
                    ? 'notification-filter-active border-blue-400/40 bg-blue-500/15 text-blue-200'
                    : 'notification-filter-inactive border-nexus-border bg-white/[0.035] text-slate-400 hover:bg-white/[0.07] hover:text-white',
                ].join(' ')}
              >
                {filterLabels[filter]} · {isLoading ? '...' : count}
              </button>
            )
          })}
        </div>
      </header>

      <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-3 sm:max-h-[470px] sm:flex-none">
        {errorMessage && (
          <div className="rounded-3xl border border-red-400/20 bg-red-500/10 p-4">
            <p className="text-sm font-semibold text-red-200">
              {errorMessage}
            </p>
          </div>
        )}

        {!errorMessage && isLoading && (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <article
                key={index}
                className="rounded-3xl border border-nexus-border bg-white/[0.035] p-4"
              >
                <div className="flex gap-3">
                  <div className="h-11 w-11 shrink-0 rounded-2xl bg-white/[0.08]" />

                  <div className="min-w-0 flex-1">
                    <div className="h-4 w-40 rounded-full bg-white/[0.08]" />
                    <div className="mt-3 h-3 w-full rounded-full bg-white/[0.06]" />
                    <div className="mt-2 h-3 w-2/3 rounded-full bg-white/[0.06]" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {!errorMessage && !isLoading && filteredNotifications.length > 0 && (
          <div className="space-y-2">
            {filteredNotifications.map((notification) => {
              const Icon = notification.icon

              return (
                <article
                  key={notification.id}
                  className="notification-card rounded-3xl border border-nexus-border bg-white/[0.035] p-4 transition hover:bg-white/[0.06]"
                >
                  <div className="flex gap-3">
                    <div
                      className={[
                        'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
                        variantClasses[notification.variant],
                      ].join(' ')}
                    >
                      <Icon size={20} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="notification-card-title font-semibold text-white">
                        {notification.title}
                      </p>

                      <p className="notification-card-description mt-1 text-sm leading-6 text-slate-500">
                        {notification.description}
                      </p>

                      {notification.date && (
                        <p className="notification-card-date mt-2 text-xs font-medium text-slate-600">
                          {formatDateTime(notification.date)}
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {!errorMessage && !isLoading && filteredNotifications.length === 0 && (
          <div className="px-5 py-12 text-center">
            <p className="notification-panel-title font-display text-xl font-bold text-white">
              No notifications
            </p>

            <p className="notification-card-description mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500">
              There are no alerts for the selected filter.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
