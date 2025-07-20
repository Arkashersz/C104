import { ReactNode } from 'react'

interface LoadingProps {
  children?: ReactNode
  className?: string
}

export function Loading({ children, className = "h-8 w-8" }: LoadingProps) {
  return (
    <div className={`animate-spin rounded-full border-t-2 border-b-2 border-primary ${className}`}>
      {children}
    </div>
  )
}

export function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-background">
      <div className="animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-primary"></div>
    </div>
  )
}