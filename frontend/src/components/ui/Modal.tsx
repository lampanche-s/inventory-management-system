import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { Button } from './Button'

type ModalProps = {
  open: boolean
  title: string
  description?: string
  children: ReactNode
  onClose: () => void
  footer?: ReactNode
}

export function Modal({
  open,
  title,
  description,
  children,
  onClose,
  footer,
}: ModalProps) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6 backdrop-blur-sm">
      <section className="animate-modal-pop flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-[#c7d5e8] bg-white shadow-[0_24px_70px_rgba(15,23,42,0.22)]">
        <header className="border-b border-[#d5e0ee] bg-white px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-nexus-navy">
                {title}
              </h2>

              {description && (
                <p className="mt-2 text-sm leading-6 text-nexus-muted">
                  {description}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#b7c8df] bg-[#f3f7fd] text-nexus-navy transition-colors hover:border-nexus-bright hover:bg-[#e8f1ff] hover:text-nexus-blue"
              aria-label="Close dialog"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="custom-scrollbar flex-1 overflow-y-auto bg-white px-6 py-6">
          {children}
        </div>

        {footer && (
          <footer className="flex flex-col-reverse gap-3 border-t border-[#d5e0ee] bg-[#f3f7fd] px-6 py-5 sm:flex-row sm:justify-end">
            {footer}
          </footer>
        )}

        {!footer && (
          <footer className="flex justify-end border-t border-[#d5e0ee] bg-[#f3f7fd] px-6 py-5">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </footer>
        )}
      </section>
    </div>
  )
}
