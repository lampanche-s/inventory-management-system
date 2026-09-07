import {
  useEffect,
  useMemo,
  useState } from 'react'
import axios from 'axios'
import { ArrowLeftRight, ClipboardList, TriangleAlert } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import {
  Badge,
  Button,
  Card,
  PageHeader,
  Table,
  type TableColumn,
  MetricValue,
} from '../../components/ui'
import type { ApiErrorResponse } from '../../services/apiClient'
import { getDashboard } from '../../services/dashboardApi'
import {
  listItens,
  mapItemApiToInventoryItem,
} from '../../services/itensApi'
import {
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
  ItemStatus,
  MovementType,
  RequestStatus,
  StockRequest,
} from '../../types/domain'
import {
  formatCurrency,
  formatDateOnly,
  formatDateTime,
} from '../../utils/formatters'
import { fetchAllPages } from '../../utils/pagination'

const DAY_IN_MS = 24 * 60 * 60 * 1000

type ExpirationAlertStatus = 'EXPIRED' | 'TODAY' | 'SOON'

type ExpirationAlert = {
  item: InventoryItem
  status: ExpirationAlertStatus
  daysUntilExpiration: number
  expirationDate: string
}

type DashboardSummary = {
  totalItens: number
  valorTotalEstoque: number
  itensAbaixoMinimo: number
  itensZerados: number
  movimentacoesHoje: number
  totalEntradasHoje: number
  totalSaidasHoje: number
}

const emptySummary: DashboardSummary = {
  totalItens: 0,
  valorTotalEstoque: 0,
  itensAbaixoMinimo: 0,
  itensZerados: 0,
  movimentacoesHoje: 0,
  totalEntradasHoje: 0,
  totalSaidasHoje: 0,
}

function getItemStatusBadge(status: ItemStatus) {
  if (status === 'NORMAL') {
    return <Badge variant="success">Normal</Badge>
  }

  if (status === 'LOW_STOCK') {
    return <Badge variant="warning">Low</Badge>
  }

  return <Badge variant="danger">Out of stock</Badge>
}

function getMovementBadge(type: MovementType) {
  if (type === 'IN') {
    return <Badge variant="success">Receipt</Badge>
  }

  return <Badge variant="danger">Issue</Badge>
}

function getRequestBadge(status: RequestStatus) {
  if (status === 'PENDING') {
    return <Badge variant="warning" pulse>Pending</Badge>
  }

  if (status === 'APPROVED') {
    return <Badge variant="success">Approved</Badge>
  }

  if (status === 'REJECTED') {
    return <Badge variant="danger">Rejected</Badge>
  }

  return <Badge variant="neutral">Canceled</Badge>
}

function getExpirationBadge(status: ExpirationAlertStatus) {
  if (status === 'EXPIRED') {
    return <Badge variant="danger">Expired</Badge>
  }

  if (status === 'TODAY') {
    return <Badge variant="danger">Due today</Badge>
  }

  return <Badge variant="warning">Upcoming</Badge>
}

function getProgressWidth(value: number) {
  return `${Math.min(Math.max(value, 0), 100)}%`
}

function parseDateOnly(value?: string) {
  if (!value) {
    return null
  }

  const [year, month, day] = value.split('-').map(Number)

  if (!year || !month || !day) {
    return null
  }

  const date = new Date(year, month - 1, day)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  date.setHours(0, 0, 0, 0)
  return date
}

function getExpirationAlert(
  item: InventoryItem,
  today: Date,
): ExpirationAlert | null {
  const expirationDate = parseDateOnly(item.expirationDate)

  if (!expirationDate || !item.expirationDate) {
    return null
  }

  const warningDate = parseDateOnly(item.expirationWarningDate)
  const daysUntilExpiration = Math.ceil(
    (expirationDate.getTime() - today.getTime()) / DAY_IN_MS,
  )

  if (daysUntilExpiration < 0) {
    return {
      item,
      status: 'EXPIRED',
      daysUntilExpiration,
      expirationDate: item.expirationDate,
    }
  }

  if (daysUntilExpiration === 0) {
    return {
      item,
      status: 'TODAY',
      daysUntilExpiration,
      expirationDate: item.expirationDate,
    }
  }

  const reachedWarningDate =
    warningDate !== null && today.getTime() >= warningDate.getTime()

  const reachedDefaultWarning = daysUntilExpiration <= 30

  if (reachedWarningDate || reachedDefaultWarning) {
    return {
      item,
      status: 'SOON',
      daysUntilExpiration,
      expirationDate: item.expirationDate,
    }
  }

  return null
}

