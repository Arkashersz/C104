import { BiddingProcess } from '@/types/shared'
import { useState } from 'react'

interface BiddingProcessesTableProps {
  processes: BiddingProcess[];
  isLoading: boolean;
}

interface BiddingPreviewProps {
  process: BiddingProcess | null
  onClose: () => void
}

function BiddingPreview({ process, onClose }: BiddingPreviewProps) {
  if (!process) return null
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
        <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={onClose}>✖</button>
        <h2 className="text-xl font-bold mb-4">Visualizar Processo Licitatório</h2>
        <div className="mb-2"><strong>Nº Processo:</strong> {process.process_number}</div>
        <div className="mb-2"><strong>Objeto:</strong> {process.title}</div>
        <div className="mb-2"><strong>Status Atual:</strong> {process.current_status?.name || 'N/A'}</div>
        <div className="mb-2"><strong>Responsável:</strong> {process.created_by?.name || 'N/A'}</div>
        <div className="mb-2"><strong>Última Atualização:</strong> {new Date(process.updated_at).toLocaleDateString('pt-BR')}</div>
        {/* Adicione mais campos se necessário */}
      </div>
    </div>
  )
}

export function BiddingProcessesTable({ processes, isLoading }: BiddingProcessesTableProps) {
  const getStatusClass = (color: string) => {
    // Mapeia cores para classes do Tailwind, adicione mais se necessário
    const colorMap: { [key: string]: string } = {
      'blue': 'bg-blue-50 text-blue-700',
      'yellow': 'bg-yellow-50 text-yellow-700',
      'green': 'bg-green-50 text-green-700',
      'red': 'bg-red-50 text-red-700',
    };
    return colorMap[color] || 'bg-gray-50 text-gray-700';
  };

  const [previewProcess, setPreviewProcess] = useState<BiddingProcess | null>(null)

  return (
    <div className="table-container mb-8">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-primary-dark">
          Processos Licitatórios
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-background">
              <th className="text-left p-4 font-semibold text-text-secondary border-b-2 border-gray-200">
                Nº Processo
              </th>
              <th className="text-left p-4 font-semibold text-text-secondary border-b-2 border-gray-200">
                Objeto
              </th>
              <th className="text-left p-4 font-semibold text-text-secondary border-b-2 border-gray-200">
                Status Atual
              </th>
              <th className="text-left p-4 font-semibold text-text-secondary border-b-2 border-gray-200">
                Responsável
              </th>
              <th className="text-left p-4 font-semibold text-text-secondary border-b-2 border-gray-200">
                Última Atualização
              </th>
              <th className="text-left p-4 font-semibold text-text-secondary border-b-2 border-gray-200">
                Ações
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={6} className="text-center p-4">Carregando...</td>
              </tr>
            ) : processes.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center p-4">Nenhum processo encontrado.</td>
              </tr>
            ) : (
              processes.map((process) => (
                <tr key={process.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 border-b border-gray-100">
                    <strong>{process.process_number}</strong>
                  </td>
                  <td className="p-4 border-b border-gray-100" style={{ maxWidth: '300px', whiteSpace: 'normal' }}>
                    {process.title}
                  </td>
                  <td className="p-4 border-b border-gray-100">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(process.current_status?.color || '')}`}>
                      {process.current_status?.name || 'N/A'}
                    </span>
                  </td>
                  <td className="p-4 border-b border-gray-100">
                    {process.created_by?.name || 'N/A'}
                  </td>
                  <td className="p-4 border-b border-gray-100">
                    {new Date(process.updated_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="p-4 border-b border-gray-100">
                    <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors" onClick={() => setPreviewProcess(process)}>
                      👁️ Visualizar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {previewProcess && (
        <BiddingPreview process={previewProcess} onClose={() => setPreviewProcess(null)} />
      )}
    </div>
  )
}