import { useEffect, useState } from 'react'
import { useContracts } from '@/lib/hooks/use-contracts'
import { useBidding } from '@/lib/hooks/use-bidding'
import { ContractStats } from '@/types/contracts'
import { BiddingStats } from '@/types/bidding'

interface StatsGridProps {
  contractStats?: ContractStats | null
  biddingStats?: BiddingStats | null
  loading?: boolean
}

export function StatsGrid({ contractStats, biddingStats, loading = false }: StatsGridProps) {
  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)}M`
    } else if (value >= 1000) {
      return `R$ ${(value / 1000).toFixed(1)}K`
    } else {
      return `R$ ${value.toFixed(0)}`
    }
  }

  const stats = [
    {
      number: contractStats?.active?.toString() || '0',
      label: 'Contratos Ativos',
      trend: '↗️ Ativos no sistema',
      trendColor: 'text-green-600',
      borderColor: 'border-l-primary-medium'
    },
    {
      number: contractStats?.expiringSoon?.toString() || '0',
      label: 'Vencem em 30 dias',
      trend: '⚠️ Atenção necessária',
      trendColor: 'text-yellow-600',
      borderColor: 'border-l-yellow-500'
    },
    {
      number: biddingStats?.active?.toString() || '0',
      label: 'Processos em Andamento',
      trend: '⏳ Em execução',
      trendColor: 'text-blue-600',
      borderColor: 'border-l-blue-500'
    },
    {
      number: formatCurrency(contractStats?.totalValue || 0),
      label: 'Valor Total Contratado',
      trend: '📈 Contratos ativos',
      trendColor: 'text-green-600',
      borderColor: 'border-l-green-500'
    },
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((index) => (
          <div key={index} className="stat-card border-l-primary-medium animate-pulse">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <div
          key={index}
          className={`stat-card ${stat.borderColor}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl font-bold text-primary-dark mb-2">
                {stat.number}
              </div>
              <div className="text-text-secondary font-medium">
                {stat.label}
              </div>
              <div className={`mt-2 text-sm ${stat.trendColor}`}>
                {stat.trend}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}