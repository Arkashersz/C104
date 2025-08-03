import { SEIProcessWithRelations } from '@/types/shared'

interface ProcessDetailsProps {
  process: SEIProcessWithRelations
  onClose: () => void
  formatDate?: (dateString: string) => string
  formatDateTime?: (dateString: string) => string
}

export function ProcessDetails({ 
  process, 
  onClose, 
  formatDate = (dateString: string) => {
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
  },
  formatDateTime = (dateString: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('pt-BR')
  }
}: ProcessDetailsProps) {
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
          <strong>Data de Início:</strong> {formatDate(process.start_date || '')}
        </div>
        <div>
          <strong>Data de Término:</strong> {formatDate(process.end_date || '')}
        </div>
        <div>
          <strong>Data de Abertura:</strong> {formatDate(process.opening_date || '')}
        </div>
        <div>
          <strong>Notificações:</strong> {process.notification_days ? process.notification_days.join(', ') : '-'}
        </div>
        <div>
          <strong>Criado em:</strong> {formatDateTime(process.created_at || '')}
        </div>
        <div>
          <strong>Atualizado em:</strong> {formatDateTime(process.updated_at || '')}
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