import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import axios from 'axios'
import {
  AlertTriangle,
  CheckCircle2,
  Plus,
  Search,
  XCircle,
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
  approveSolicitacao,
  cancelSolicitacao,
  createSolicitacoesLote,
  listMinhasSolicitacoes,
  listSolicitacoes,
  mapSolicitacaoToStockRequest,
  rejectSolicitacao,
} from '../../services/solicitacoesApi'
import {
  listItens,
  mapItemApiToInventoryItem,
} from '../../services/itensApi'
import {
  canCreateRequest,
  canManageRequests,
  useAuthStore,
} from '../../store/authStore'
import type {
  InventoryItem,
  RequestStatus,
  StockRequest,
} from '../../types/domain'
import { formatDateTime } from '../../utils/formatters'
import {
  beginLatestRequest,
  invalidateLatestRequest,
  isLatestRequest,
} from '../../utils/latestRequest'
import { RequestDecisionModal } from './RequestDecisionModal'
import { RequestFormModal } from './RequestFormModal'
import type { RequestFormSubmitData } from './RequestFormModal'

type DecisionTarget = {
  action: 'APPROVE' | 'REJECT'
  request: StockRequest
}

const REQUESTS_PER_PAGE = 10
const REQUEST_ITEM_SEARCH_SIZE = 15

