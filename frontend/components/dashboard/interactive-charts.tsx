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
    return date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg">
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            Gráficos Interativos
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={activeChart === 'pie' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveChart('pie')}
            >
              <PieChartIcon className="h-4 w-4 mr-1" />
              Pizza
            </Button>
            <Button
              variant={activeChart === 'bar' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveChart('bar')}
            >
              <BarChart3 className="h-4 w-4 mr-1" />
              Barras
            </Button>
            <Button
              variant={activeChart === 'line' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveChart('line')}
            >
              <Activity className="h-4 w-4 mr-1" />
              Linha
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          {activeChart === 'pie' && (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}

          {activeChart === 'bar' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          )}

          {activeChart === 'line' && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="created" stroke="#3B82F6" name="Criados" />
                <Line type="monotone" dataKey="completed" stroke="#10B981" name="Finalizados" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Estatísticas rápidas */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {processes.filter(p => p.status === 'em_andamento').length}
            </div>
            <div className="text-sm text-gray-600">Em Andamento</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {processes.filter(p => p.status === 'finalizado').length}
            </div>
            <div className="text-sm text-gray-600">Finalizados</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {processes.filter(p => p.status === 'cancelado').length}
            </div>
            <div className="text-sm text-gray-600">Cancelados</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 