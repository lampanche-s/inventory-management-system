import { useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { Plus, Tags, Trash2 } from 'lucide-react'
import {
  Button,
  Card,
  ConfirmModal,
  Input,
  Modal,
} from '../../components/ui'
import type { ApiErrorResponse } from '../../services/apiClient'
import {
  createCategoria,
  deleteCategoria,
  listCategorias,
  mapCategoriaToInventoryCategory,
} from '../../services/categoriasApi'
import type { InventoryCategory } from '../../types/domain'
import {
  beginLatestRequest,
  invalidateLatestRequest,
  isLatestRequest,
} from '../../utils/latestRequest'

type CategoryManagerModalProps = {
  open: boolean
  onClose: () => void
  onChanged?: () => Promise<void> | void
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

export function CategoryManagerModal({
  open,
  onClose,
  onChanged,
}: CategoryManagerModalProps) {
  const [categories, setCategories] = useState<InventoryCategory[]>([])
  const [newCategoryName, setNewCategoryName] = useState('')
  const [categoryToDelete, setCategoryToDelete] = useState<InventoryCategory | null>(null)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const categoriesRequestSequenceRef = useRef(0)

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => a.name.localeCompare(b.name))
  }, [categories])

  async function fetchCategories() {
    const requestSequence = beginLatestRequest(categoriesRequestSequenceRef)

    setIsLoading(true)
    setError('')

    try {
      const response = await listCategorias()

      if (!isLatestRequest(categoriesRequestSequenceRef, requestSequence)) {
        return
      }

      setCategories(response.map(mapCategoriaToInventoryCategory))
    } catch (requestError) {
      if (!isLatestRequest(categoriesRequestSequenceRef, requestSequence)) {
        return
      }

      setError(getApiErrorMessage(requestError))
      setCategories([])
    } finally {
      if (isLatestRequest(categoriesRequestSequenceRef, requestSequence)) {
        setIsLoading(false)
      }
    }
  }

  useEffect(() => {
    if (open) {
      void Promise.resolve().then(() => fetchCategories())
      return
    }

    invalidateLatestRequest(categoriesRequestSequenceRef)
  }, [open])

  async function handleAddCategory() {
    const normalizedName = newCategoryName.trim()

    if (!normalizedName) {
      setError('Enter a category name.')
      return
    }

    const alreadyExists = categories.some(
      (category) => category.name.toLowerCase() === normalizedName.toLowerCase(),
    )

    if (alreadyExists) {
      setError('A category with this name already exists.')
      return
    }

    setIsSaving(true)
    setError('')
    setFeedback('')

    try {
      await createCategoria({ nome: normalizedName })
      setNewCategoryName('')
      setFeedback('Category created successfully.')
      await fetchCategories()
      await onChanged?.()
    } catch (requestError) {
      setError(getApiErrorMessage(requestError))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleConfirmDeleteCategory() {
    if (!categoryToDelete) {
      return
    }

    setIsSaving(true)
    setError('')
    setFeedback('')

    try {
      await deleteCategoria(categoryToDelete.id)
      setCategoryToDelete(null)
      setFeedback('Category deleted successfully.')
      await fetchCategories()
      await onChanged?.()
    } catch (requestError) {
      setError(getApiErrorMessage(requestError))
    } finally {
      setIsSaving(false)
    }
  }

  function resetAndClose() {
    if (isSaving) {
      return
    }

    setNewCategoryName('')
    setCategoryToDelete(null)
    setError('')
    setFeedback('')
    onClose()
  }

  return (
    <>
      <Modal
        open={open}
        title="Manage categories"
        description="Add and remove inventory categories."
        onClose={resetAndClose}
        footer={
          <>
            <Button variant="secondary" onClick={resetAndClose} disabled={isSaving}>
              Close
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          {(error || feedback) && (
            <Card variant="soft">
              {error && (
                <p className="text-sm font-semibold text-red-300">
                  {error}
                </p>
              )}

              {feedback && (
                <p className="text-sm font-semibold text-green-300">
                  {feedback}
                </p>
              )}
            </Card>
          )}

          <Card variant="soft">
            <div className="mb-5">
              <h3 className="font-display text-xl font-bold text-nexus-navy">
                Add category
              </h3>

              <p className="mt-2 text-sm leading-6 text-nexus-muted">
                Categories help filter, organize, and analyze related items.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <Input
                label="Category name"
                value={newCategoryName}
                onChange={(event) => {
                  setNewCategoryName(event.target.value)
                  setError('')
                  setFeedback('')
                }}
                placeholder="Example: Tools"
                disabled={isSaving}
              />

              <Button onClick={handleAddCategory} disabled={isSaving}>
                <Plus size={17} />
                Add
              </Button>
            </div>
          </Card>

          <Card>
            <div className="mb-5">
              <h3 className="font-display text-xl font-bold text-nexus-navy">
                Registered categories
              </h3>

              <p className="mt-1 text-sm text-nexus-muted">
                {isLoading
                  ? 'Loading...'
                  : `${sortedCategories.length} ${sortedCategories.length === 1 ? 'category' : 'categories'}`}
              </p>

              <p className="mt-2 text-sm leading-6 text-nexus-muted">
                A category linked to items may require those items to be reorganized before deletion.
              </p>
            </div>

            <div className="space-y-3">
              {sortedCategories.map((category) => {
                const isDefaultCategory = ['Other', 'Uncategorized'].some(
                  (name) => name.toLowerCase() === category.name.toLowerCase(),
                )

                return (
                  <div
                    key={category.id}
                    className="flex items-center justify-between gap-4 rounded-3xl border border-nexus-border bg-white/[0.035] p-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-300">
                        <Tags size={18} />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-semibold text-white">
                          {category.name}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Registered category
                        </p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      variant="danger"
                      disabled={isDefaultCategory || isSaving}
                      onClick={() => setCategoryToDelete(category)}
                    >
                      <Trash2 size={15} />
                      Delete
                    </Button>
                  </div>
                )
              })}

              {!isLoading && sortedCategories.length === 0 && (
                <div className="rounded-3xl border border-nexus-border bg-white/[0.035] p-5 text-sm text-slate-500">
                  No categories found.
                </div>
              )}
            </div>
          </Card>
        </div>
      </Modal>

      <ConfirmModal
        open={Boolean(categoryToDelete)}
        title="Delete category"
        description="Confirm deletion of the selected category."
        confirmLabel={isSaving ? 'Deleting...' : 'Delete category'}
        danger
        onClose={() => {
          if (!isSaving) {
            setCategoryToDelete(null)
          }
        }}
        onConfirm={handleConfirmDeleteCategory}
      >
        {categoryToDelete
          ? `"${categoryToDelete.name}" will be removed if it has no linked items.`
          : undefined}
      </ConfirmModal>
    </>
  )
}
