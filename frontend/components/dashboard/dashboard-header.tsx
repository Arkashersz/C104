interface DashboardHeaderProps {
    onNewContract?: () => void
    onNewBidding?: () => void
    onReport?: () => void
}
  
  export function DashboardHeader({ onNewContract, onNewBidding, onReport }: DashboardHeaderProps) {
    return (
      <div className="bg-surface rounded-xl p-6 mb-8 shadow-custom flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-primary-dark mb-2">
            Dashboard
          </h1>
          <p className="text-text-secondary">
            Visão geral dos contratos e licitações
          </p>
        </div>
        <div className="flex gap-4">
          {/* Removido: Botão de Relatório */}
          {/* Removido: Botões de novo contrato e nova licitação */}
        </div>
      </div>
    )
  }