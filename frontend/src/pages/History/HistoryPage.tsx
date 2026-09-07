import {
  useEffect,
  useMemo,
  useRef,
  useState } from 'react'
import axios from 'axios'
import {
  Boxes,
  ClipboardCheck,
  Download,
  Search,
  } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  Input,
  Pagination,
  SearchInput,
  Select,
  Table,
  type TableColumn,
  MetricValue,
  PageHeader,
} from '../../components/ui'
import type { ApiErrorResponse } from '../../services/apiClient'
import {
  listMovimentacoes,
  mapMovimentacaoToInventoryMovement,
} from '../../services/movimentacoesApi'
import {
  listMinhasSolicitacoes,
  listSolicitacoes,
  mapSolicitacaoToStockRequest,
} from '../../services/solicitacoesApi'
import {
  canManageRequests,
  useAuthStore,
} from '../../store/authStore'
import type {
  InventoryMovement,
  StockRequest,
  SystemHistoryArea,
  SystemHistoryEvent,
} from '../../types/domain'
import { formatDateTime, normalizeSearch } from '../../utils/formatters'
import { downloadCsv, getExportDateSuffix } from '../../utils/exporters'
import {
  beginLatestRequest,
  isLatestRequest,
} from '../../utils/latestRequest'
import { fetchAllPages } from '../../utils/pagination'

const HISTORY_ITEMS_PER_PAGE = 12

function formatDateInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8)

  if (digits.length <= 2) {
    return digits
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`
  }

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

function dateToIso(value: string) {
  const [day, month, year] = value.split('/')

  if (!day || !month || !year || year.length !== 4) {
    return undefined
  }

  const dayNumber = Number(day)
  const monthNumber = Number(month)
  const yearNumber = Number(year)

  const date = new Date(yearNumber, monthNumber - 1, dayNumber)

  const isValid =
    date.getFullYear() === yearNumber &&
    date.getMonth() === monthNumber - 1 &&
    date.getDate() === dayNumber

  if (!isValid) {
    return undefined
  }

  return `${year}-${month}-${day}`
}

const areaOptions = [
  { label: 'All areas', value: 'ALL' },
  { label: 'Inventory', value: 'STOCK' },
  { label: 'Requests', value: 'REQUESTS' },
]

function getAreaLabel(area: SystemHistoryArea) {
  if (area === 'STOCK') {
    return 'Inventory'
  }

  if (area === 'REQUESTS') {
    return 'Requests'
  }

  if (area === 'ITEMS') {
    return 'Items'
  }

  if (area === 'SUPPLIERS') {
    return 'Suppliers'
  }

  return 'Categories'
}

function getAreaBadge(area: SystemHistoryArea) {
  if (area === 'STOCK') {
    return <Badge variant="success">Inventory</Badge>
  }

  if (area === 'REQUESTS') {
    return <Badge variant="danger">Requests</Badge>
  }

  return <Badge variant="neutral">{getAreaLabel(area)}</Badge>
}

function getAreaIcon(area: SystemHistoryArea) {
  if (area === 'STOCK') {
    return Boxes
  }

  return ClipboardCheck
}

function getAreaIconClass(area: SystemHistoryArea) {
  if (area === 'STOCK') {
    return 'bg-green-500/15 text-green-300'
  }

  return 'bg-indigo-500/15 text-indigo-300'
}

function requestStatusLabel(status: StockRequest['status']) {
  if (status === 'PENDING') {
    return 'pending'
  }

  if (status === 'APPROVED') {
    return 'approved'
  }

  if (status === 'REJECTED') {
    return 'rejected'
  }

  return 'canceled'
}

function getRequestTitle(status: StockRequest['status']) {
  if (status === 'PENDING') {
    return 'Request created'
  }

  if (status === 'APPROVED') {
    return 'Request approved'
  }

  if (status === 'REJECTED') {
    return 'Request rejected'
  }

  return 'Request canceled'
}

function getRequestType(status: StockRequest['status']): SystemHistoryEvent['type'] {
  if (status === 'PENDING') {
    return 'REQUEST_CREATED'
  }

  if (status === 'APPROVED') {
    return 'REQUEST_APPROVED'
  }

  if (status === 'REJECTED') {
    return 'REQUEST_REJECTED'
  }

  return 'REQUEST_CANCELED'
}

function movementToHistoryEvent(movement: InventoryMovement): SystemHistoryEvent {
  const isEntry = movement.type === 'IN'

  return {
    id: `movement-${movement.id}`,
    type: isEntry ? 'STOCK_IN' : 'STOCK_OUT',
    area: 'STOCK',
    title: isEntry ? 'Receipt recorded' : 'Issue recorded',
    description: `${movement.quantity} unit(s) of ${movement.itemName}. Reason: ${movement.reason}.`,
    actorName: movement.userName,
    entityId: movement.itemCode,
    entityName: movement.itemName,
    createdAt: movement.createdAt,
  }
}

function requestToHistoryEvent(request: StockRequest): SystemHistoryEvent {
  const statusLabel = requestStatusLabel(request.status)
  const actorName = request.decidedByName || request.requesterName
  const createdAt = request.decidedAt || request.createdAt

  return {
    id: `request-${request.id}-${request.status}`,
    type: getRequestType(request.status),
    area: 'REQUESTS',
    title: getRequestTitle(request.status),
    description: `${request.requesterName} requested ${request.quantity} unit(s) of ${request.itemName}. Status: ${statusLabel}.${request.requestReason ? ` Reason: ${request.requestReason}.` : ''}${request.decisionNote ? ` Decision note: ${request.decisionNote}.` : ''}`,
    actorName,
    entityId: request.id,
    entityName: request.itemName,
    createdAt,
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
    'Could not load the history.'
  )
}

export function HistoryPage() {
  const currentRole = useAuthStore((state) => state.currentRole)
  const userCanManageRequests = canManageRequests(currentRole)

  const [events, setEvents] = useState<SystemHistoryEvent[]>([])
  const [search, setSearch] = useState('')
  const [area, setArea] = useState('ALL')
  const [selectedDate, setSelectedDate] = useState('')
  const [page, setPage] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  const historyRequestSequenceRef = useRef(0)

  async function fetchHistory() {
    const requestSequence = beginLatestRequest(historyRequestSequenceRef)
    const selectedDateIso = dateToIso(selectedDate)

    if (selectedDate && !selectedDateIso) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    try {
      const requestsPromise = fetchAllPages((pageNumber, pageSize) =>
        userCanManageRequests
          ? listSolicitacoes({
              page: pageNumber,
              size: pageSize,
              status: 'ALL',
              data: selectedDateIso,
            })
          : listMinhasSolicitacoes({
              page: pageNumber,
              size: pageSize,
              status: 'ALL',
              data: selectedDateIso,
            }),
      )

      const [requestRecords, movementRecords] = await Promise.all([
        requestsPromise,
        userCanManageRequests
          ? fetchAllPages((pageNumber, pageSize) =>
              listMovimentacoes({
                page: pageNumber,
                size: pageSize,
                type: 'ALL',
                data: selectedDateIso,
              }),
            )
          : Promise.resolve([]),
      ])

      const movementEvents = movementRecords
        .map(mapMovimentacaoToInventoryMovement)
        .map(movementToHistoryEvent)

      const requestEvents = requestRecords
        .map(mapSolicitacaoToStockRequest)
        .map(requestToHistoryEvent)

      if (!isLatestRequest(historyRequestSequenceRef, requestSequence)) {
        return
      }

      setEvents(
        [...movementEvents, ...requestEvents].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      )
    } catch (error) {
      if (!isLatestRequest(historyRequestSequenceRef, requestSequence)) {
        return
      }

      setErrorMessage(getApiErrorMessage(error))
      setEvents([])
    } finally {
      if (isLatestRequest(historyRequestSequenceRef, requestSequence)) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => fetchHistory())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRole, selectedDate])

  const filteredEvents = useMemo(() => {
    const normalizedSearch = normalizeSearch(search)

    return events.filter((event) => {
      const matchesArea = area === 'ALL' || event.area === area

      const searchableText = normalizeSearch(
        `${event.title} ${event.description} ${event.actorName} ${event.entityName ?? ''} ${event.type} ${event.area}`,
      )

      const matchesSearch =
        normalizedSearch.length === 0 ||
        searchableText.includes(normalizedSearch)

      return matchesArea && matchesSearch
    })
  }, [area, events, search])

  const totalPages = Math.max(
    Math.ceil(filteredEvents.length / HISTORY_ITEMS_PER_PAGE),
    1,
  )

  const safePage = Math.min(page, totalPages)

  const paginatedEvents = useMemo(() => {
    const startIndex = (safePage - 1) * HISTORY_ITEMS_PER_PAGE
    return filteredEvents.slice(startIndex, startIndex + HISTORY_ITEMS_PER_PAGE)
  }, [filteredEvents, safePage])

  const columns: TableColumn<SystemHistoryEvent>[] = [
    {
      key: 'event',
      header: 'Event',
      render: (event) => {
        const Icon = getAreaIcon(event.area)

        return (
          <div className="flex items-start gap-3">
            <div
              className={[
                'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
                getAreaIconClass(event.area),
              ].join(' ')}
            >
              <Icon size={20} />
            </div>

            <div>
              <p className="font-semibold text-white">
                {event.title}
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                {event.description}
              </p>

              {event.entityName && (
                <p className="mt-1 text-xs text-slate-600">
                  Reference: {event.entityName}
                </p>
              )}
            </div>
          </div>
        )
      },
    },
    {
      key: 'area',
      header: 'Area',
      align: 'center',
      render: (event) => getAreaBadge(event.area),
    },
    {
      key: 'actor',
      header: 'Actor',
      render: (event) => (
        <span className="text-sm font-medium text-slate-300">
          {event.actorName}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (event) => (
        <span className="text-xs font-medium text-slate-400">
          {formatDateTime(event.createdAt)}
        </span>
      ),
    },
  ]

  const totalEvents = events.length
  const stockEvents = events.filter((event) => event.area === 'STOCK').length
  const requestEvents = events.filter((event) => event.area === 'REQUESTS').length

  function clearFilters() {
    setSearch('')
    setArea('ALL')
    setSelectedDate('')
    setPage(1)
  }

  function exportHistory() {
    downloadCsv(
      'activity-history-' + getExportDateSuffix() + '.csv',
      [
        'Area',
        'Type',
        'Title',
        'Description',
        'Actor',
        'Reference',
        'Date',
      ],
      filteredEvents.map((event) => [
        getAreaLabel(event.area),
        event.type,
        event.title,
        event.description,
        event.actorName,
        event.entityName ?? '',
        event.createdAt,
      ]),
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="History"
        description="Review operational records for inventory movements and requests."
        actions={
          currentRole === 'SUPER_ADMIN' || currentRole === 'ADMIN' ? (
            <Button variant="secondary" onClick={exportHistory}>
              <Download size={17} />
              Export
            </Button>
          ) : null
        }
      />

      {errorMessage && (
        <Card variant="soft" className="border-red-400/20 bg-red-500/10">
          <p className="text-sm font-semibold text-red-200">
            {errorMessage}
          </p>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card variant="metric">
          <p className="text-sm font-semibold text-nexus-navy">
            Events
          </p>

          <MetricValue isLoading={isLoading}>
            {totalEvents}
          </MetricValue>
        </Card>

        <Card variant="metric">
          <p className="text-sm font-semibold text-nexus-navy">
            Inventory
          </p>

          <MetricValue isLoading={isLoading}>
                {stockEvents}
              </MetricValue>

          <p className="mt-2 text-sm text-nexus-muted">
            receipts and issues
          </p>
        </Card>

        <Card variant="metric">
          <p className="text-sm font-semibold text-nexus-navy">
            Requests
          </p>

          <MetricValue isLoading={isLoading}>
                {requestEvents}
              </MetricValue>

          <p className="mt-2 text-sm text-nexus-muted">
            requests and decisions
          </p>
        </Card>

      </div>

      <Card variant="soft">
        <div className="grid gap-4 xl:grid-cols-[1fr_240px_180px_auto] xl:items-end">
          <SearchInput
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder="Search by action, actor, item, reason, or request..."
          />

          <Select
            aria-label="Filter by area"
            value={area}
            onChange={(event) => {
              setArea(event.target.value)
              setPage(1)
            }}
            options={areaOptions}
          />

          <Input
            type="text"
            inputMode="numeric"
            aria-label="Filter by a specific date"
            placeholder="DD/MM/YYYY"
            maxLength={10}
            value={selectedDate}
            onChange={(event) => {
              setSelectedDate(formatDateInput(event.target.value))
              setPage(1)
            }}
          />

          <Button variant="secondary" onClick={clearFilters}>
            <Search size={17} />
            Clear
          </Button>
        </div>
      </Card>

      <Table
        columns={columns}
        data={isLoading ? [] : paginatedEvents}
        emptyTitle={isLoading ? 'Loading history...' : 'No events found'}
        emptyDescription={
          isLoading
            ? 'Wait while the records are loaded.'
            : 'Change the search term or area filter to view other records.'
        }
      />

      <Pagination
        page={safePage}
        totalPages={totalPages}
        totalItems={filteredEvents.length}
        onPageChange={setPage}
      />
    </div>
  )
}
