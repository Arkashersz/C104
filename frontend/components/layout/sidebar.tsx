'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Dashboard', href: '/', icon: '📊' },
  { name: 'Contratos', href: '/contracts', icon: '📄' },
  { name: 'Licitações', href: '/bidding', icon: '⚖️' },
  { name: 'Notificações', href: '/notifications', icon: '🔔' },
  { name: 'Relatórios', href: '/reports', icon: '📈' },
  { name: 'Usuários', href: '/users', icon: '👥' },
  { name: 'Configurações', href: '/settings', icon: '⚙️' },
]

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-3 rounded-lg bg-primary-dark text-white shadow-lg hover:bg-primary-medium transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="sr-only">Toggle menu</span>
        {isOpen ? '✕' : '☰'}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-40 w-64 bg-gradient-to-b from-primary-dark to-primary-medium text-white transform transition-all duration-300 ease-in-out lg:translate-x-0 shadow-xl',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Logo */}
        <div className="flex items-center justify-center h-20 px-6 border-b border-white/10">
          <h1 className="text-xl font-bold tracking-wide">📋 GestContratos</h1>
        </div>

        {/* Navigation */}
        <nav className="mt-8 px-4 flex-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 mb-2 group',
                  isActive
                    ? 'bg-accent-light text-primary-dark transform translate-x-2 shadow-md'
                    : 'text-white/80 hover:bg-white/10 hover:text-white hover:translate-x-1'
                )}
                onClick={() => setIsOpen(false)}
              >
                <span className={cn(
                  'mr-3 text-xl transition-transform duration-200',
                  'group-hover:scale-110'
                )}>
                  {item.icon}
                </span>
                {item.name}
                {item.name === 'Notificações' && (
                  <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                    3
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-white/10 mt-auto">
          <div className="flex items-center space-x-3 px-4 py-3 rounded-lg bg-white/10">
            <div className="w-8 h-8 bg-accent-light rounded-full flex items-center justify-center">
              <span className="text-primary-dark font-semibold text-sm">U</span>
            </div>
            <div>
              <div className="text-sm font-medium">Usuário Demo</div>
              <div className="text-xs text-white/70">Administrador</div>
            </div>
          </div>
        </div>

        {/* Version info */}
        <div className="p-4 text-center">
          <div className="text-xs text-white/50">
            Sistema v1.0.0
          </div>
        </div>
      </div>
    </>
  )
}