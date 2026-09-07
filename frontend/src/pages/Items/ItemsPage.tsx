import {
  useEffect,
  useRef,
  useState } from 'react'
import axios from 'axios'
import {
  Edit3,
  Plus,
  Tags,
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
  MetricValue,
  PageHeader,
} from '../../components/ui'
import type { ApiErrorResponse } from '../../services/apiClient'
import {
  listCategorias,
  mapCategoriaToInventoryCategory,
} from '../../services/categoriasApi'
import {
  createItem,
  deactivateItem,
  listItens,
  mapFrontendUnitToBackend,
  mapItemApiToInventoryItem,
  updateItem,
} from '../../services/itensApi'
import {
  listFornecedores,
  mapFornecedorToSupplier,
} from '../../services/fornecedoresApi'
import type {
  InventoryCategory,
  InventoryItem,
  ItemStatus,
  Supplier,
} from '../../types/domain'
import {
  formatCurrency,
  formatDateTime,
} from '../../utils/formatters'
import {
  beginLatestRequest,
  isLatestRequest,
} from '../../utils/latestRequest'
import { fetchAllPages } from '../../utils/pagination'
import { CategoryManagerModal } from './CategoryManagerModal'
import { ItemFormModal } from './ItemFormModal'
import type { ItemFormSubmitData } from './ItemFormModal'

const ITEMS_PER_PAGE = 10

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

export function ItemsPage() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [categories, setCategories] = useState<InventoryCategory[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ItemStatus | 'ALL'>('ALL')
  const [page, setPage] = useState(1)
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [isItemModalOpen, setIsItemModalOpen] = useState(false)
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null)
  const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null)

  const itemsRequestSequenceRef = useRef(0)
  const optionsRequestSequenceRef = useRef(0)

  async function fetchItems(
    nextPage = page,
    nextSearch = search,
    nextStatus = status,
  ) {
    const requestSequence = beginLatestRequest(itemsRequestSequenceRef)

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const response = await listItens({
        page: nextPage,
        size: ITEMS_PER_PAGE,
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
        setIsLoading(false)
      }
    }
  }

  async function fetchOptions() {
    const requestSequence = beginLatestRequest(optionsRequestSequenceRef)

    try {
      const [fornecedorRecords, categoriasResponse] = await Promise.all([
        fetchAllPages((pageNumber, pageSize) =>
          listFornecedores({
            page: pageNumber,
            size: pageSize,
            status: 'ACTIVE',
          }),
        ),
        listCategorias(),
      ])

      if (!isLatestRequest(optionsRequestSequenceRef, requestSequence)) {
        return
      }

      setSuppliers(fornecedorRecords.map(mapFornecedorToSupplier))
      setCategories(categoriasResponse.map(mapCategoriaToInventoryCategory))
    } catch (error) {
      if (!isLatestRequest(optionsRequestSequenceRef, requestSequence)) {
        return
      }

      setErrorMessage(getApiErrorMessage(error))
      setSuppliers([])
      setCategories([])
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => fetchItems())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, status, refreshVersion])

  useEffect(() => {
    void Promise.resolve().then(() => fetchOptions())
  }, [])

  function openCreateModal() {
    setEditingItem(null)
    setIsItemModalOpen(true)
  }

  function openEditModal(item: InventoryItem) {
    setEditingItem(item)
    setIsItemModalOpen(true)
  }

  function closeItemModal() {
    if (isSaving) {
      return
    }

    setEditingItem(null)
    setIsItemModalOpen(false)
  }

  async function handleSaveItem(item: ItemFormSubmitData) {
    setIsSaving(true)
    setErrorMessage(null)
    setFeedbackMessage(null)

    try {
      if (editingItem) {
        await updateItem(editingItem.id, {
          nome: item.name,
          categoria: item.category,
          unidade: mapFrontendUnitToBackend(item.unit),
          fornecedorId: Number(item.supplierId),
          corredor: null,
          prateleira: null,
          localizacao: item.location,
          estoqueMinimo: item.minimumStock,
          precoMedio: item.averagePrice,
          dataValidade: item.expirationDate ?? null,
          diasAvisoValidade: item.expirationWarningDays ?? null,
          imagemUrl: null,
        })

        setFeedbackMessage('Item updated successfully.')
      } else {
        await createItem({
          nome: item.name,
          sku: item.code || null,
          categoria: item.category,
          unidade: mapFrontendUnitToBackend(item.unit),
          fornecedorId: Number(item.supplierId),
          corredor: null,
          prateleira: null,
          localizacao: item.location,
          quantidadeInicial: item.currentStock,
          estoqueMinimo: item.minimumStock,
          precoMedio: item.averagePrice,
          dataValidade: item.expirationDate ?? null,
          diasAvisoValidade: item.expirationWarningDays ?? null,
          imagemUrl: null,
        })

        setFeedbackMessage('Item created successfully.')
      }

      setEditingItem(null)
      setIsItemModalOpen(false)
      setSearch('')
      setStatus('ALL')
      setPage(1)
      setRefreshVersion((value) => value + 1)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleConfirmDelete() {
    if (!itemToDelete) {
      return
    }

    setErrorMessage(null)
    setFeedbackMessage(null)

    try {
      await deactivateItem(itemToDelete.id)
      setFeedbackMessage('Item removed from the active list. Its history was preserved.')
      setItemToDelete(null)
      setPage(1)
      setRefreshVersion((value) => value + 1)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    }
  }

  const totalItems = totalElements

  const lowStockItems = items.filter(
    (item) => item.status === 'LOW_STOCK',
  ).length

  const outOfStockItems = items.filter(
    (item) => item.status === 'OUT_OF_STOCK',
  ).length

  const totalEstimatedValue = items.reduce(
    (total, item) => total + item.currentStock * item.averagePrice,
    0,
  )

  const columns: TableColumn<InventoryItem>[] = [
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
      header: 'Stock',
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
            Minimum: {item.minimumStock}
          </p>
        </div>
      ),
    },
    {
      key: 'value',
      header: 'Average value',
      align: 'right',
      render: (item) => (
        <span className="font-semibold text-slate-200">
          {formatCurrency(item.averagePrice)}
        </span>
      ),
    },
    {
      key: 'supplier',
      header: 'Supplier',
      render: (item) => (
        <div>
          <p className="font-medium text-slate-200">{item.supplierName}</p>
          <p className="mt-1 text-xs text-slate-500">{item.location}</p>
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
      key: 'updatedAt',
      header: 'Updated',
      render: (item) => (
        <span className="text-xs text-slate-400">
          {formatDateTime(item.updatedAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (item) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="secondary" onClick={() => openEditModal(item)}>
            <Edit3 size={15} />
            Edit
          </Button>

          <Button size="sm" variant="danger" onClick={() => setItemToDelete(item)}>
            <Trash2 size={15} />
            Delete
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory items"
        description="Create and edit items while tracking balances, suppliers, categories, and stock status in one place."
        actions={
          <>
            <Button variant="secondary" onClick={() => setIsCategoryModalOpen(true)}>
              <Tags size={17} />
              Categories
            </Button>

            <Button onClick={openCreateModal}>
              <Plus size={17} />
              New item
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
            Total items
          </p>

          <MetricValue isLoading={isLoading}>
            {totalItems}
          </MetricValue>
        </Card>

        <Card variant="metric">
          <p className="text-sm font-semibold text-nexus-navy">
            Low stock on this page
          </p>

          <MetricValue isLoading={isLoading}>
            {lowStockItems}
          </MetricValue>
        </Card>

        <Card variant="metric">
          <p className="text-sm font-semibold text-nexus-navy">
            Out of stock on this page
          </p>

          <MetricValue isLoading={isLoading}>
            {outOfStockItems}
          </MetricValue>
        </Card>

        <Card variant="metric">
          <p className="text-sm font-semibold text-nexus-navy">
            Value on this page
          </p>

          <MetricValue isLoading={isLoading} size="md">
                {formatCurrency(totalEstimatedValue)}
              </MetricValue>

          <p className="mt-2 text-sm text-nexus-muted">
            current stock of displayed items
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
            placeholder="Search by code, item, category, supplier, or location..."
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

          <Button
            variant="secondary"
            onClick={() => {
              setSearch('')
              setStatus('ALL')
              setPage(1)
            }}
          >
            Clear filters
          </Button>
        </div>
      </Card>

      <Table
        columns={columns}
        data={isLoading ? [] : items}
        emptyTitle={isLoading ? 'Loading items...' : 'No items found'}
        emptyDescription={
          isLoading
            ? 'Wait while the records are loaded.'
            : errorMessage || 'Try changing the search term or status filter.'
        }
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={totalElements}
        onPageChange={setPage}
      />

      {isItemModalOpen ? (
        <ItemFormModal
          key={editingItem?.id ?? 'new-item'}
          open
          onClose={closeItemModal}
          onSave={handleSaveItem}
          suppliers={suppliers}
          categories={categories}
          initialItem={editingItem}
          isSaving={isSaving}
        />
      ) : null}

      {isCategoryModalOpen ? (
        <CategoryManagerModal
          open
          onClose={() => setIsCategoryModalOpen(false)}
          onChanged={fetchOptions}
        />
      ) : null}

      <ConfirmModal
        open={Boolean(itemToDelete)}
        title="Delete item"
        description="Confirm removal of the item from the active list."
        confirmLabel="Delete item"
        danger
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
      >
        {itemToDelete
          ? `"${itemToDelete.name}" will be removed from the active list. Movements, requests, and history will be preserved.`
          : undefined}
      </ConfirmModal>
    </div>
  )
}
