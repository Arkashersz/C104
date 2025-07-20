'use client'

import { SharedLayout } from '@/components/layout/shared-layout'
import { UnderDevelopment } from '@/components/ui/under-development'

export default function ContractsPage() {
  return (
    <SharedLayout 
      title="Contratos" 
      subtitle="Gestão completa de contratos"
      icon="📄"
    >
      <UnderDevelopment />
    </SharedLayout>
  )
}