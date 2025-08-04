'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { TrendingUp, PieChart as PieChartIcon, BarChart3, Activity } from 'lucide-react'
import { SEIProcess } from '@/types/shared'

interface InteractiveChartsProps {
  processes: SEIProcess[]
}

interface ChartData {
  name: string
  value: number
  color: string
}

export function InteractiveCharts({ processes }: InteractiveChartsProps) {
  const [activeChart, setActiveChart] = useState<'pie' | 'bar' | 'line'>('pie')

  // Dados para gráfico de pizza - Distribuição por tipo
  const pieData = useMemo(() => {
    const typeCount = processes.reduce((acc, process) => {
      acc[process.type] = (acc[process.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const colors = ['#3B82F6', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6']
    
    return Object.entries(typeCount).map(([type, count], index) => ({
      name: getTypeLabel(type),
      value: count,
      color: colors[index % colors.length]
    }))
  }, [processes])

  // Dados para gráfico de barras - Distribuição por status
  const barData = useMemo(() => {
    const statusCount = processes.reduce((acc, process) => {
      acc[process.status] = (acc[process.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const colors = {
      'em_andamento': '#3B82F6',
      'finalizado': '#10B981',
      'cancelado': '#EF4444'
    }

    return Object.entries(statusCount).map(([status, count]) => ({
      name: getStatusLabel(status),
      value: count,
      color: colors[status as keyof typeof colors] || '#6B7280'
    }))
  }, [processes])

  // Dados para gráfico de linha - Evolução mensal
  const lineData = useMemo(() => {
    const monthlyData = processes.reduce((acc, process) => {
      const date = new Date(process.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!acc[monthKey]) {
        acc[monthKey] = {
          month: formatMonth(monthKey),
          created: 0,
          completed: 0
        }
      }
      
      acc[monthKey].created++
      
      if (process.status === 'finalizado') {
        acc[monthKey].completed++
      }
      
      return acc
    }, {} as Record<string, { month: string; created: number; completed: number }>)

    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month))
  }, [processes])

  function getTypeLabel(type: string) {
    switch (type) {
      case 'contrato': return 'Contrato'
      case 'licitacao': return 'Licitação'
      case 'dispensa': return 'Dispensa'
      case 'outro': return 'Outro'
      default: return type
    }
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'em_andamento': return 'Em Andamento'
      case 'finalizado': return 'Finalizado'
      case 'cancelado': return 'Cancelado'
      default: return status
    }
  }

  function formatMonth(monthKey: string) {
    const [year, month] = monthKey.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-4">
      {/* Controles de Visualização */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-lg font-semibold text-gray-900">Visualizações</h4>
          <p className="text-sm text-gray-600">Análise detalhada dos dados</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={activeChart === 'pie' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveChart('pie')}
            className="h-8 px-3"
          >
            <PieChartIcon className="h-4 w-4 mr-1" />
            Pizza
          </Button>
          <Button
            variant={activeChart === 'bar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveChart('bar')}
            className="h-8 px-3"
          >
            <BarChart3 className="h-4 w-4 mr-1" />
            Barras
          </Button>
          <Button
            variant={activeChart === 'line' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveChart('line')}
            className="h-8 px-3"
          >
            <Activity className="h-4 w-4 mr-1" />
            Linha
          </Button>
        </div>
      </div>

      {/* Gráfico Ativo */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {activeChart === 'pie' && (
          <div>
            <h5 className="text-base font-medium text-gray-900 mb-4">Distribuição por Tipo</h5>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {pieData.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-gray-600">{entry.name}</span>
                  <span className="text-sm font-medium">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeChart === 'bar' && (
          <div>
            <h5 className="text-base font-medium text-gray-900 mb-4">Distribuição por Status</h5>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeChart === 'line' && (
          <div>
            <h5 className="text-base font-medium text-gray-900 mb-4">Evolução Mensal</h5>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={lineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="created" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                    name="Criados"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="completed" 
                    stroke="#10B981" 
                    strokeWidth={2}
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                    name="Finalizados"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 