import {formatCurrency, formatDate} from '@/lib/utils';
import { useState } from 'react'

const getStatusLabel = (status: string) => {
  const labels = {
    active: 'Ativo',
    expired: 'Vencido',
    cancelled: 'Cancelado',
    renewed: 'Renovado'
  };
  return labels[status as keyof typeof labels] || 'Desconhecido';
};

interface Contract {
  id: string;
  contract_number: string;
  supplier: string;
  value: number;
  end_date: string;
  status: 'active' | 'expired' | 'cancelled' | 'renewed';
}

interface ContractsTableProps {
    contracts: Contract[];
    isLoading: boolean;
}

interface ContractPreviewProps {
  contract: Contract | null
  onClose: () => void
}

function ContractPreview({ contract, onClose }: ContractPreviewProps) {
  if (!contract) return null
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
        <button className="absolute top-2 right-2 text-gray-500 hover:text-gray-700" onClick={onClose}>✖</button>
        <h2 className="text-xl font-bold mb-4">Visualizar Contrato</h2>
        <div className="mb-2"><strong>Processo SEI:</strong> {contract.contract_number}</div>
        <div className="mb-2"><strong>Fornecedor:</strong> {contract.supplier}</div>
        <div className="mb-2"><strong>Valor:</strong> {formatCurrency(contract.value)}</div>
        <div className="mb-2"><strong>Vencimento:</strong> {formatDate(contract.end_date)}</div>
        <div className="mb-2"><strong>Status:</strong> {getStatusLabel(contract.status)}</div>
        {/* Adicione mais campos se necessário */}
      </div>
    </div>
  )
}

export function ContractsTable({ contracts, isLoading }: ContractsTableProps) {
    const getStatusClass = (status: string) => {
      const classes = {
        active: 'bg-green-50 text-green-700',
        warning: 'bg-yellow-50 text-yellow-700',
        expired: 'bg-red-50 text-red-700',
        cancelled: 'bg-gray-50 text-gray-700',
        renewed: 'bg-blue-50 text-blue-700'
      }
      return classes[status as keyof typeof classes] || classes.active
    }
    
    const [previewContract, setPreviewContract] = useState<Contract | null>(null)

    return (
      <div className="table-container mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-primary-dark">
            Contratos
          </h3>
          <input 
            type="text" 
            placeholder="🔍 Buscar contratos..." 
            className="px-4 py-2 border-2 border-gray-200 rounded-lg w-80 focus:outline-none focus:border-primary-light transition-colors"
          />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-background">
                <th className="text-left p-4 font-semibold text-text-secondary border-b-2 border-gray-200">
                  Nº Contrato
                </th>
                <th className="text-left p-4 font-semibold text-text-secondary border-b-2 border-gray-200">
                  Fornecedor
                </th>
                <th className="text-left p-4 font-semibold text-text-secondary border-b-2 border-gray-200">
                  Valor
                </th>
                <th className="text-left p-4 font-semibold text-text-secondary border-b-2 border-gray-200">
                  Vencimento
                </th>
                <th className="text-left p-4 font-semibold text-text-secondary border-b-2 border-gray-200">
                  Status
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
              ) : contracts.length === 0 ? (
                <tr>
                    <td colSpan={6} className="text-center p-4">Nenhum contrato encontrado.</td>
                </tr>
              ) : (
                contracts.map((contract) => (
                    <tr key={contract.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 border-b border-gray-100">
                        <strong>{contract.contract_number}</strong>
                    </td>
                    <td className="p-4 border-b border-gray-100">
                        {contract.supplier}
                    </td>
                    <td className="p-4 border-b border-gray-100">
                        {formatCurrency(contract.value)}
                    </td>
                    <td className="p-4 border-b border-gray-100">
                        {formatDate(contract.end_date)}
                    </td>
                    <td className="p-4 border-b border-gray-100">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(contract.status)}`}>
                        {getStatusLabel(contract.status)}
                        </span>
                    </td>
                    <td className="p-4 border-b border-gray-100">
                        <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors" onClick={() => setPreviewContract(contract)}>
                        👁️ Visualizar
                        </button>
                    </td>
                    </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {previewContract && (
          <ContractPreview contract={previewContract} onClose={() => setPreviewContract(null)} />
        )}
      </div>
    )
  }