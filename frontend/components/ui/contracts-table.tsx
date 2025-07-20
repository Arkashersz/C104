interface Contract {
    id: number;
    name: string;
    value: number;
    status: string;
    signatory: string;
    endDate: string;
  }
  
  interface ContractsTableProps {
    contracts: Contract[];
  }
  
  export function ContractsTable({ contracts }: ContractsTableProps) {
    return (
      <div className="bg-surface rounded-xl p-6 shadow-custom">
        <h2 className="text-2xl font-semibold text-primary-dark mb-4">Contratos Recentes</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left">
            <thead className="border-b border-gray-200">
              <tr>
                <th className="py-3 px-4 text-sm font-semibold text-text-secondary">Nome do Contrato</th>
                <th className="py-3 px-4 text-sm font-semibold text-text-secondary">Valor</th>
                <th className="py-3 px-4 text-sm font-semibold text-text-secondary">Status</th>
                <th className="py-3 px-4 text-sm font-semibold text-text-secondary">Data de Término</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((contract) => (
                <tr key={contract.id} className="border-b border-gray-200 last:border-b-0">
                  <td className="py-4 px-4 text-text-primary">{contract.name}</td>
                  <td className="py-4 px-4 text-text-primary">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contract.value)}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      contract.status === 'ativo' ? 'bg-green-100 text-green-800' :
                      contract.status === 'finalizado' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {contract.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-text-primary">{new Date(contract.endDate).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }