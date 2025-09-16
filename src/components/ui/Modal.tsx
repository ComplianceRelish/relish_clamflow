// src/components/ui/Modal.tsx - Full Implementation
import * as React from 'react'
import { Dialog } from '@headlessui/react'

interface ModalProps extends React.HTMLAttributes<HTMLDivElement> {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  showCloseButton?: boolean
}

const Modal = React.forwardRef<HTMLDivElement, ModalProps>(
  ({ isOpen, onClose, title, children, showCloseButton = true, className, ...props }, ref) => {
    return (
      <Dialog open={isOpen} onClose={onClose} className="relative z-50">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        {/* Centered panel */}
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel
            ref={ref}
            className={`w-full max-w-lg rounded-lg bg-white shadow-xl transform transition-all ${className || ''}`}
            {...props}
          >
            {/* Header */}
            {(title || showCloseButton) && (
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 rounded-t-lg">
                {title && (
                  <Dialog.Title className="text-lg font-semibold text-gray-900">
                    {title}
                  </Dialog.Title>
                )}
                {showCloseButton && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-6 w-6"
                    >
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                  </button>
                )}
              </div>
            )}

            {/* Body */}
            <div className="p-6">{children}</div>
          </Dialog.Panel>
        </div>
      </Dialog>
    )
  }
)

Modal.displayName = 'Modal'
export { Modal }