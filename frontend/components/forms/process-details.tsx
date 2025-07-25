import { SEIProcessWithRelations } from '@/types/shared'

interface ProcessDetailsProps {
  process: SEIProcessWithRelations
  onClose: () => void
}

export function ProcessDetails({ process, onClose }: ProcessDetailsProps) {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Detalhes do Processo</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <strong>Número:</strong> {process.process_number}
        </div>
        <div>
          <strong>Tipo:</strong> {process.type}
        </div>
        <div className="md:col-span-2">
          <strong>Título:</strong> {process.title}
        </div>
        <div className="md:col-span-2">
          <strong>Descrição:</strong> {process.description || '-'}
        </div>
        <div>
          <strong>Grupo:</strong> {process.group?.name || '-'}
        </div>
        <div>
          <strong>Status:</strong> {process.status}
        </div>
        <div>
          <strong>Fornecedor:</strong> {process.supplier || '-'}
        </div>
        <div>
          <strong>Valor:</strong> {process.value ? `R$ ${process.value.toLocaleString('pt-BR')}` : '-'}
        </div>
        <div>
          <strong>Valor Estimado:</strong> {process.estimated_value ? `R$ ${process.estimated_value.toLocaleString('pt-BR')}` : '-'}
        </div>
        <div>
          <strong>Data de Início:</strong> {process.start_date || '-'}
        </div>
        <div>
          <strong>Data de Término:</strong> {process.end_date || '-'}
        </div>
        <div>
          <strong>Data de Abertura:</strong> {process.opening_date || '-'}
        </div>
        <div>
          <strong>Notificações:</strong> {process.notification_days ? process.notification_days.join(', ') : '-'}
        </div>
        <div>
          <strong>Criado em:</strong> {process.created_at ? new Date(process.created_at).toLocaleString('pt-BR') : '-'}
        </div>
        <div>
          <strong>Atualizado em:</strong> {process.updated_at ? new Date(process.updated_at).toLocaleString('pt-BR') : '-'}
        </div>
      </div>
      <div className="flex justify-end mt-6">
        <button className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300" onClick={onClose}>
          Fechar
        </button>
      </div>
    </div>
  )
} 