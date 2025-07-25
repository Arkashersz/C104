import dynamic from 'next/dynamic'
import { useRef, useMemo } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { Contract } from '@/types/shared'
import { BiddingProcess } from '@/types/shared'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

interface ReportDashboardProps {
  contracts: Contract[]
  biddingProcesses: BiddingProcess[]
}

function getMonth(date: string) {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function ReportDashboard({ contracts, biddingProcesses }: ReportDashboardProps) {
  const dashboardRef = useRef<HTMLDivElement>(null)

  // Totais
  const totalContracts = contracts.length
  const totalBiddings = biddingProcesses.length
  const totalValue = contracts.reduce((acc, c) => acc + (c.value || 0), 0)

  // Contratos por status (para gráfico de barras)
  const contractStatusData = useMemo(() => {
    return contracts.reduce((acc, c) => {
      acc[c.status] = (acc[c.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }, [contracts])

  // Licitações por status (para gráfico de barras)
  const biddingStatusData = useMemo(() => {
    return biddingProcesses.reduce((acc, p) => {
      const status = p.current_status?.name || 'N/A'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }, [biddingProcesses])

  // Evolução mensal de contratos (gráfico de área)
  const contractsByMonth = useMemo(() => {
    const map = new Map<string, number>()
    contracts.forEach(c => {
      const m = getMonth(c.end_date)
      map.set(m, (map.get(m) || 0) + 1)
    })
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [contracts])

  // Evolução mensal de licitações (gráfico de área)
  const biddingsByMonth = useMemo(() => {
    const map = new Map<string, number>()
    biddingProcesses.forEach(p => {
      const m = getMonth(p.updated_at)
      map.set(m, (map.get(m) || 0) + 1)
    })
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [biddingProcesses])

  // Gráfico de barras - contratos por status
  const contractStatusChart = {
    options: {
      chart: { type: 'bar', animations: { enabled: true } },
      xaxis: { categories: Object.keys(contractStatusData) },
      title: { text: 'Contratos por Status', style: { fontSize: '18px' } },
      colors: ['#2563eb'],
      plotOptions: { bar: { borderRadius: 6, horizontal: true } },
      dataLabels: { enabled: true },
      grid: { borderColor: '#e5e7eb' },
    },
    series: [{ name: 'Contratos', data: Object.values(contractStatusData) }],
  }

  // Gráfico de barras - licitações por status
  const biddingStatusChart = {
    options: {
      chart: { type: 'bar', animations: { enabled: true } },
      xaxis: { categories: Object.keys(biddingStatusData) },
      title: { text: 'Licitações por Status', style: { fontSize: '18px' } },
      colors: ['#10b981'],
      plotOptions: { bar: { borderRadius: 6, horizontal: true } },
      dataLabels: { enabled: true },
      grid: { borderColor: '#e5e7eb' },
    },
    series: [{ name: 'Licitações', data: Object.values(biddingStatusData) }],
  }

  // Gráfico de área - evolução mensal contratos
  const contractsAreaChart = {
    options: {
      chart: { type: 'area', animations: { enabled: true } },
      xaxis: { categories: contractsByMonth.map(([m]) => m) },
      title: { text: 'Evolução Mensal de Contratos', style: { fontSize: '18px' } },
      colors: ['#2563eb'],
      dataLabels: { enabled: false },
      grid: { borderColor: '#e5e7eb' },
      fill: { type: 'gradient', gradient: { shade: 'light', type: 'vertical', opacityFrom: 0.6, opacityTo: 0.1 } },
    },
    series: [{ name: 'Contratos', data: contractsByMonth.map(([, v]) => v) }],
  }

  // Gráfico de área - evolução mensal licitações
  const biddingsAreaChart = {
    options: {
      chart: { type: 'area', animations: { enabled: true } },
      xaxis: { categories: biddingsByMonth.map(([m]) => m) },
      title: { text: 'Evolução Mensal de Licitações', style: { fontSize: '18px' } },
      colors: ['#10b981'],
      dataLabels: { enabled: false },
      grid: { borderColor: '#e5e7eb' },
      fill: { type: 'gradient', gradient: { shade: 'light', type: 'vertical', opacityFrom: 0.6, opacityTo: 0.1 } },
    },
    series: [{ name: 'Licitações', data: biddingsByMonth.map(([, v]) => v) }],
  }

  // Exportar dashboard em PDF
  const handleExportPDF = async () => {
    if (!dashboardRef.current) return
    const canvas = await html2canvas(dashboardRef.current)
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
    const pageWidth = pdf.internal.pageSize.getWidth()
    const imgWidth = pageWidth - 40
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight)
    pdf.save('relatorio-dashboard.pdf')
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-10 mb-10" ref={dashboardRef}>
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-primary-dark mb-1">Relatório Analítico</h2>
          <p className="text-gray-500">Visão geral dos contratos e licitações do sistema</p>
        </div>
        <button className="btn-primary px-6 py-2 rounded-lg text-lg shadow transition hover:bg-blue-700" onClick={handleExportPDF}>
          Exportar PDF
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-blue-50 rounded-xl p-6 flex flex-col items-center shadow">
          <span className="text-2xl font-bold text-blue-700">{totalContracts}</span>
          <span className="text-gray-600 mt-2">Total de Contratos</span>
        </div>
        <div className="bg-green-50 rounded-xl p-6 flex flex-col items-center shadow">
          <span className="text-2xl font-bold text-green-700">{totalBiddings}</span>
          <span className="text-gray-600 mt-2">Total de Licitações</span>
        </div>
        <div className="bg-indigo-50 rounded-xl p-6 flex flex-col items-center shadow">
          <span className="text-2xl font-bold text-indigo-700">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          <span className="text-gray-600 mt-2">Valor Total em Contratos</span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        <div className="bg-white rounded-xl p-6 shadow">
          <Chart options={contractStatusChart.options} series={contractStatusChart.series} type="bar" height={320} />
        </div>
        <div className="bg-white rounded-xl p-6 shadow">
          <Chart options={biddingStatusChart.options} series={biddingStatusChart.series} type="bar" height={320} />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl p-6 shadow">
          <Chart options={contractsAreaChart.options} series={contractsAreaChart.series} type="area" height={320} />
        </div>
        <div className="bg-white rounded-xl p-6 shadow">
          <Chart options={biddingsAreaChart.options} series={biddingsAreaChart.series} type="area" height={320} />
        </div>
      </div>
    </div>
  )
} 