'use client'

import { SharedLayout } from '@/components/layout/shared-layout'
import { UnderDevelopment } from '@/components/ui/under-development'

export default function BiddingPage() {
  return (
    <SharedLayout 
      title="Licitações" 
      subtitle="Sistema de gestão de processos licitatórios"
      icon="⚖️"
    >
      <UnderDevelopment />
    </SharedLayout>
  )
}