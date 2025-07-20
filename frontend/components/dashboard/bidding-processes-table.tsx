export function BiddingProcessesTable() {
    const processes = [
      {
        number: 'LIC-2025-001',
        object: 'Aquisição de Equipamentos de TI',
        status: 'warning',
        statusLabel: 'Aguardando Aprovação',
        responsible: 'João Silva',
        deadline: '20/07/2025',
        action: 'Lembrar'
      },
      {
        number: 'LIC-2025-002',
        object: 'Reforma do Prédio Administrativo',
        status: 'active',
        statusLabel: 'Em Elaboração',
        responsible: 'Maria Santos',
        deadline: '25/07/2025',
        action: 'Acompanhar'
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
  
    const getActionClass = (action: string) => {
      return action === 'Lembrar' ? 'btn-primary' : 'btn-secondary'
    }
  
    return (
      <div className="table-container mb-8">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-primary-dark">
            Processos Licitatórios - Ações Pendentes
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
                  Prazo
                </th>
                <th className="text-left p-4 font-semibold text-text-secondary border-b-2 border-gray-200">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {processes.map((process, index) => (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 border-b border-gray-100">
                    <strong>{process.number}</strong>
                  </td>
                  <td className="p-4 border-b border-gray-100">
                    {process.object}
                  </td>
                  <td className="p-4 border-b border-gray-100">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusClass(process.status)}`}>
                      {process.statusLabel}
                    </span>
                  </td>
                  <td className="p-4 border-b border-gray-100">
                    {process.responsible}
                  </td>
                  <td className="p-4 border-b border-gray-100">
                    {process.deadline}
                  </td>
                  <td className="p-4 border-b border-gray-100">
                    <button className={`px-3 py-1 text-sm rounded transition-colors ${getActionClass(process.action)}`}>
                      {process.action === 'Lembrar' ? '📧' : '👁️'} {process.action}
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