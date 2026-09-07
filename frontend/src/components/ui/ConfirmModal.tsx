import type { ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from './Button'
import { Modal } from './Modal'

type ConfirmModalProps = {
  open: boolean
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  children?: ReactNode
  onClose: () => void
  onConfirm: () => void
}

export function ConfirmModal({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  children,
  onClose,
  onConfirm,
}: ConfirmModalProps) {
  return (
    <Modal
      open={open}
      title={title}
      description={description}
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {cancelLabel}
          </Button>

          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4 rounded-lg border border-[#d5e0ee] bg-[#f8fbff] p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
          <AlertTriangle size={21} />
        </div>

        <div>
          <p className="font-bold text-nexus-navy">
            Attention
          </p>

          <p className="mt-2 text-sm leading-6 text-nexus-muted">
            {children ?? 'This action will be applied immediately to the current data.'}
          </p>
        </div>
      </div>
    </Modal>
  )
}
