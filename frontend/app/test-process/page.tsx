'use client'
import { useState } from 'react'
import { ProcessForm } from '@/components/forms/process-form'
import { SEIProcess } from '@/types/shared'
import { useSEIProcesses } from '@/lib/hooks/use-sei-processes'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { ProcessDetails } from '@/components/forms/process-details'

export default function TestProcessPage() {
  const { processes, loading, error, fetchProcesses, deleteProcess } = useSEIProcesses()
  const [showForm, setShowForm] = useState(false)
  const [editingProcess, setEditingProcess] = useState<SEIProcess | null>(null)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showDetails, setShowDetails] = useState(false)
  const [selectedProcess, setSelectedProcess] = useState<SEIProcess | null>(null)
  const [deleteMsg, setDeleteMsg] = useState<string | null>(null)

  const handleSuccess = () => {
    setShowForm(false)
    setEditingProcess(null)
    fetchProcesses()
  }

  const handleEdit = (process: SEIProcess) => {
    setEditingProcess(process)
    setShowForm(true)
  }

  const handleView = (process: SEIProcess) => {
    setSelectedProcess(process)
    setShowDetails(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este processo?')) {
      const ok = await deleteProcess(id)
      if (ok) {
        setDeleteMsg('Processo excluído com sucesso!')
        setTimeout(() => setDeleteMsg(null), 2000)
      }
      fetchProcesses()
    }
  }

  const handleSearch = () => {
    fetchProcesses({
      search,
      type: typeFilter || undefined,
      status: statusFilter || undefined
    })
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Teste de Processos SEI</h1>
      
      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">Todos os tipos</option>
            <option value="contrato">Contrato</option>
            <option value="licitacao">Licitação</option>
            <option value="dispensa">Dispensa</option>
            <option value="outro">Outro</option>
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Todos os status</option>
            <option value="em_andamento">Em andamento</option>
            <option value="finalizado">Finalizado</option>
            <option value="cancelado">Cancelado</option>
          </Select>
          <Button onClick={handleSearch}>Buscar</Button>
        </div>
      </div>

      {/* Botão para criar novo processo */}
      <div className="mb-6">
        <Button onClick={() => setShowForm(true)}>
          Criar Novo Processo
        </Button>
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingProcess ? 'Editar Processo' : 'Novo Processo'}
          </h2>
          <ProcessForm
            initialData={editingProcess || undefined}
            onSuccess={handleSuccess}
            onCancel={() => {
              setShowForm(false)
              setEditingProcess(null)
            }}
          />
        </div>
      )}

      {deleteMsg && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {deleteMsg}
        </div>
      )}

      {showDetails && selectedProcess && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full">
            <ProcessDetails process={selectedProcess} onClose={() => setShowDetails(false)} />
          </div>
        </div>
      )}

      {/* Lista de processos */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Processos ({processes.length})</h2>
        </div>
        
        {loading && (
          <div className="p-4 text-center">Carregando...</div>
        )}
        
        {error && (
          <div className="p-4 bg-red-50 text-red-700">{error}</div>
        )}
        
        {!loading && processes.length === 0 && (
          <div className="p-4 text-center text-gray-500">
            Nenhum processo encontrado
          </div>
        )}
        
        {!loading && processes.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Número</th>
                  <th className="px-4 py-2 text-left">Tipo</th>
                  <th className="px-4 py-2 text-left">Título</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Grupo</th>
                  <th className="px-4 py-2 text-left">Valor</th>
                  <th className="px-4 py-2 text-left">Ações</th>
                </tr>
              </thead>
              <tbody>
                {processes.map((process) => (
                  <tr key={process.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{process.process_number}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        process.type === 'contrato' ? 'bg-blue-100 text-blue-800' :
                        process.type === 'licitacao' ? 'bg-green-100 text-green-800' :
                        process.type === 'dispensa' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {process.type}
                      </span>
                    </td>
                    <td className="px-4 py-2">{process.title}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-1 rounded text-xs ${
                        process.status === 'em_andamento' ? 'bg-blue-100 text-blue-800' :
                        process.status === 'finalizado' ? 'bg-green-100 text-green-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {process.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">{process.group?.name || '-'}</td>
                    <td className="px-4 py-2">
                      {process.value ? `R$ ${process.value.toLocaleString('pt-BR')}` : '-'}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleView(process)}
                        >
                          Visualizar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(process)}
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(process.id!)}
                        >
                          Excluir
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
} 