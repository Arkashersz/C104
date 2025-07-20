export function ContractsTable() {
    const contracts = [
      {
        number: 'CTR-2024-001',
        supplier: 'TechSolutions Ltda',
        value: 'R$ 125.000,00',
        dueDate: '15/08/2025',
        status: 'warning',
        statusLabel: 'Próximo ao Venc.',
        action: 'Editar'
      },
      {
        number: 'CTR-2024-002',
        supplier: 'Construtora ABC',
        value: 'R$ 850.000,00',
        dueDate: '22/09/2025',
        status: 'active',
        statusLabel: 'Ativo',
        action: 'Editar'
      },
      {
        number: 'CTR-2023-045',
        supplier: 'Suprimentos Gerais',
        value: 'R$ 45.500,00',
        dueDate: '05/08/2025',
        status: 'expired',
        statusLabel: 'Vencido',
        action: 'Renovar'
      },
      {
        number: 'CTR-2024-003',
        supplier: 'Serviços Digitais Pro',
        value: 'R$ 280.000,00',
        dueDate: '30/11/2025',
        status: 'active',
        statusLabel: 'Ativo',
        action: 'Editar'
      }
    ]
  
    const getStatusClass = (status: string) => {
      const classes = {
        active: 'bg-green-50 text-green-700',
        warning: 'bg-yellow-50 text-yellow-700',
        expired: 'bg-red-50 text-red-700'
      }
      return classes[status as keyof typeof classes] || classes.active
    }
  
    return (
      <div className="table-container mb-8">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-primary-dark">
            Contratos Próximos ao Vencimento
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
              {contracts.map((contract, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 border-b border-gray-100">
                    <strong>{contract.number}</strong>
                  </td>
                  <td className="p-4 border-b border-gray-100">
                    {contract.supplier}
                  </td>
                  <td className="p-4 border-b border-gray-100">
                    {contract.value}
                  </td>
                  <td className="p-4 border-b border-gray-100">
                    {contract.dueDate}
                  </td>
                  <td className="p-4 border-b border-gray-100">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(contract.status)}`}>
                      {contract.statusLabel}
                    </span>
                  </td>
                  <td className="p-4 border-b border-gray-100">
                    <button className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                      {contract.action === 'Editar' ? '✏️' : '🔄'} {contract.action}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }