'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { SEIProcess } from '@/types/shared'
import { useGroups } from '@/lib/hooks/use-groups'
import { Sidebar } from '@/components/layout/sidebar'
import { DashboardHeader } from '@/components/dashboard/dashboard-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Pencil, Eye, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { ProcessForm } from '@/components/forms/process-form'
import { Dialog } from '@/components/ui/dialog'

function getStatusLabel(status: string) {
  switch (status) {
    case 'em_andamento': return 'Em andamento';
    case 'finalizado': return 'Finalizado';
    case 'cancelado': return 'Cancelado';
    default: return status;
  }
}

export default function Dashboard() {
  const supabase = createClient()
  const { fetchGroups } = useGroups()
  const [processes, setProcesses] = useState<SEIProcess[]>([])
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([])
  const [groupFilter, setGroupFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingProcess, setEditingProcess] = useState<SEIProcess | null>(null)
  const [showView, setShowView] = useState(false)
  const [viewProcess, setViewProcess] = useState<SEIProcess | null>(null)
  const [showDelete, setShowDelete] = useState(false)
  const [deleteProcess, setDeleteProcess] = useState<SEIProcess | null>(null)
  const router = useRouter()

  useEffect(() => { fetchGroups().then(setGroups) }, [fetchGroups])
  useEffect(() => { fetchProcesses() }, [groupFilter, typeFilter, statusFilter, search])

  async function fetchProcesses() {
    let query = supabase.from('sei_processes').select('*, group:groups(id, name)').order('created_at', { ascending: false })
    if (groupFilter) query = query.eq('group_id', groupFilter)
    if (typeFilter) query = query.eq('type', typeFilter)
    if (statusFilter) query = query.eq('status', statusFilter)
    if (search) query = query.ilike('title', `%${search}%`)
    const { data } = await query
    setProcesses(data || [])
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <DashboardHeader />
        <div className="max-w-6xl mx-auto p-8">
          <h1 className="text-3xl font-bold mb-6">Processos</h1>
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
          <table className="w-full bg-white rounded-xl shadow mb-8">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-3 text-left">Nº Processo</th>
                <th className="p-3 text-left">Título</th>
                <th className="p-3 text-left">Tipo</th>
                <th className="p-3 text-left">Grupo</th>
                <th className="p-3 text-left">Status</th>
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
                  <td className="p-3 flex gap-2">
                    <button
                      className="p-2 rounded hover:bg-gray-100 transition"
                      title="Visualizar"
                      onClick={() => { setViewProcess(proc); setShowView(true) }}
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
                      onClick={() => { setDeleteProcess(proc); setShowDelete(true) }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {showView && viewProcess && (
            <Dialog open={showView} onOpenChange={setShowView}>
              <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-xl relative">
                <button className="absolute top-2 right-2" onClick={() => setShowView(false)}>✖</button>
                <h2 className="text-xl font-bold mb-4">Visualizar Processo</h2>
                <div className="mb-2"><strong>Nº Processo:</strong> {viewProcess.process_number}</div>
                <div className="mb-2"><strong>Título:</strong> {viewProcess.title}</div>
                <div className="mb-2"><strong>Tipo:</strong> {viewProcess.type}</div>
                <div className="mb-2"><strong>Grupo:</strong> {viewProcess.group?.name || '-'}</div>
                <div className="mb-2"><strong>Status:</strong> {getStatusLabel(viewProcess.status)}</div>
                <div className="mb-2"><strong>Descrição:</strong> {viewProcess.description || '-'}</div>
                {/* Adicione mais campos se quiser */}
              </div>
            </Dialog>
          )}
          {showDelete && deleteProcess && (
            <Dialog open={showDelete} onOpenChange={setShowDelete}>
              <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative text-center">
                <h2 className="text-xl font-bold mb-4">Excluir Processo</h2>
                <p>Tem certeza que deseja excluir o processo <strong>{deleteProcess.process_number}</strong>?</p>
                <div className="flex justify-center gap-4 mt-6">
                  <Button variant="ghost" onClick={() => setShowDelete(false)}>Cancelar</Button>
                  <Button variant="destructive" onClick={async () => {
                    await supabase.from('sei_processes').delete().eq('id', deleteProcess.id)
                    setShowDelete(false)
                    fetchProcesses()
                  }}>Excluir</Button>
                </div>
              </div>
            </Dialog>
          )}
          {showForm && (
            <Dialog open={showForm} onOpenChange={setShowForm}>
              <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-2xl relative">
                <button className="absolute top-2 right-2" onClick={() => setShowForm(false)}>✖</button>
                <ProcessForm
                  initialData={editingProcess || undefined}
                  onSuccess={() => { setShowForm(false); setEditingProcess(null); fetchProcesses(); }}
                  onCancel={() => { setShowForm(false); setEditingProcess(null); }}
                />
              </div>
            </Dialog>
          )}
        </div>
      </main>
    </div>
  )
}