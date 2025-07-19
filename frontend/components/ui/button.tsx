// components/ui/button.tsx
import * as React from "react"
import { cn } from "@/lib/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        className={cn(
          // Base styles
          'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
          // Hover effects
          'hover:transform hover:-translate-y-0.5 hover:shadow-lg active:transform active:translate-y-0',
          // Variants
          {
            'bg-primary-medium text-white hover:bg-primary-dark focus:ring-primary-medium shadow-md':
              variant === 'primary',
            'bg-accent-light text-primary-dark hover:bg-accent-dark focus:ring-accent-dark shadow-md':
              variant === 'secondary',
            'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 shadow-md':
              variant === 'danger',
            'bg-transparent text-text-secondary hover:bg-gray-100 focus:ring-gray-300 border border-gray-200 hover:border-gray-300':
              variant === 'ghost',
          },
          // Sizes
          {
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-4 py-2.5 text-base': size === 'md',
            'px-6 py-3 text-lg': size === 'lg',
          },
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button }