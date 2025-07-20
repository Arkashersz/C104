export function MobilePreview() {
    return (
      <div className="bg-surface rounded-xl p-6 shadow-custom mt-8">
        <h3 className="text-xl font-semibold text-primary-dark mb-6">
          📱 Preview Mobile
        </h3>
        
        <div className="flex gap-8 items-start">
          {/* Phone Mockup */}
          <div className="w-80 h-[600px] bg-black rounded-[40px] p-2 shadow-2xl">
            <div className="w-full h-full bg-background rounded-[35px] p-4 overflow-hidden relative">
              {/* Mobile Header */}
              <div className="flex justify-between items-center py-2 border-b border-gray-200 mb-4">
                <div className="font-semibold text-primary-dark">GestContratos</div>
                <div className="flex gap-2">
                  <span>🔔</span>
                  <span>👤</span>
                </div>
              </div>
              
              {/* Mobile Stats */}
              <div className="space-y-3 mb-4">
                <div className="bg-surface rounded-lg p-4 shadow-sm">
                  <div className="text-2xl font-bold text-primary-dark">47</div>
                  <div className="text-sm text-text-secondary">Contratos Ativos</div>
                </div>
                
                <div className="bg-surface rounded-lg p-4 shadow-sm">
                  <div className="text-2xl font-bold text-yellow-600">8</div>
                  <div className="text-sm text-text-secondary">Próximos ao Vencimento</div>
                </div>
              </div>
              
              {/* Mobile Navigation */}
              <div className="absolute bottom-0 left-0 right-0 bg-primary-dark text-white p-3 rounded-t-[35px]">
                <div className="grid grid-cols-4 gap-1 text-xs text-center">
                  <div>
                    <div className="text-lg mb-1">📊</div>
                    <div>Dashboard</div>
                  </div>
                  <div>
                    <div className="text-lg mb-1">📄</div>
                    <div>Contratos</div>
                  </div>
                  <div>
                    <div className="text-lg mb-1">⚖️</div>
                    <div>Licitações</div>
                  </div>
                  <div>
                    <div className="text-lg mb-1">⚙️</div>
                    <div>Config</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Features List */}
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-primary-dark mb-4">
              Características Mobile:
            </h4>
            <ul className="space-y-3 text-text-secondary">
              <li className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                Design responsivo com breakpoints otimizados
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                Navegação por tabs na parte inferior
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                Cards empilhados verticalmente
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                Formulários adaptados para touch
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                Notificações push nativas
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                Modo offline com sincronização
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                Swipe gestures para ações rápidas
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                Busca com filtros simplificados
              </li>
            </ul>
          </div>
        </div>
      </div>
    )
  }