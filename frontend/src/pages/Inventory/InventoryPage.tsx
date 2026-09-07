import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import axios from 'axios'
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  PackageMinus,
  PackagePlus,
  Search,
  } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
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
  createMovimentacao,
  listMovimentacoesRecentes,
  mapFrontendMovementTypeToBackend,
  mapMovimentacaoToInventoryMovement,
} from '../../services/movimentacoesApi'
import {
  listItens,
  mapItemApiToInventoryItem,
} from '../../services/itensApi'
import type {
  InventoryItem,
  InventoryMovement,
  ItemStatus,
  MovementType,
} from '../../types/domain'
import { formatDateTime } from '../../utils/formatters'
import {
  beginLatestRequest,
  isLatestRequest,
} from '../../utils/latestRequest'
import { MovementFormModal } from './MovementFormModal'
import type { MovementFormSubmitData } from './MovementFormModal'

const INVENTORY_ITEMS_PER_PAGE = 10
const MOVEMENT_ITEM_SEARCH_SIZE = 8

const statusOptions = [
  { label: 'All statuses', value: 'ALL' },
  { label: 'Normal', value: 'NORMAL' },
  { label: 'Low stock', value: 'LOW_STOCK' },
  { label: 'Out of stock', value: 'OUT_OF_STOCK' },
]

function getStatusBadge(status: ItemStatus) {
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

export function InventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [movements, setMovements] = useState<InventoryMovement[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ItemStatus | 'ALL'>('ALL')
  const [page, setPage] = useState(1)
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoadingItems, setIsLoadingItems] = useState(true)
  const [isLoadingMovements, setIsLoadingMovements] = useState(true)
  const [isSavingMovement, setIsSavingMovement] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false)
  const [movementType, setMovementType] = useState<MovementType>('IN')
  const [selectedItemId, setSelectedItemId] = useState<string | undefined>()
  const [movementItemOptions, setMovementItemOptions] = useState<InventoryItem[]>([])
  const [isSearchingMovementItems, setIsSearchingMovementItems] = useState(false)
  const [movementItemSearchError, setMovementItemSearchError] = useState('')

  const movementItemSearchSequenceRef = useRef(0)
  const itemsRequestSequenceRef = useRef(0)
  const movementsRequestSequenceRef = useRef(0)

  async function fetchItems(
    nextPage = page,
    nextSearch = search,
    nextStatus = status,
  ) {
    const requestSequence = beginLatestRequest(itemsRequestSequenceRef)

    setIsLoadingItems(true)
    setErrorMessage(null)

    try {
      const response = await listItens({
        page: nextPage,
        size: INVENTORY_ITEMS_PER_PAGE,
        search: nextSearch,
        status: nextStatus,
        active: true,
      })

      if (!isLatestRequest(itemsRequestSequenceRef, requestSequence)) {
        return
      }

      setItems(response.content.map(mapItemApiToInventoryItem))
      setTotalElements(response.totalElements)
      setTotalPages(Math.max(response.totalPages, 1))
    } catch (error) {
      if (!isLatestRequest(itemsRequestSequenceRef, requestSequence)) {
        return
      }

      setErrorMessage(getApiErrorMessage(error))
      setItems([])
      setTotalElements(0)
      setTotalPages(1)
    } finally {
      if (isLatestRequest(itemsRequestSequenceRef, requestSequence)) {
        setIsLoadingItems(false)
      }
    }
  }

  async function fetchRecentMovements() {
    const requestSequence = beginLatestRequest(movementsRequestSequenceRef)

    setIsLoadingMovements(true)

    try {
      const response = await listMovimentacoesRecentes(5)

      if (!isLatestRequest(movementsRequestSequenceRef, requestSequence)) {
        return
      }

      setMovements(response.map(mapMovimentacaoToInventoryMovement))
    } catch (error) {
      if (!isLatestRequest(movementsRequestSequenceRef, requestSequence)) {
        return
      }

      setErrorMessage(getApiErrorMessage(error))
      setMovements([])
    } finally {
      if (isLatestRequest(movementsRequestSequenceRef, requestSequence)) {
        setIsLoadingMovements(false)
      }
    }
  }

  const resetMovementItemSearch = useCallback((initialItems: InventoryItem[] = []) => {
    movementItemSearchSequenceRef.current += 1
    setMovementItemOptions(initialItems)
    setMovementItemSearchError('')
    setIsSearchingMovementItems(false)
  }, [])

  const handleMovementItemSearch = useCallback(async (term: string) => {
    const searchTerm = term.trim()
    const searchSequence = movementItemSearchSequenceRef.current + 1

    movementItemSearchSequenceRef.current = searchSequence
    setMovementItemSearchError('')

    if (searchTerm.length < 2) {
      setMovementItemOptions([])
      setIsSearchingMovementItems(false)
      return
    }

    setIsSearchingMovementItems(true)

    try {
      const response = await listItens({
        page: 1,
        size: MOVEMENT_ITEM_SEARCH_SIZE,
        search: searchTerm,
        status: 'ALL',
        active: true,
      })

      if (movementItemSearchSequenceRef.current !== searchSequence) {
        return
      }

      setMovementItemOptions(response.content.map(mapItemApiToInventoryItem))
    } catch (error) {
      if (movementItemSearchSequenceRef.current !== searchSequence) {
        return
      }

      setMovementItemOptions([])
      setMovementItemSearchError(getApiErrorMessage(error))
    } finally {
      if (movementItemSearchSequenceRef.current === searchSequence) {
        setIsSearchingMovementItems(false)
      }
    }
  }, [])

  useEffect(() => {
    void Promise.resolve().then(() => fetchItems())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, status, refreshVersion])

  useEffect(() => {
    void Promise.resolve().then(() => fetchRecentMovements())
  }, [refreshVersion])

  function openMovementModal(type: MovementType, itemId?: string) {
    const preselectedItem = itemId
      ? items.find((item) => item.id === itemId)
      : undefined

    setMovementType(type)
    setSelectedItemId(itemId)
    setFeedbackMessage(null)
    setErrorMessage(null)
    resetMovementItemSearch(preselectedItem ? [preselectedItem] : [])
    setIsMovementModalOpen(true)
  }

  function closeMovementModal() {
    if (isSavingMovement) {
      return
    }

    setIsMovementModalOpen(false)
    setSelectedItemId(undefined)
    resetMovementItemSearch()
  }

  async function handleSaveMovement(input: MovementFormSubmitData) {
    setIsSavingMovement(true)
    setErrorMessage(null)
    setFeedbackMessage(null)

    try {
      const observacaoBase = input.observacao?.trim()

      const observacaoFinal =
        input.type === 'OUT'
          ? ['Requester: ' + input.requesterName?.trim(), observacaoBase]
              .filter(Boolean)
              .join(' | ')
          : observacaoBase || null

      await createMovimentacao({
        itemId: Number(input.itemId),
        tipo: mapFrontendMovementTypeToBackend(input.type),
        quantidade: input.quantity,
        motivo: input.motivo,
        observacao: observacaoFinal || null,
      })

      setFeedbackMessage(
        input.type === 'IN'
          ? 'Receipt recorded successfully.'
          : 'Issue recorded successfully.',
      )

      setIsMovementModalOpen(false)
      setSelectedItemId(undefined)
      resetMovementItemSearch()
      setRefreshVersion((value) => value + 1)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsSavingMovement(false)
    }
  }

  function clearFilters() {
    setSearch('')
    setStatus('ALL')
    setPage(1)
  }

  const totalStockUnits = items.reduce(
    (total, item) => total + item.currentStock,
    0,
  )

  const lowStockItems = items.filter(
    (item) => item.status === 'LOW_STOCK',
  ).length

  const outOfStockItems = items.filter(
    (item) => item.status === 'OUT_OF_STOCK',
  ).length

  const itemColumns: TableColumn<InventoryItem>[] = [
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
      header: 'Current balance',
      align: 'right',
      render: (item) => (
        <div className="text-right">
          <p className="font-display text-xl font-bold text-white">
            {item.currentStock}
            <span className="ml-1 text-sm font-semibold text-slate-500">
              {item.unit}
            </span>
          </p>

          <p className="mt-1 text-xs text-slate-500">
            minimum: {item.minimumStock}
          </p>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      render: (item) => (
        <div>
          <p className="font-medium text-slate-200">{item.location}</p>
          <p className="mt-1 text-xs text-slate-500">{item.supplierName}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (item) => getStatusBadge(item.status),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (item) => (
        <div className="flex justify-end gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => openMovementModal('IN', item.id)}
          >
            <ArrowDownToLine size={15} />
            Receipt
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={() => openMovementModal('OUT', item.id)}
          >
            <ArrowUpFromLine size={15} />
            Issue
          </Button>
        </div>
      ),
    },
  ]

  const movementColumns: TableColumn<InventoryMovement>[] = [
    {
      key: 'item',
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
      key: 'user',
      header: 'Recorded by',
      render: (movement) => (
        <span className="font-medium text-slate-300">
          {movement.userName}
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory and movements"
        description="Review balances, record receipts and issues, and follow the operational history."
        actions={
          <>
            <Button variant="secondary" onClick={() => openMovementModal('OUT')}>
              <PackageMinus size={17} />
              Record issue
            </Button>

            <Button onClick={() => openMovementModal('IN')}>
              <PackagePlus size={17} />
              Record receipt
            </Button>
          </>
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card variant="metric">
          <p className="text-sm font-semibold text-nexus-navy">
            Registered items
          </p>

          <MetricValue isLoading={isLoadingItems}>
            {totalElements}
          </MetricValue>
        </Card>

        <Card variant="metric">
          <p className="text-sm font-semibold text-nexus-navy">
            Units on this page
          </p>

          <MetricValue isLoading={isLoadingItems}>
                {totalStockUnits}
              </MetricValue>

          <p className="mt-2 text-sm text-nexus-muted">
            sum of displayed balances
          </p>
        </Card>

        <Card variant="metric">
          <p className="text-sm font-semibold text-nexus-navy">
            Low stock on this page
          </p>

          <MetricValue isLoading={isLoadingItems}>
            {lowStockItems}
          </MetricValue>
        </Card>

        <Card variant="metric">
          <p className="text-sm font-semibold text-nexus-navy">
            Out of stock on this page
          </p>

          <MetricValue isLoading={isLoadingItems}>
                {outOfStockItems}
              </MetricValue>

          <p className="mt-2 text-sm text-nexus-muted">
            require replenishment
          </p>
        </Card>
      </div>

      <Card variant="soft">
        <div className="grid gap-4 xl:grid-cols-[1fr_240px_auto] xl:items-end">
          <SearchInput
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder="Search by code, item, supplier, or location..."
          />

          <Select
            aria-label="Filter by status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as ItemStatus | 'ALL')
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

      <Table
        columns={itemColumns}
        data={isLoadingItems ? [] : items}
        emptyTitle={isLoadingItems ? 'Loading items...' : 'No items found'}
        emptyDescription={
          isLoadingItems
            ? 'Wait while the records are loaded.'
            : errorMessage || 'Change the search term or filter to review inventory.'
        }
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={totalElements}
        onPageChange={setPage}
      />

      <Card>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-2xl font-bold text-nexus-navy">
            Latest movements
          </h2>
        </div>

        <Table
          columns={movementColumns}
          data={isLoadingMovements ? [] : movements}
          emptyTitle={
            isLoadingMovements
              ? 'Loading movements...'
              : 'No movements recorded'
          }
          emptyDescription={
            isLoadingMovements
              ? 'Wait while the recent history is loaded.'
              : 'Record a receipt or issue to generate history.'
          }
        />
      </Card>

      <MovementFormModal
        open={isMovementModalOpen}
        items={movementItemOptions}
        defaultType={movementType}
        defaultItemId={selectedItemId}
        onClose={closeMovementModal}
        onSave={handleSaveMovement}
        isSaving={isSavingMovement}
        onItemSearch={handleMovementItemSearch}
        isSearchingItems={isSearchingMovementItems}
        itemSearchError={movementItemSearchError}
      />
    </div>
  )
}
