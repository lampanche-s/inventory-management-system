import { useState } from 'react'
import type { FormEvent } from 'react'
import { Button, Modal, Textarea } from '../../components/ui'
import type { StockRequest } from '../../types/domain'

type DecisionAction = 'APPROVE' | 'REJECT'

type RequestDecisionModalProps = {
  open: boolean
  action: DecisionAction
  request: StockRequest | null
  onClose: () => void
  onConfirm: (decisionNote: string) => void
}

export function RequestDecisionModal({
  open,
  action,
  request,
  onClose,
  onConfirm,
}: RequestDecisionModalProps) {
  const [decisionNote, setDecisionNote] = useState('')

  if (!request) {
    return null
  }

  const isApproval = action === 'APPROVE'

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onConfirm(decisionNote)
  }

  return (
    <Modal
      open={open}
      title={isApproval ? 'Approve request' : 'Reject request'}
      description={
        isApproval
          ? 'Confirm approval of this request. A decision note is optional.'
          : 'Confirm rejection of this request. A decision note is optional.'
      }
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>

          <Button
            type="submit"
            form="request-decision-form"
            variant={isApproval ? 'primary' : 'danger'}
          >
            {isApproval ? 'Approve' : 'Reject'}
          </Button>
        </>
      }
    >
      <form id="request-decision-form" onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-3xl border border-nexus-border bg-white/[0.035] p-5">
          <p className="font-semibold text-white">
            {request.itemName}
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Requested quantity: {request.quantity}
          </p>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Requester: {request.requesterName}
          </p>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            Stated reason: {request.requestReason || 'no note recorded'}
          </p>
        </div>

        <Textarea
          label="Decision note"
          value={decisionNote}
          onChange={(event) => setDecisionNote(event.target.value)}
          placeholder={
            isApproval
              ? 'Optional: add a note about the approval...'
              : 'Optional: explain the rejection...'
          }
          maxLength={500}
          helperText={`This field is optional and will be recorded with the request. ${decisionNote.length}/500 characters.`}
        />
      </form>
    </Modal>
  )
}
