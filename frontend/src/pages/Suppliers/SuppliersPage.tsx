import {
  useEffect,
  useRef,
  useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import {
  Eye,
  Mail,
  MapPin,
  Phone,
  Plus,
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
  PageHeader,
} from '../../components/ui'
import type { ApiErrorResponse } from '../../services/apiClient'
import {
  createFornecedor,
  listFornecedores,
  mapFornecedorToSupplier,
  mapSupplierToFornecedorPayload,
} from '../../services/fornecedoresApi'
import type { Supplier } from '../../types/domain'
import {
  beginLatestRequest,
  isLatestRequest,
} from '../../utils/latestRequest'
import { SupplierFormModal } from './SupplierFormModal'
import type { SupplierFormSubmitData } from './SupplierFormModal'

const SUPPLIERS_PER_PAGE = 10

const statusOptions = [
  { label: 'All statuses', value: 'ALL' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' },
]

function getStatusBadge(status: Supplier['status']) {
  if (status === 'ACTIVE') {
    return <Badge variant="success">Active</Badge>
  }

  return <Badge variant="neutral">Inactive</Badge>
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

export function SuppliersPage() {
  const navigate = useNavigate()

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<Supplier['status'] | 'ALL'>('ALL')
  const [page, setPage] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false)

  const suppliersRequestSequenceRef = useRef(0)

  async function fetchSuppliers() {
    const requestSequence = beginLatestRequest(suppliersRequestSequenceRef)
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const response = await listFornecedores({
        page,
        size: SUPPLIERS_PER_PAGE,
        search,
        status,
      })

      if (!isLatestRequest(suppliersRequestSequenceRef, requestSequence)) {
        return
      }

      setSuppliers(response.content.map(mapFornecedorToSupplier))
      setTotalElements(response.totalElements)
      setTotalPages(Math.max(response.totalPages, 1))
    } catch (error) {
      if (!isLatestRequest(suppliersRequestSequenceRef, requestSequence)) {
        return
      }

      setErrorMessage(getApiErrorMessage(error))
      setSuppliers([])
      setTotalElements(0)
      setTotalPages(1)
    } finally {
      if (isLatestRequest(suppliersRequestSequenceRef, requestSequence)) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => fetchSuppliers())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, status])

  function clearFilters() {
    setSearch('')
    setStatus('ALL')
    setPage(1)
  }

  async function handleCreateSupplier(supplier: SupplierFormSubmitData) {
    setIsSaving(true)
    setErrorMessage(null)
    setFeedbackMessage(null)

    try {
      const created = await createFornecedor(
        mapSupplierToFornecedorPayload(supplier),
      )

      setIsSupplierModalOpen(false)
      setSearch('')
      setStatus('ALL')
      setPage(1)
      setFeedbackMessage('Supplier created successfully.')
      navigate(`/suppliers/${created.id}`)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  const columns: TableColumn<Supplier>[] = [
    {
      key: 'supplier',
      header: 'Supplier',
      render: (supplier) => (
        <button
          type="button"
          onClick={() => navigate(`/suppliers/${supplier.id}`)}
          className="text-left"
        >
          <p className="font-semibold text-white transition hover:text-nexus-bright">
            {supplier.name}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {supplier.document || 'Document not specified'}
          </p>
        </button>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (supplier) => (
        <div className="space-y-1">
          <p className="flex items-center gap-2 text-sm text-slate-300">
            <Phone size={14} className="text-slate-500" />
            {supplier.phone || 'No phone number'}
          </p>

          <p className="flex items-center gap-2 text-xs text-slate-500">
            <Mail size={13} />
            {supplier.email || 'No email'}
          </p>
        </div>
      ),
    },
    {
      key: 'city',
      header: 'Location',
      render: (supplier) => (
        <span className="flex items-center gap-2 text-sm font-medium text-slate-300">
          <MapPin size={15} className="text-slate-500" />
          {supplier.city || 'Not specified'}
          {supplier.state ? ` - ${supplier.state}` : ''}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (supplier) => getStatusBadge(supplier.status),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (supplier) => (
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => navigate(`/suppliers/${supplier.id}`)}
          >
            <Eye size={15} />
            View details
          </Button>
        </div>
      ),
    },
  ]


  return (
    <div className="space-y-6">
      <PageHeader
        title="Suppliers"
        description="Review suppliers, contact details, locations, and current status in one place."
        actions={
          <Button onClick={() => setIsSupplierModalOpen(true)}>
            <Plus size={17} />
            New supplier
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
        <div className="grid gap-4 xl:grid-cols-[1fr_240px_auto] xl:items-end">
          <SearchInput
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder="Search by name, document, phone, email, postal code, or city..."
          />

          <Select
            aria-label="Filter by status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as Supplier['status'] | 'ALL')
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
        columns={columns}
        data={isLoading ? [] : suppliers}
        emptyTitle={isLoading ? 'Loading suppliers...' : 'No suppliers found'}
        emptyDescription={
          isLoading
            ? 'Wait while the records are loaded.'
            : errorMessage || 'Create a supplier or change the current filters.'
        }
      />

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={totalElements}
        onPageChange={setPage}
      />

      {isSupplierModalOpen ? (
        <SupplierFormModal
          key="new-supplier"
          open
          onClose={() => setIsSupplierModalOpen(false)}
          onSave={handleCreateSupplier}
          isSaving={isSaving}
        />
      ) : null}
    </div>
  )
}
