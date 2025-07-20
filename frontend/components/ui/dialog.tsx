// components/ui/dialog.tsx
import { ReactNode, useEffect } from 'react'

interface DialogProps {
  children: ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function Dialog({ children, open, onOpenChange }: DialogProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={() => onOpenChange?.(false)}
      />
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-2xl">
        {children}
      </div>
    </div>
  )
}
