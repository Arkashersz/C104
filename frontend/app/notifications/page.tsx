'use client'

import { Sidebar } from '@/components/layout/sidebar'

export default function NotificationsPage() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <main className="flex-1 ml-64 p-8">
        <div className="bg-surface rounded-xl p-6 mb-8 shadow-custom">
          <h1 className="text-3xl font-semibold text-primary-dark mb-2">
            🔔 Notificações
          </h1>
          <p className="text-text-secondary">
            Central de notificações e alertas do sistema
          </p>
        </div>

        <div className="bg-surface rounded-xl p-8 shadow-custom text-center">
          <div className="text-6xl mb-4">🚧</div>
          <h2 className="text-2xl font-semibold text-primary-dark mb-2">
            Página em Desenvolvimento
          </h2>
          <p className="text-text-secondary">
            Esta funcionalidade está sendo desenvolvida e estará disponível em breve.
          </p>
        </div>
      </main>
    </div>
  )
}