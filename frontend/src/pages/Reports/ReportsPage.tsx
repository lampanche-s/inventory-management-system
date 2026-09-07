import {
  useEffect,
  useMemo,
  useRef,
  useState } from 'react'
import axios from 'axios'
import {
  CalendarDays,
  ClipboardCheck,
  Download,
  PackageSearch,
  Search,
  TrendingDown,
  } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  Modal,
  Pagination,
  SearchInput,
  Select,
  Table,
  type TableColumn,
  MetricValue,
  PageHeader,
} from '../../components/ui'
import type { ApiErrorResponse } from '../../services/apiClient'
import { getDashboard } from '../../services/dashboardApi'
import {
  listItens,
  mapItemApiToInventoryItem,
} from '../../services/itensApi'
import {
  listMovimentacoes,
  mapMovimentacaoToInventoryMovement,
} from '../../services/movimentacoesApi'
import {
  listSolicitacoes,
  mapSolicitacaoToStockRequest,
} from '../../services/solicitacoesApi'
import type {
  InventoryItem,
  ItemStatus,
} from '../../types/domain'
import { formatCurrency } from '../../utils/formatters'
import { getExportDateSuffix } from '../../utils/exporters'
import { downloadInventoryReportXlsx } from '../../utils/excelReportExporter'
import {
  beginLatestRequest,
  isLatestRequest,
} from '../../utils/latestRequest'
import { fetchAllPages } from '../../utils/pagination'

type ReportItem = InventoryItem & {
  estimatedValue: number
}

type ExportPeriod = '7D' | '1M' | '3M' | '6M'

type ReportSummary = {
  totalItems: number
  totalEstimatedValue: number
  lowStockItems: number
  outOfStockItems: number
  totalMovements: number
  totalEntries: number
  totalOutputs: number
  totalRequests: number
  pendingRequests: number
  approvedRequests: number
  rejectedRequests: number
  canceledRequests: number
}

const REPORT_ITEMS_PER_PAGE = 10

const emptySummary: ReportSummary = {
  totalItems: 0,
  totalEstimatedValue: 0,
  lowStockItems: 0,
  outOfStockItems: 0,
  totalMovements: 0,
  totalEntries: 0,
  totalOutputs: 0,
  totalRequests: 0,
  pendingRequests: 0,
  approvedRequests: 0,
  rejectedRequests: 0,
  canceledRequests: 0,
}

const statusOptions = [
  { label: 'All statuses', value: 'ALL' },
  { label: 'Normal', value: 'NORMAL' },
  { label: 'Low stock', value: 'LOW_STOCK' },
  { label: 'Out of stock', value: 'OUT_OF_STOCK' },
]

const exportPeriodOptions = [
  { label: 'Last week', value: '7D' },
  { label: 'Last month', value: '1M' },
  { label: 'Last 3 months', value: '3M' },
  { label: 'Last 6 months', value: '6M' },
]

function getStatusBadge(status: InventoryItem['status']) {
  if (status === 'NORMAL') {
    return <Badge variant="success">Normal</Badge>
  }

  if (status === 'LOW_STOCK') {
    return <Badge variant="warning">Low stock</Badge>
  }

  return <Badge variant="danger">Out of stock</Badge>
}

function getPeriodStartDate(period: ExportPeriod) {
  const date = new Date()

  if (period === '7D') {
    date.setDate(date.getDate() - 7)
    return date
  }

  if (period === '1M') {
    date.setMonth(date.getMonth() - 1)
    return date
  }

  if (period === '3M') {
    date.setMonth(date.getMonth() - 3)
    return date
  }

  date.setMonth(date.getMonth() - 6)
  return date
}

function getPeriodLabel(period: ExportPeriod) {
  if (period === '7D') {
    return 'Last week'
  }

  if (period === '1M') {
    return 'Last month'
  }

  if (period === '3M') {
    return 'Last 3 months'
  }

  return 'Last 6 months'
}

