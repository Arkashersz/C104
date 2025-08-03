'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { SEIProcess } from '@/types/shared'
import { useGroups } from '@/lib/hooks/use-groups'
import { useSEIProcesses } from '@/lib/hooks/use-sei-processes'
import { Sidebar } from '@/components/layout/sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { ProcessForm } from '@/components/forms/process-form'
import { ProcessDetails } from '@/components/forms/process-details'
import { Pencil, Eye, Trash2 } from 'lucide-react'

export default function ProcessosPage() {
  const supabase = createClient()
  const { fetchGroups } = useGroups()
  const { deleteProcess } = useSEIProcesses()
  const [processes, setProcesses] = useState<SEIProcess[]>([])
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([])
  const [groupFilter, setGroupFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingProcess, setEditingProcess] = useState<SEIProcess | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [selectedProcess, setSelectedProcess] = useState<SEIProcess | null>(null)
  const [deleteMsg, setDeleteMsg] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Função para formatar data simples (sem conversão de timezone)
  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    
    // Se a data já está no formato YYYY-MM-DD, usar diretamente
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      const [year, month, day] = dateString.split('-')
      return `${day}/${month}/${year}`
    }
    
    // Se tem T (ISO string), extrair apenas a parte da data
    if (dateString.includes('T')) {
      const datePart = dateString.split('T')[0]
      const [year, month, day] = datePart.split('-')
      return `${day}/${month}/${year}`
    }
    
    // Fallback para outras formatações
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
  }

  // Função para formatar data e hora simples (sem conversão de timezone)
  const formatDateTime = (dateString: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('pt-BR')
  }

  useEffect(() => { fetchGroups().then(setGroups) }, [fetchGroups])
  useEffect(() => { fetchProcesses() }, [groupFilter, typeFilter, statusFilter, search])

  // Verificar se há um processo para destacar
  useEffect(() => {
    const highlightId = searchParams.get('highlight')
    if (highlightId && processes.length > 0) {
      const processToHighlight = processes.find(p => p.id === highlightId)
      if (processToHighlight) {
        setSelectedProcess(processToHighlight)
        setShowDetails(true)
        // Limpar o parâmetro da URL
        router.replace('/processos')
      }
    }
  }, [searchParams, processes, router])

  async function fetchProcesses() {
    let query = supabase.from('sei_processes').select('*, group:groups(id, name)').order('created_at', { ascending: false })
    if (groupFilter) query = query.eq('group_id', groupFilter)
    if (typeFilter) query = query.eq('type', typeFilter)
    if (statusFilter) query = query.eq('status', statusFilter)
    if (search) query = query.ilike('title', `%${search}%`)
    const { data } = await query
    setProcesses(data || [])
  }

  async function handleDelete(id: string) {
    if (confirm('Tem certeza que deseja excluir este processo?')) {
      const ok = await deleteProcess(id)
      if (ok) {
        setDeleteMsg('Processo excluído com sucesso!')
        setTimeout(() => setDeleteMsg(null), 2000)
      }
      fetchProcesses()
    }
  }
  function handleView(proc: SEIProcess) {
    setSelectedProcess(proc)
    setShowDetails(true)
  }

  function getStatusLabel(status: string) {
    switch (status) {
      case 'em_andamento': return 'Em andamento';
      case 'finalizado': return 'Finalizado';
      case 'cancelado': return 'Cancelado';
      default: return status;
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => router.push('/')}>{'< Voltar'}</Button>
          <h1 className="text-3xl font-bold">Processos</h1>
        </div>
        <div className="flex flex-wrap gap-4 mb-6">
          <Input placeholder="Buscar por título..." value={search} onChange={e => setSearch(e.target.value)} />
          <Select value={groupFilter} onChange={e => setGroupFilter(e.target.value)}>
            <option value="">Todos os grupos</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </Select>
          <Select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="">Todos os tipos</option>
            <option value="contrato">Contrato</option>
            <option value="licitacao">Licitação</option>
            <option value="dispensa">Dispensa</option>
          </Select>
          <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">Todos os status</option>
            <option value="em_andamento">Em andamento</option>
            <option value="finalizado">Finalizado</option>
            <option value="cancelado">Cancelado</option>
          </Select>
        </div>
        {deleteMsg && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {deleteMsg}
          </div>
        )}
        {showDetails && selectedProcess && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full">
              <ProcessDetails 
                process={selectedProcess} 
                onClose={() => setShowDetails(false)}
                formatDate={formatDate}
                formatDateTime={formatDateTime}
              />
            </div>
          </div>
        )}
        <table className="w-full bg-white rounded-xl shadow mb-8">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 text-left">Nº Processo</th>
              <th className="p-3 text-left">Título</th>
              <th className="p-3 text-left">Tipo</th>
              <th className="p-3 text-left">Grupo</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Data de Vencimento</th>
              <th className="p-3 text-left">Ações</th>
            </tr>
          </thead>
          <tbody>
            {processes.map(proc => (
              <tr key={proc.id} className="border-b hover:bg-gray-50">
                <td className="p-3">{proc.process_number}</td>
                <td className="p-3">{proc.title}</td>
                <td className="p-3">{proc.type}</td>
                <td className="p-3">{proc.group?.name || '-'}</td>
                <td className="p-3">{getStatusLabel(proc.status)}</td>
                <td className="p-3">{formatDate(proc.end_date || '')}</td>
                <td className="p-3 flex gap-2">
                  <button
                    className="p-2 rounded hover:bg-gray-100 transition"
                    title="Visualizar"
                    onClick={() => handleView(proc)}
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    className="p-2 rounded hover:bg-gray-100 transition"
                    title="Editar"
                    onClick={() => { setEditingProcess(proc); setShowForm(true) }}
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    className="p-2 rounded hover:bg-red-100 text-red-600 transition"
                    title="Excluir"
                    onClick={() => handleDelete(proc.id!)}
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Button onClick={() => { setEditingProcess(null); setShowForm(true) }}>+ Novo Processo</Button>
        {showForm && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl relative">
              <Button variant="ghost" className="absolute top-2 right-2" onClick={() => setShowForm(false)}>✖</Button>
              <ProcessForm
                initialData={editingProcess || undefined}
                onSuccess={() => { setShowForm(false); fetchProcesses(); }}
                onCancel={() => setShowForm(false)}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  )
} 