function getExpirationPriority(status: ExpirationAlertStatus) {
  if (status === 'EXPIRED') {
    return 0
  }

  if (status === 'TODAY') {
    return 1
  }

  return 2
}

function getExpirationDescription(alert: ExpirationAlert) {
  if (alert.status === 'EXPIRED') {
    const days = Math.abs(alert.daysUntilExpiration)
    return days === 1 ? 'expired 1 day ago' : `expired ${days} days ago`
  }

  if (alert.status === 'TODAY') {
    return 'expires today'
  }

  return alert.daysUntilExpiration === 1
    ? 'expires in 1 day'
    : `expires in ${alert.daysUntilExpiration} days`
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
    'Could not load the dashboard.'
  )
}

export function DashboardPage() {
  const currentRole = useAuthStore((state) => state.currentRole)
  const navigate = useNavigate()

  const [summary, setSummary] = useState<DashboardSummary>(emptySummary)
  const [items, setItems] = useState<InventoryItem[]>([])
  const [recentMovements, setRecentMovements] = useState<InventoryMovement[]>([])
  const [pendingRequests, setPendingRequests] = useState<StockRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const isRequesterOnly = currentRole === 'SOLICITANTE'
  const canOpenReports = currentRole === 'SUPER_ADMIN' || currentRole === 'ADMIN' || currentRole === 'FUNCIONARIO'

  const today = useMemo(() => {
    const currentDate = new Date()
    currentDate.setHours(0, 0, 0, 0)
    return currentDate
  }, [])

  async function fetchDashboardData() {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const [itemRecords, requestsResponse] = await Promise.all([
        fetchAllPages((pageNumber, pageSize) =>
          listItens({
            page: pageNumber,
            size: pageSize,
            status: 'ALL',
            active: true,
          }),
        ),
        isRequesterOnly
          ? listMinhasSolicitacoes({
              page: 1,
              size: 5,
              status: 'PENDING',
            })
          : listSolicitacoes({
              page: 1,
              size: 5,
              status: 'PENDING',
            }),
      ])

      const mappedItems = itemRecords.map(mapItemApiToInventoryItem)
      const mappedRequests = requestsResponse.content.map(mapSolicitacaoToStockRequest)

      setItems(mappedItems)
      setPendingRequests(mappedRequests)

      if (isRequesterOnly) {
        setSummary({
          ...emptySummary,
          totalItens: mappedItems.length,
          itensAbaixoMinimo: mappedItems.filter((item) => item.status === 'LOW_STOCK').length,
          itensZerados: mappedItems.filter((item) => item.status === 'OUT_OF_STOCK').length,
        })
        setRecentMovements([])
        return
      }

      const dashboard = await getDashboard()

      setSummary({
        totalItens: Number(dashboard.resumo?.totalItens ?? mappedItems.length),
        valorTotalEstoque: Number(dashboard.resumo?.valorTotalEstoque ?? 0),
        itensAbaixoMinimo: Number(dashboard.resumo?.itensAbaixoMinimo ?? 0),
        itensZerados: Number(dashboard.resumo?.itensZerados ?? 0),
        movimentacoesHoje: Number(dashboard.resumo?.movimentacoesHoje ?? 0),
        totalEntradasHoje: Number(dashboard.resumo?.totalEntradasHoje ?? 0),
        totalSaidasHoje: Number(dashboard.resumo?.totalSaidasHoje ?? 0),
      })

      setRecentMovements(
        (dashboard.ultimasMovimentacoes ?? [])
          .map(mapMovimentacaoToInventoryMovement)
          .slice(0, 5),
      )
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
      setSummary(emptySummary)
      setItems([])
      setRecentMovements([])
      setPendingRequests([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => fetchDashboardData())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRole])

  const criticalItems = useMemo(() => {
    return items
      .filter((item) => item.status === 'LOW_STOCK' || item.status === 'OUT_OF_STOCK')
      .sort((a, b) => {
        const aSeverity = a.status === 'OUT_OF_STOCK' ? 0 : 1
        const bSeverity = b.status === 'OUT_OF_STOCK' ? 0 : 1

        return aSeverity - bSeverity || a.currentStock - b.currentStock
      })
  }, [items])

  const expirationAlerts = useMemo(() => {
    return items
      .map((item) => getExpirationAlert(item, today))
      .filter((alert): alert is ExpirationAlert => alert !== null)
      .sort((a, b) => {
        return (
          getExpirationPriority(a.status) - getExpirationPriority(b.status) ||
          a.daysUntilExpiration - b.daysUntilExpiration ||
          a.item.name.localeCompare(b.item.name)
        )
      })
  }, [items, today])

  const totalUnits = items.reduce(
    (total, item) => total + item.currentStock,
    0,
  )

  const expiredCount = expirationAlerts.filter(
    (alert) => alert.status === 'EXPIRED',
  ).length

  const dueTodayCount = expirationAlerts.filter(
    (alert) => alert.status === 'TODAY',
  ).length

  const soonToExpireCount = expirationAlerts.filter(
    (alert) => alert.status === 'SOON',
  ).length

  const stockHealthPercentage =
    summary.totalItens > 0
      ? ((summary.totalItens - summary.itensAbaixoMinimo - summary.itensZerados) / summary.totalItens) * 100
      : 0

  const movementColumns: TableColumn<InventoryMovement>[] = [
    {
      key: 'movement',
      header: 'Movement',
      render: (movement) => (
        <div>
          <p className="font-semibold text-white">{movement.itemName}</p>
          <p className="mt-1 text-xs text-slate-500">
            {movement.itemCode} · {movement.reason}
          </p>
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      align: 'center',
      render: (movement) => getMovementBadge(movement.type),
    },
    {
      key: 'quantity',
      header: 'Qty.',
      align: 'right',
      render: (movement) => (
        <span className="font-display text-lg font-bold text-white">
          {movement.quantity}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Date',
      render: (movement) => (
        <span className="text-xs text-slate-400">
          {formatDateTime(movement.createdAt)}
        </span>
      ),
    },
  ]

  const criticalItemColumns: TableColumn<InventoryItem>[] = [
    {
      key: 'item',
      header: 'Item',
      render: (item) => (
        <div>
          <p className="font-semibold text-white">{item.name}</p>
          <p className="mt-1 text-xs text-slate-500">
            {item.code} · {item.category}
          </p>
        </div>
      ),
    },
    {
      key: 'stock',
      header: 'Balance',
      align: 'right',
      render: (item) => (
        <div className="text-right">
          <p className="font-display text-lg font-bold text-white">
            {item.currentStock}
            <span className="ml-1 text-xs text-slate-500">{item.unit}</span>
          </p>
          <p className="mt-1 text-xs text-slate-500">
            min. {item.minimumStock}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (item) => getItemStatusBadge(item.status),
    },
  ]

  const requestColumns: TableColumn<StockRequest>[] = [
    {
      key: 'request',
      header: 'Request',
      render: (request) => (
        <div>
          <p className="font-semibold text-white">{request.itemName}</p>
          <p className="mt-1 text-xs text-slate-500">
            {request.itemCode} · {request.requesterName}
          </p>
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'Qty.',
      align: 'right',
      render: (request) => (
        <span className="font-display text-lg font-bold text-white">
          {request.quantity}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (request) => getRequestBadge(request.status),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory dashboard"
        description="Monitor inventory, requests, expiration dates, recent movements, and operational alerts in one place."
        actions={
          <>
          {canOpenReports && (
            <Button variant="secondary" onClick={() => navigate('/reports')}>
              Reports
            </Button>
          )}

          {!isRequesterOnly && (
            <Button
              className="dashboard-primary-flat"
              onClick={() => navigate('/inventory')}
            >
              <ArrowLeftRight size={17} strokeWidth={2} />
              Record movement
            </Button>
          )}

          {isRequesterOnly && (
            <Button onClick={() => navigate('/requests')}>
              New request
            </Button>
          )}
          </>
        }
      />

      {errorMessage && (
        <Card variant="soft" className="border-red-400/20 bg-red-500/10">
          <p className="text-sm font-semibold text-red-200">
            {errorMessage}
          </p>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card variant="metric">
          <div>
            <p className="text-sm font-semibold text-nexus-navy">
              Registered items
            </p>
            <MetricValue isLoading={isLoading}>
              {summary.totalItens}
            </MetricValue>
          </div>

          <p className="mt-3 text-sm text-nexus-muted">
            {totalUnits} units shown
          </p>
        </Card>

        <Card variant="metric">
          <div>
            <p className="text-sm font-semibold text-nexus-navy">
              Stock alerts
            </p>
            <MetricValue isLoading={isLoading}>
              {summary.itensAbaixoMinimo + summary.itensZerados}
            </MetricValue>
          </div>

          <p className="mt-3 text-sm text-nexus-muted">
            {summary.itensAbaixoMinimo} low · {summary.itensZerados} empty
          </p>
        </Card>

        <Card variant="metric">
          <p className="text-sm font-semibold text-nexus-navy">
            Estimated value
          </p>

          <MetricValue isLoading={isLoading} size="md">
            {formatCurrency(summary.valorTotalEstoque)}
          </MetricValue>

          <p className="mt-3 text-sm text-nexus-muted">
            based on the current balance
          </p>
        </Card>

        <Card variant="metric">
          <div>
            <p className="text-sm font-semibold text-nexus-navy">
              Pending requests
            </p>
            <MetricValue isLoading={isLoading}>
              {pendingRequests.length}
            </MetricValue>
          </div>

          <p className="mt-3 text-sm text-nexus-muted">
            awaiting review
          </p>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <div className="mb-6">
            <div>
              <Badge
                variant="neutral"
                className="!font-semibold !tracking-normal"
              >
                Inventory health
              </Badge>

              <h2 className="mt-3 font-display text-2xl font-bold text-white">
                Operational status
              </h2>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="font-semibold text-slate-300">
                Healthy stock
              </span>
              <span className="font-bold text-white">
                {stockHealthPercentage.toFixed(0)}%
              </span>
            </div>

            <div className="h-4 overflow-hidden rounded-full bg-white/[0.06]">
              <div
                className="h-full rounded-full bg-nexus-bright"
                style={{ width: getProgressWidth(stockHealthPercentage) }}
              />
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-nexus-border bg-white/[0.035] p-4">
              <p className="text-xs font-semibold tracking-normal text-slate-500">
                Today
              </p>
              <MetricValue
                isLoading={isLoading}
                size="sm"
                className="mt-2 block font-display text-2xl font-bold leading-none text-white tabular-nums"
              >
                {summary.movimentacoesHoje}
              </MetricValue>
              <p className="mt-1 text-xs text-slate-500">movements</p>
            </div>

            <div className="rounded-3xl border border-nexus-border bg-white/[0.035] p-4">
              <p className="text-xs font-semibold tracking-normal text-slate-500">
                Receipts
              </p>
              <MetricValue
                isLoading={isLoading}
                size="sm"
                className="mt-2 block font-display text-2xl font-bold leading-none text-white tabular-nums"
              >
                {summary.totalEntradasHoje}
              </MetricValue>
              <p className="mt-1 text-xs text-slate-500">today</p>
            </div>

            <div className="rounded-3xl border border-nexus-border bg-white/[0.035] p-4">
              <p className="text-xs font-semibold tracking-normal text-slate-500">
                Issues
              </p>
              <MetricValue
                isLoading={isLoading}
                size="sm"
                className="mt-2 block font-display text-2xl font-bold leading-none text-white tabular-nums"
              >
                {summary.totalSaidasHoje}
              </MetricValue>
              <p className="mt-1 text-xs text-slate-500">today</p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="mb-6">
            <h2 className="font-display text-2xl font-bold text-white">
              Critical expiration dates
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg bg-red-500/10 p-4">
              <p className="text-xs font-semibold tracking-normal text-red-500">
                Expired
              </p>
              <MetricValue
                isLoading={isLoading}
                size="sm"
                className="mt-2 block font-display text-2xl font-bold leading-none text-white tabular-nums"
              >
                {expiredCount}
              </MetricValue>
            </div>

            <div className="rounded-lg bg-red-500/10 p-4">
              <p className="text-xs font-semibold tracking-normal text-red-500">
                Today
              </p>
              <MetricValue
                isLoading={isLoading}
                size="sm"
                className="mt-2 block font-display text-2xl font-bold leading-none text-white tabular-nums"
              >
                {dueTodayCount}
              </MetricValue>
            </div>

            <div className="rounded-lg bg-amber-500/10 p-4">
              <p className="text-xs font-semibold tracking-normal text-amber-500">
                Soon
              </p>
              <MetricValue
                isLoading={isLoading}
                size="sm"
                className="mt-2 block font-display text-2xl font-bold leading-none text-white tabular-nums"
              >
                {soonToExpireCount}
              </MetricValue>
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {expirationAlerts.slice(0, 4).map((alert) => (
              <div
                key={alert.item.id}
                className="rounded-lg border border-nexus-border bg-white p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white">
                      {alert.item.name}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {alert.item.code} · expires on {formatDateOnly(alert.expirationDate)}
                    </p>
                  </div>

                  {getExpirationBadge(alert.status)}
                </div>

                <p className="mt-3 text-xs font-semibold text-slate-500">
                  {getExpirationDescription(alert)}
                </p>
              </div>
            ))}

            {expirationAlerts.length === 0 && (
              <div className="rounded-lg border border-nexus-border bg-white p-5">
                <p className="font-semibold text-white">
                  No critical expiration dates
                </p>

                <p className="mt-2 text-sm leading-6 text-nexus-muted">
                  Expired items and upcoming expiration dates will appear here.
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <TriangleAlert
                size={19}
                strokeWidth={2}
                className="shrink-0 text-nexus-warning"
              />

              <h2 className="truncate text-base font-semibold text-nexus-navy">
                Critical stock
              </h2>
            </div>

            <button
              type="button"
              onClick={() => navigate('/items')}
              className="text-action-link shrink-0 text-sm"
            >
              View items
            </button>
          </div>

          <Table
            columns={criticalItemColumns}
            data={criticalItems.slice(0, 5)}
            emptyTitle="No critical items"
            emptyDescription="There are no items below their minimum or out of stock."
          />
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <ClipboardList
                size={19}
                strokeWidth={2}
                className="shrink-0 text-nexus-bright"
              />

              <h2 className="truncate text-base font-semibold text-nexus-navy">
                Pending requests
              </h2>
            </div>

            <button
              type="button"
              onClick={() => navigate('/requests')}
              className="text-action-link shrink-0 text-sm"
            >
              View requests
            </button>
          </div>

          <Table
            columns={requestColumns}
            data={pendingRequests.slice(0, 5)}
            emptyTitle="No pending requests"
            emptyDescription="All requests have been reviewed."
          />
        </Card>
      </div>

      {!isRequesterOnly && (
        <Card>
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-white">
                Latest movements
              </h2>
            </div>

            <button
              type="button"
              onClick={() => navigate('/inventory')}
              className="text-action-link shrink-0 text-sm"
            >
              View inventory
            </button>
          </div>

          <Table
            columns={movementColumns}
            data={recentMovements}
            emptyTitle="No movements recorded"
            emptyDescription="Record a receipt or issue to populate the dashboard."
          />
        </Card>
      )}
    </div>
  )
}