function isDateInsidePeriod(dateValue: string | undefined, startDate: Date) {
  if (!dateValue) {
    return false
  }

  const date = new Date(dateValue)

  if (Number.isNaN(date.getTime())) {
    return false
  }

  return date >= startDate
}

function formatDateOnlyForApi(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
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
    'Could not load reports.'
  )
}

export function ReportsPage() {
  const [items, setItems] = useState<ReportItem[]>([])
  const [summary, setSummary] = useState<ReportSummary>(emptySummary)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<ItemStatus | 'ALL'>('ALL')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [exportPeriod, setExportPeriod] = useState<ExportPeriod>('1M')
  const [isExporting, setIsExporting] = useState(false)

  const reportsRequestSequenceRef = useRef(0)

  async function fetchReportsData(
    nextPage = page,
    nextSearch = search,
    nextStatus = status,
  ) {
    const requestSequence = beginLatestRequest(reportsRequestSequenceRef)

    setIsLoading(true)
    setErrorMessage('')

    try {
      const [
        dashboardResponse,
        filteredItemsResponse,
        movementsResponse,
        entriesResponse,
        outputsResponse,
        requestsResponse,
        pendingResponse,
        approvedResponse,
        rejectedResponse,
        canceledResponse,
      ] = await Promise.all([
        getDashboard(),
        listItens({
          page: nextPage,
          size: REPORT_ITEMS_PER_PAGE,
          search: nextSearch,
          status: nextStatus,
          active: true,
        }),
        listMovimentacoes({
          page: 1,
          size: 1,
          type: 'ALL',
        }),
        listMovimentacoes({
          page: 1,
          size: 1,
          type: 'IN',
        }),
        listMovimentacoes({
          page: 1,
          size: 1,
          type: 'OUT',
        }),
        listSolicitacoes({
          page: 1,
          size: 1,
          status: 'ALL',
        }),
        listSolicitacoes({
          page: 1,
          size: 1,
          status: 'PENDING',
        }),
        listSolicitacoes({
          page: 1,
          size: 1,
          status: 'APPROVED',
        }),
        listSolicitacoes({
          page: 1,
          size: 1,
          status: 'REJECTED',
        }),
        listSolicitacoes({
          page: 1,
          size: 1,
          status: 'CANCELED',
        }),
      ])

      const mappedItems = filteredItemsResponse.content
        .map(mapItemApiToInventoryItem)
        .map((item) => ({
          ...item,
          estimatedValue: item.currentStock * item.averagePrice,
        }))

      if (!isLatestRequest(reportsRequestSequenceRef, requestSequence)) {
        return
      }

      setItems(mappedItems)
      setTotalElements(filteredItemsResponse.totalElements)
      setTotalPages(Math.max(filteredItemsResponse.totalPages, 1))

      setSummary({
        totalItems: Number(dashboardResponse.resumo?.totalItens ?? 0),
        totalEstimatedValue: Number(dashboardResponse.resumo?.valorTotalEstoque ?? 0),
        lowStockItems: Number(dashboardResponse.resumo?.itensAbaixoMinimo ?? 0),
        outOfStockItems: Number(dashboardResponse.resumo?.itensZerados ?? 0),
        totalMovements: Number(movementsResponse.totalElements ?? 0),
        totalEntries: Number(entriesResponse.totalElements ?? 0),
        totalOutputs: Number(outputsResponse.totalElements ?? 0),
        totalRequests: Number(requestsResponse.totalElements ?? 0),
        pendingRequests: Number(pendingResponse.totalElements ?? 0),
        approvedRequests: Number(approvedResponse.totalElements ?? 0),
        rejectedRequests: Number(rejectedResponse.totalElements ?? 0),
        canceledRequests: Number(canceledResponse.totalElements ?? 0),
      })
    } catch (error) {
      if (!isLatestRequest(reportsRequestSequenceRef, requestSequence)) {
        return
      }

      setErrorMessage(getApiErrorMessage(error))
      setItems([])
      setSummary(emptySummary)
      setTotalElements(0)
      setTotalPages(1)
    } finally {
      if (isLatestRequest(reportsRequestSequenceRef, requestSequence)) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => fetchReportsData())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, status])

  function clearFilters() {
    setSearch('')
    setStatus('ALL')
    setPage(1)
  }

  async function exportReport() {
    setIsExporting(true)
    setErrorMessage('')

    try {
      const periodStartDate = getPeriodStartDate(exportPeriod)
      const today = new Date()

      const [movementRecords, requestRecords] = await Promise.all([
        fetchAllPages((pageNumber, pageSize) =>
          listMovimentacoes({
            page: pageNumber,
            size: pageSize,
            type: 'ALL',
            dataInicio: formatDateOnlyForApi(periodStartDate),
            dataFim: formatDateOnlyForApi(today),
          }),
        ),
        fetchAllPages((pageNumber, pageSize) =>
          listSolicitacoes({
            page: pageNumber,
            size: pageSize,
            status: 'ALL',
          }),
        ),
      ])

      const periodMovements = movementRecords
        .map(mapMovimentacaoToInventoryMovement)
        .filter((movement) => isDateInsidePeriod(movement.createdAt, periodStartDate))

      const periodRequests = requestRecords
        .map(mapSolicitacaoToStockRequest)
        .filter((request) =>
          isDateInsidePeriod(request.createdAt, periodStartDate) ||
          isDateInsidePeriod(request.decidedAt, periodStartDate),
        )

      const periodLabel = getPeriodLabel(exportPeriod)

      await downloadInventoryReportXlsx({
        filename:
          'inventory-report-' +
          exportPeriod.toLowerCase() +
          '-' +
          getExportDateSuffix() +
          '.xlsx',
        periodLabel,
        summary,
        items,
        periodMovements,
        periodRequests,
      })

      setIsExportModalOpen(false)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsExporting(false)
    }
  }

  const columns: TableColumn<ReportItem>[] = useMemo(
    () => [
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
            <p className="font-display text-lg font-bold text-white">
              {item.currentStock}
              <span className="ml-1 text-xs font-semibold text-slate-500">
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
        key: 'value',
        header: 'Estimated value',
        align: 'right',
        render: (item) => (
          <span className="font-semibold text-slate-200">
            {formatCurrency(item.estimatedValue)}
          </span>
        ),
      },
      {
        key: 'supplier',
        header: 'Supplier',
        render: (item) => (
          <div>
            <p className="text-sm font-medium text-slate-300">
              {item.supplierName}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {item.location}
            </p>
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        align: 'center',
        render: (item) => getStatusBadge(item.status),
      },
    ],
    [],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventory reports"
        description="Review general metrics, critical items, estimated inventory value, movements, and recent requests."
        actions={
          <Button variant="secondary" onClick={() => setIsExportModalOpen(true)}>
            <Download size={17} />
            Export report
          </Button>
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
          <p className="text-sm font-semibold text-nexus-navy">
            Estimated value
          </p>

          <MetricValue isLoading={isLoading} size="md">
            {formatCurrency(summary.totalEstimatedValue)}
          </MetricValue>
        </Card>

        <Card variant="metric">
          <p className="text-sm font-semibold text-nexus-navy">
            Critical items
          </p>

          <MetricValue isLoading={isLoading}>
            {summary.lowStockItems + summary.outOfStockItems}
          </MetricValue>

          <p className="mt-3 text-sm text-nexus-muted">
            {summary.lowStockItems} low · {summary.outOfStockItems} out of stock
          </p>
        </Card>

        <Card variant="metric">
          <p className="text-sm font-semibold text-nexus-navy">
            Movements
          </p>

          <MetricValue isLoading={isLoading}>
            {summary.totalMovements}
          </MetricValue>

          <p className="mt-3 text-sm text-nexus-muted">
            {summary.totalEntries} receipts · {summary.totalOutputs} issues
          </p>
        </Card>

        <Card variant="metric">
          <p className="text-sm font-semibold text-nexus-navy">
            Requests
          </p>

          <MetricValue isLoading={isLoading}>
            {summary.totalRequests}
          </MetricValue>

          <p className="mt-3 text-sm text-nexus-muted">
            {summary.pendingRequests} pending · {summary.approvedRequests} approved
          </p>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="min-w-0">
          <div className="mb-5">
            <h2 className="font-display text-2xl font-bold text-nexus-navy">
              Items by status
            </h2>

            <p className="mt-1 text-sm text-nexus-muted">
              {isLoading ? 'Loading...' : `${totalElements} item(s)`}
            </p>

            <p className="mt-2 text-sm leading-6 text-nexus-muted">
              Use the filters to build a focused view and export the displayed data.
            </p>
          </div>

          <div className="mb-5 grid gap-4 xl:grid-cols-[1fr_220px_auto] xl:items-end">
            <SearchInput
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              placeholder="Search by code, item, supplier, category, or location..."
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

          <Table
            columns={columns}
            data={isLoading ? [] : items}
            emptyTitle={isLoading ? 'Loading items...' : 'No items found'}
            emptyDescription={
              isLoading
                ? 'Wait while the records are loaded.'
                : 'Change the filters to view other items.'
            }
          />

          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={totalElements}
            onPageChange={setPage}
          />
        </Card>

        <Card>
          <div className="mb-5">
            <h2 className="font-display text-2xl font-bold text-nexus-navy">
              Current status
            </h2>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-nexus-border bg-white/[0.035] p-5">
              <div className="flex items-center gap-3">
                <PackageSearch size={20} className="text-blue-300" />

                <p className="font-semibold text-white">
                  Total registered items
                </p>
              </div>

              <p className="mt-3 font-display text-3xl font-bold text-white">
                {summary.totalItems}
              </p>
            </div>

            <div className="rounded-3xl border border-nexus-border bg-white/[0.035] p-5">
              <div className="flex items-center gap-3">
                <TrendingDown size={20} className="text-red-300" />

                <p className="font-semibold text-white">
                  Attention required
                </p>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                {summary.lowStockItems + summary.outOfStockItems} item(s) require attention
                because they are below minimum stock or out of stock.
              </p>
            </div>

            <div className="rounded-3xl border border-nexus-border bg-white/[0.035] p-5">
              <div className="flex items-center gap-3">
                <ClipboardCheck size={20} className="text-indigo-300" />

                <p className="font-semibold text-white">
                  Requests
                </p>
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-500">
                {summary.pendingRequests} pending, {summary.approvedRequests} approved,
                {summary.rejectedRequests} rejected, and {summary.canceledRequests} canceled.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Modal
        open={isExportModalOpen}
        title="Export report"
        description="Choose the movement and request period to include in the Excel file."
        onClose={() => {
          if (!isExporting) {
            setIsExportModalOpen(false)
          }
        }}
        footer={
          <>
            <Button
              variant="secondary"
              disabled={isExporting}
              onClick={() => setIsExportModalOpen(false)}
            >
              Cancel
            </Button>

            <Button disabled={isExporting} onClick={exportReport}>
              {isExporting ? 'Exporting...' : 'Export Excel'}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="rounded-3xl border border-nexus-border bg-white/[0.035] p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-300">
                <CalendarDays size={20} />
              </div>

              <div>
                <p className="font-semibold text-white">
                  Report period
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Displayed items represent the current view. Movements and requests are limited to the selected period.
                </p>
              </div>
            </div>
          </div>

          <Select
            label="Range"
            value={exportPeriod}
            onChange={(event) => setExportPeriod(event.target.value as ExportPeriod)}
            options={exportPeriodOptions}
          />
        </div>
      </Modal>
    </div>
  )
}
