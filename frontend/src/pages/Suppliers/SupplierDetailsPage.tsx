import { useEffect, useState } from 'react'
import axios from 'axios'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Edit3,
  FileText,
  Mail,
  MapPin,
  PackageSearch,
  Phone,
  Trash2,
} from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  ConfirmModal,
  PageHeader,
} from '../../components/ui'
import type { ApiErrorResponse } from '../../services/apiClient'
import {
  deleteFornecedor,
  getFornecedor,
  mapFornecedorToSupplier,
  mapSupplierToFornecedorPayload,
  updateFornecedor,
} from '../../services/fornecedoresApi'
import type { Supplier } from '../../types/domain'
import { SupplierFormModal } from './SupplierFormModal'
import type { SupplierFormSubmitData } from './SupplierFormModal'

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

export function SupplierDetailsPage() {
  const { supplierId } = useParams()
  const navigate = useNavigate()

  const [supplier, setSupplier] = useState<Supplier | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  async function fetchSupplier() {
    if (!supplierId) {
      setSupplier(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    setErrorMessage(null)

    try {
      const response = await getFornecedor(supplierId)
      setSupplier(mapFornecedorToSupplier(response))
    } catch (error) {
      setSupplier(null)
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void Promise.resolve().then(() => fetchSupplier())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supplierId])

  async function handleSaveSupplier(updatedSupplier: SupplierFormSubmitData) {
    if (!supplier) {
      return
    }

    setIsSaving(true)
    setErrorMessage(null)
    setFeedbackMessage(null)

    try {
      const response = await updateFornecedor(
        supplier.id,
        mapSupplierToFornecedorPayload(updatedSupplier),
      )

      setSupplier(mapFornecedorToSupplier(response))
      setFeedbackMessage('Supplier updated successfully.')
      setIsEditModalOpen(false)
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteSupplier() {
    if (!supplier) {
      return
    }

    setIsDeleting(true)
    setErrorMessage(null)
    setFeedbackMessage(null)

    try {
      await deleteFornecedor(supplier.id)
      setIsDeleteModalOpen(false)
      navigate('/suppliers')
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error))
    } finally {
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Loading supplier"
          description="Wait while the supplier details are loaded."
        />
      </div>
    )
  }

  if (!supplier) {
    return (
      <div className="space-y-6">
        <div>
          <Badge variant="danger">Supplier not found</Badge>

          <div className="mt-4">
            <PageHeader
              title="Record unavailable"
              description={errorMessage || 'The requested supplier does not exist or has been removed.'}
              actions={
                <Button onClick={() => navigate('/suppliers')}>
                  <ArrowLeft size={17} />
                  Back to suppliers
                </Button>
              }
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate('/suppliers')}>
              <ArrowLeft size={17} />
              Back
            </Button>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => setIsEditModalOpen(true)}>
              <Edit3 size={17} />
              Edit details
            </Button>

            <Button variant="danger" onClick={() => setIsDeleteModalOpen(true)}>
              <Trash2 size={17} />
              Delete supplier
            </Button>
          </div>
        </div>

        <div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-nexus-navy">
            {supplier.name}
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-nexus-muted">
            Supplier profile with registration, contact, and location details.
          </p>
        </div>
      </div>

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

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card>
          <h2 className="text-xl font-semibold text-nexus-navy">
            Contact and document details
          </h2>

          <div className="mt-5 space-y-4">
            <div className="flex min-w-0 items-start gap-3 rounded-xl border border-nexus-border bg-white p-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-nexus-border bg-white text-nexus-bright">
                <FileText size={18} />
              </div>

              <div className="min-w-0">
                <p className="font-semibold text-nexus-navy">
                  Document
                </p>

                <p className="mt-1 break-words text-sm leading-6 text-nexus-muted">
                  {supplier.document || 'Not specified'}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex min-w-0 items-start gap-3 rounded-xl border border-nexus-border bg-white p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-nexus-border bg-white text-nexus-bright">
                  <Phone size={18} />
                </div>

                <div className="min-w-0">
                  <p className="font-semibold text-nexus-navy">
                    Phone
                  </p>

                  <p className="mt-1 break-words text-sm leading-6 text-nexus-muted">
                    {supplier.phone || 'Not specified'}
                  </p>
                </div>
              </div>

              <div className="flex min-w-0 items-start gap-3 rounded-xl border border-nexus-border bg-white p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-nexus-border bg-white text-nexus-bright">
                  <Mail size={18} />
                </div>

                <div className="min-w-0">
                  <p className="font-semibold text-nexus-navy">
                    Email
                  </p>

                  <p className="mt-1 break-words text-sm leading-6 text-nexus-muted">
                    {supplier.email || 'Not specified'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-semibold text-nexus-navy">
            Location details
          </h2>

          <div className="mt-5 flex items-start gap-3 rounded-xl border border-nexus-border bg-white p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-nexus-border bg-white text-nexus-bright">
              <MapPin size={18} />
            </div>

            <div className="min-w-0">
              <p className="font-semibold text-nexus-navy">
                Address
              </p>

              <div className="mt-2 space-y-1 text-sm leading-6 text-nexus-muted">
                <p>{supplier.address || 'Not specified'}</p>

                {supplier.number && (
                  <p>
                    Additional details: {supplier.number}
                  </p>
                )}

                <p>
                  District: {supplier.neighborhood || 'Not specified'}
                </p>

                <p>
                  City / UF:{' '}
                  {supplier.city || 'Not specified'}
                  {supplier.state ? ` - ${supplier.state}` : ''}
                </p>

                <p>
                  Postal code (CEP): {supplier.cep || 'Not specified'}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="text-xl font-semibold text-nexus-navy">
          Linked items
        </h2>

        <div className="mt-5 flex min-h-40 flex-col items-center justify-center rounded-xl border border-nexus-border bg-nexus-panel-soft px-6 text-center">
          <PackageSearch size={24} className="text-nexus-muted" />

          <p className="mt-3 font-semibold text-nexus-navy">
            Linked items
          </p>

          <p className="mt-1 max-w-xl text-sm text-nexus-muted">
            Items linked to this supplier are managed through the item catalog.
          </p>
        </div>
      </Card>

      {isEditModalOpen ? (
        <SupplierFormModal
          key={supplier?.id ?? 'supplier'}
          open
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleSaveSupplier}
          initialSupplier={supplier}
          isSaving={isSaving}
        />
      ) : null}

      <ConfirmModal
        open={isDeleteModalOpen}
        title="Delete supplier"
        description="Confirm deletion of this supplier."
        confirmLabel={isDeleting ? 'Deleting...' : 'Delete supplier'}
        danger
        onClose={() => {
          if (!isDeleting) {
            setIsDeleteModalOpen(false)
          }
        }}
        onConfirm={handleDeleteSupplier}
      >
        Deleting "{supplier.name}" keeps linked items and reorganizes them automatically.
      </ConfirmModal>
    </div>
  )
}