const statusOptions = [
  { label: 'All statuses', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
  { label: 'Canceled', value: 'CANCELED' },
]

function getRequestStatusBadge(status: RequestStatus) {
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

export function RequestsPage() {
  const currentRole = useAuthStore((state) => state.currentRole)
  const currentUser = useAuthStore((state) => state.currentUser)

  const userCanCreateRequest = canCreateRequest(currentRole)
  const userCanManageRequests = canManageRequests(currentRole)

  const [items, setItems] = useState<InventoryItem[]>([])
  const [requests, setRequests] = useState<StockRequest[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<RequestStatus | 'ALL'>('ALL')
  const [page, setPage] = useState(1)
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingItems, setIsLoadingItems] = useState(true)
  const [isSavingRequest, setIsSavingRequest] = useState(false)
  const [isDeciding, setIsDeciding] = useState(false)
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false)
  const [actionError, setActionError] = useState('')
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [decisionTarget, setDecisionTarget] = useState<DecisionTarget | null>(null)
  const [requestItemOptions, setRequestItemOptions] = useState<InventoryItem[]>([])
  const [isSearchingRequestItems, setIsSearchingRequestItems] = useState(false)
  const [requestItemSearchError, setRequestItemSearchError] = useState('')

  const requestItemSearchSequenceRef = useRef(0)
  const requestsRequestSequenceRef = useRef(0)
  const itemsRequestSequenceRef = useRef(0)

  async function fetchRequests(
    nextPage = page,
    nextSearch = search,
    nextStatus = status,
  ) {
    const requestSequence = beginLatestRequest(requestsRequestSequenceRef)

    setIsLoading(true)
    setActionError('')

    try {
      const requestParams = {
        page: nextPage,
        size: REQUESTS_PER_PAGE,
        search: nextSearch,
        status: nextStatus,
      }

      const response = userCanManageRequests
        ? await listSolicitacoes(requestParams)
        : await listMinhasSolicitacoes(requestParams)

      if (!isLatestRequest(requestsRequestSequenceRef, requestSequence)) {
        return
      }

      setRequests(response.content.map(mapSolicitacaoToStockRequest))
      setTotalElements(response.totalElements)
      setTotalPages(Math.max(response.totalPages, 1))
    } catch (error) {
      if (!isLatestRequest(requestsRequestSequenceRef, requestSequence)) {
        return
      }

      setActionError(getApiErrorMessage(error))
      setRequests([])
      setTotalElements(0)
      setTotalPages(1)
    } finally {
      if (isLatestRequest(requestsRequestSequenceRef, requestSequence)) {
        setIsLoading(false)
      }
    }
  }

  async function fetchItems() {
    const requestSequence = beginLatestRequest(itemsRequestSequenceRef)

    setIsLoadingItems(true)

    try {
      const firstPage = await listItens({
        page: 1,
        size: 100,
        status: 'ALL',
        active: true,
      })

      const allItems = [...firstPage.content]

      if (firstPage.totalPages > 1) {
        const remainingPages = await Promise.all(
          Array.from(
            { length: firstPage.totalPages - 1 },
            (_, index) =>
              listItens({
                page: index + 2,
                size: 100,
                status: 'ALL',
                active: true,
              }),
          ),
        )

        remainingPages.forEach((response) => {
          allItems.push(...response.content)
        })
      }

      if (!isLatestRequest(itemsRequestSequenceRef, requestSequence)) {
        return
      }

      setItems(allItems.map(mapItemApiToInventoryItem))
    } catch (error) {
      if (!isLatestRequest(itemsRequestSequenceRef, requestSequence)) {
        return
      }

      setActionError(getApiErrorMessage(error))
      setItems([])
    } finally {
      if (isLatestRequest(itemsRequestSequenceRef, requestSequence)) {
        setIsLoadingItems(false)
      }
    }
  }

  const resetRequestItemSearch = useCallback(() => {
    requestItemSearchSequenceRef.current += 1
    setRequestItemOptions([])
    setRequestItemSearchError('')
    setIsSearchingRequestItems(false)
  }, [])

  const handleRequestItemSearch = useCallback(async (term: string) => {
    const searchTerm = term.trim()
    const searchSequence = requestItemSearchSequenceRef.current + 1

    requestItemSearchSequenceRef.current = searchSequence
    setRequestItemSearchError('')

    if (searchTerm.length < 2) {
      setRequestItemOptions([])
      setIsSearchingRequestItems(false)
      return
    }

    setIsSearchingRequestItems(true)

    try {
      const response = await listItens({
        page: 1,
        size: REQUEST_ITEM_SEARCH_SIZE,
        search: searchTerm,
        status: 'ALL',
        active: true,
      })

      if (requestItemSearchSequenceRef.current !== searchSequence) {
        return
      }

      setRequestItemOptions(response.content.map(mapItemApiToInventoryItem))
    } catch (error) {
      if (requestItemSearchSequenceRef.current !== searchSequence) {
        return
      }

      setRequestItemOptions([])
      setRequestItemSearchError(getApiErrorMessage(error))
    } finally {
      if (requestItemSearchSequenceRef.current === searchSequence) {
        setIsSearchingRequestItems(false)
      }
    }
  }, [])

  function openRequestModal() {
    setActionError('')
    setFeedbackMessage('')
    resetRequestItemSearch()
    setIsRequestModalOpen(true)
  }

  function closeRequestModal() {
    if (isSavingRequest) {
      return
    }

    setIsRequestModalOpen(false)
    resetRequestItemSearch()
  }

  useEffect(() => {
    void Promise.resolve().then(() => fetchRequests())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, status, userCanManageRequests, refreshVersion])

  useEffect(() => {
    if (userCanManageRequests) {
      void Promise.resolve().then(() => fetchItems())
      return
    }

    invalidateLatestRequest(itemsRequestSequenceRef)
    const clearSequence = itemsRequestSequenceRef.current

    void Promise.resolve().then(() => {
      if (!isLatestRequest(itemsRequestSequenceRef, clearSequence)) {
        return
      }

      setItems([])
      setIsLoadingItems(false)
    })
  }, [userCanManageRequests, refreshVersion])


  function canApproveByStock(request: StockRequest) {
    const item = items.find((currentItem) => currentItem.code === request.itemCode)

    if (!item) {
      return false
    }

    return item.currentStock >= request.quantity
  }

  function openDecisionModal(action: DecisionTarget['action'], request: StockRequest) {
    if (action === 'APPROVE' && !canApproveByStock(request)) {
      const item = items.find((currentItem) => currentItem.code === request.itemCode)

      setActionError(
        `Could not approve "${request.itemName}". Current balance: ${item?.currentStock ?? 0}. Requested quantity: ${request.quantity}.`,
      )
      return
    }

    setActionError('')
    setFeedbackMessage('')
    setDecisionTarget({ action, request })
  }

  async function handleCreateRequest(request: RequestFormSubmitData) {
    if (!userCanCreateRequest && !userCanManageRequests) {
      return
    }

    setIsSavingRequest(true)
    setActionError('')
    setFeedbackMessage('')

    try {
      const response = await createSolicitacoesLote({
        itens: request.itens.map((item) => ({
          itemId: Number(item.itemId),
          quantidade: item.quantity,
        })),
        tipo: 'SAIDA',
        motivo: request.motivo,
        observacao: request.observacao,
      })

      setIsRequestModalOpen(false)
      resetRequestItemSearch()
      setFeedbackMessage(
        response.totalItens === 1
          ? 'Request created with 1 item.'
          : `Request created with ${response.totalItens} items.`,
      )
      setSearch('')
      setStatus('ALL')
      setPage(1)
      setRefreshVersion((value) => value + 1)
    } catch (error) {
      setActionError(getApiErrorMessage(error))
    } finally {
      setIsSavingRequest(false)
    }
  }

  async function handleCancelRequest(request: StockRequest) {
    if (request.status !== 'PENDING') {
      return
    }

    setActionError('')
    setFeedbackMessage('')

    try {
      await cancelSolicitacao(request.id)
      setFeedbackMessage('Request canceled successfully.')
      setRefreshVersion((value) => value + 1)
    } catch (error) {
      setActionError(getApiErrorMessage(error))
    }
  }
  async function handleConfirmDecision(decisionNote: string) {
    if (!decisionTarget || !userCanManageRequests) {
      return
    }

    const { action, request } = decisionTarget

    setIsDeciding(true)
    setActionError('')
    setFeedbackMessage('')

    try {
      if (action === 'APPROVE') {
        await approveSolicitacao(request.id, {
          justificativa: decisionNote.trim() || null,
        })

        setFeedbackMessage('Request approved successfully.')
      } else {
        await rejectSolicitacao(request.id, {
          justificativa: decisionNote.trim() || null,
        })

        setFeedbackMessage('Request rejected successfully.')
      }

      setDecisionTarget(null)
      setRefreshVersion((value) => value + 1)
    } catch (error) {
      setActionError(getApiErrorMessage(error))
    } finally {
      setIsDeciding(false)
    }
  }

  function clearFilters() {
    setSearch('')
    setStatus('ALL')
    setActionError('')
    setFeedbackMessage('')
    setPage(1)
  }

  const pendingRequests = requests.filter(
    (request) => request.status === 'PENDING',
  ).length

  const approvedRequests = requests.filter(
    (request) => request.status === 'APPROVED',
  ).length

  const rejectedRequests = requests.filter(
    (request) => request.status === 'REJECTED',
  ).length

  const canceledRequests = requests.filter(
    (request) => request.status === 'CANCELED',
  ).length

  const blockedRequests = userCanManageRequests
    ? requests.filter(
      (request) =>
        request.status === 'PENDING' &&
        items.some(
          (item) =>
            item.code === request.itemCode &&
            item.currentStock < request.quantity,
        ),
    ).length
    : 0

  const finalizedRequests = approvedRequests + rejectedRequests + canceledRequests

  const columns: TableColumn<StockRequest>[] = [
    {
      key: 'request',
      header: 'Request',
      render: (request) => (
        <div>
          <p className="font-semibold text-white">{request.itemName}</p>

          <p className="mt-1 text-xs text-slate-500">
            {request.itemCode} · requested by {request.requesterName}
          </p>

          {request.requestBatchCode && (
            <p className="mt-1 text-xs font-semibold text-blue-300">
              Batch {request.requestBatchCode}
              {request.requestBatchOrder ? ` · item ${request.requestBatchOrder}` : ''}
            </p>
          )}

          <p className="mt-2 max-w-xl text-xs leading-5 text-slate-400">
            Reason: {request.requestReason || 'no note recorded'}
          </p>

          {request.decisionNote && (
            <p className="mt-2 max-w-xl text-xs leading-5 text-slate-500">
              Decision note: {request.decisionNote}
            </p>
          )}

          {request.decidedByName && request.decidedAt && (
            <p className="mt-1 text-xs text-slate-600">
              Decided by {request.decidedByName} on {formatDateTime(request.decidedAt)}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'Qty.',
      align: 'right',
      render: (request) => (
        <div className="text-right">
          <span className="font-display text-lg font-bold text-white">
            {request.quantity}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (request) => getRequestStatusBadge(request.status),
    },
    {
      key: 'createdAt',
      header: 'Created at',
      render: (request) => (
        <span className="text-xs font-medium text-slate-400">
          {formatDateTime(request.createdAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (request) => {
        if (!userCanManageRequests) {
          if (request.status === 'PENDING') {
            return (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleCancelRequest(request)}
              >
                <XCircle size={15} />
                Cancel
              </Button>
            )
          }

          return (
            <span className="text-xs font-semibold tracking-normal text-slate-500">
              Closed
            </span>
          )
        }

        const isPending = request.status === 'PENDING'

        if (!isPending) {
          return (
            <span className="text-xs font-semibold tracking-normal text-slate-500">
              Closed
            </span>
          )
        }

        const hasEnoughStock = canApproveByStock(request)

        return (
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => openDecisionModal('REJECT', request)}
            >
              <XCircle size={15} />
              Reject
            </Button>

            <Button
              size="sm"
              disabled={!hasEnoughStock || isLoadingItems}
              onClick={() => openDecisionModal('APPROVE', request)}
              title={
                hasEnoughStock
                  ? 'Approve request'
                  : 'Insufficient balance to approve'
              }
            >
              <CheckCircle2 size={15} />
              Approve
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Requests"
        description={
          userCanManageRequests
            ? 'Review requests, check the stated reason, and record a note when approving or rejecting.'
            : 'Create withdrawal requests, explain the reason, and track your own requests.'
        }
        actions={
          userCanCreateRequest || userCanManageRequests ? (
            <Button onClick={openRequestModal}>
              <Plus size={17} />
              New request
            </Button>
          ) : null
        }
      />

      {(actionError || feedbackMessage) && (
        <Card
          variant="soft"
          className={actionError ? 'border-red-400/20 bg-red-500/10' : undefined}
        >
          {actionError && (
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-500/15 text-red-300">
                <AlertTriangle size={21} />
              </div>

              <div>
                <p className="font-semibold text-red-200">
                  Action blocked
                </p>

                <p className="mt-2 text-sm leading-6 text-red-200/80">
                  {actionError}
                </p>
              </div>
            </div>
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
            Total requests
          </p>

          <MetricValue isLoading={isLoading}>
            {totalElements}
          </MetricValue>
        </Card>

        <Card variant="metric">
          <p className="text-sm font-semibold text-nexus-navy">
            Pending on this page
          </p>

          <MetricValue isLoading={isLoading}>
            {pendingRequests}
          </MetricValue>
        </Card>

        <Card variant="metric">
          <p className="text-sm font-semibold text-nexus-navy">
            Approved on this page
          </p>

          <MetricValue isLoading={isLoading}>
                {approvedRequests}
              </MetricValue>

          <p className="mt-2 text-sm text-nexus-muted">
            create inventory issues
          </p>
        </Card>

        {userCanManageRequests ? (
          <Card variant="metric">
            <p className="text-sm font-semibold text-nexus-navy">
              Blocked by balance
            </p>

            <MetricValue isLoading={isLoading}>
              {blockedRequests}
            </MetricValue>

            <p className="mt-3 text-sm text-nexus-muted">
              {rejectedRequests} rejected · {canceledRequests} canceled
            </p>
          </Card>
        ) : (
          <Card variant="metric">
            <p className="text-sm font-semibold text-nexus-navy">
              Closed on this page
            </p>

            <MetricValue isLoading={isLoading}>
              {finalizedRequests}
            </MetricValue>

            <p className="mt-3 text-sm text-nexus-muted">
              {rejectedRequests} rejected · {canceledRequests} canceled
            </p>
          </Card>
        )}
      </div>

      <Card variant="soft">
        <div className="grid gap-4 xl:grid-cols-[1fr_240px_auto] xl:items-end">
          <SearchInput
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder="Search by item, code, requester, reason, or decision note..."
          />

          <Select
            aria-label="Filter by status"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as RequestStatus | 'ALL')
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
              Registered requests
            </h2>

            <p className="mt-1 text-sm text-nexus-muted">
              {isLoading ? 'Loading...' : `${totalElements} record(s)`}
            </p>
          </div>

          <p className="max-w-lg text-sm leading-6 text-slate-500">
            {userCanManageRequests
              ? 'Administrators and employees can review all requests and record decisions.'
              : 'You can see only the requests created by your own account.'}
          </p>
        </div>

        <Table
          columns={columns}
          data={isLoading ? [] : requests}
          emptyTitle={isLoading ? 'Loading requests...' : 'No requests found'}
          emptyDescription={
            isLoading
              ? 'Wait while the records are loaded.'
              : 'Create a request or change the current filters.'
          }
        />
      </Card>

      <Pagination
        page={page}
        totalPages={totalPages}
        totalItems={totalElements}
        onPageChange={setPage}
      />

      <RequestFormModal
        open={isRequestModalOpen}
        items={requestItemOptions}
        requesterName={currentUser?.name ?? 'Requester'}
        onClose={closeRequestModal}
        onSave={handleCreateRequest}
        isSaving={isSavingRequest}
        onItemSearch={handleRequestItemSearch}
        isSearchingItems={isSearchingRequestItems}
        itemSearchError={requestItemSearchError}
        isRequester={currentRole === 'SOLICITANTE'}
      />

      {decisionTarget ? (
        <RequestDecisionModal
          key={`${decisionTarget.action}-${decisionTarget.request.id}`}
          open
          action={decisionTarget.action}
          request={decisionTarget.request}
          onClose={() => {
            if (!isDeciding) {
              setDecisionTarget(null)
            }
          }}
          onConfirm={handleConfirmDecision}
        />
      ) : null}
    </div>
  )
}
