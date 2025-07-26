// components/ui/select.tsx
import { ReactNode, forwardRef, useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown } from 'lucide-react'

interface SelectProps {
  children: ReactNode
  value?: string
  onValueChange?: (value: string) => void
  className?: string
  placeholder?: string
  disabled?: boolean
}

interface SelectTriggerProps {
  children: ReactNode
  className?: string
}

interface SelectContentProps {
  children: ReactNode
  className?: string
}

interface SelectItemProps {
  children: ReactNode
  value: string
  className?: string
}

interface SelectValueProps {
  placeholder?: string
}

export const Select = forwardRef<HTMLDivElement, SelectProps>(
  ({ children, value, onValueChange, className, placeholder, disabled, ...props }, ref) => {
    const [isOpen, setIsOpen] = useState(false)
    const [selectedLabel, setSelectedLabel] = useState('')
    const selectRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }

      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleSelect = (newValue: string, label: string) => {
      onValueChange?.(newValue)
      setSelectedLabel(label)
      setIsOpen(false)
    }

    return (
      <div ref={selectRef} className={cn('relative', className)} {...props}>
        <div
          className={cn(
            'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            isOpen && 'ring-2 ring-ring ring-offset-2'
          )}
          onClick={() => !disabled && setIsOpen(!isOpen)}
        >
          <span className={cn(!selectedLabel && 'text-muted-foreground')}>
            {selectedLabel || placeholder}
          </span>
          <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
        </div>
        
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-background border border-input rounded-md shadow-lg max-h-60 overflow-auto">
            {children}
          </div>
        )}
      </div>
    )
  }
)

export const SelectTrigger = forwardRef<HTMLDivElement, SelectTriggerProps>(
  ({ children, className, ...props }, ref) => {
    return <div ref={ref} className={cn('', className)} {...props}>{children}</div>
  }
)

export const SelectContent = forwardRef<HTMLDivElement, SelectContentProps>(
  ({ children, className, ...props }, ref) => {
    return <div ref={ref} className={cn('', className)} {...props}>{children}</div>
  }
)

export const SelectItem = forwardRef<HTMLDivElement, SelectItemProps>(
  ({ children, value, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'relative flex w-full cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
          className
        )}
        onClick={() => {
          // This will be handled by the parent Select component
          const event = new CustomEvent('select-item', { detail: { value, label: children } })
          document.dispatchEvent(event)
        }}
        {...props}
      >
        {children}
      </div>
    )
  }
)

export const SelectValue = forwardRef<HTMLSpanElement, SelectValueProps>(
  ({ placeholder, ...props }, ref) => {
    return <span ref={ref} {...props}>{placeholder}</span>
  }
)

Select.displayName = 'Select'
SelectTrigger.displayName = 'SelectTrigger'
SelectContent.displayName = 'SelectContent'
SelectItem.displayName = 'SelectItem'
SelectValue.displayName = 'SelectValue'
