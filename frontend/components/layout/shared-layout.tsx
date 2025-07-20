import { ReactNode } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { DemoNote } from '@/components/ui/demo-note'

interface SharedLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
  icon?: string
}

export function SharedLayout({ children, title, subtitle, icon }: SharedLayoutProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <DemoNote />
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        <div className="bg-surface rounded-xl p-6 mb-8 shadow-custom">
          <h1 className="text-3xl font-semibold text-primary-dark mb-2">
            {icon} {title}
          </h1>
          {subtitle && (
            <p className="text-text-secondary">
              {subtitle}
            </p>
          )}
        </div>
        
        {children}
      </main>
    </div>
  )
}