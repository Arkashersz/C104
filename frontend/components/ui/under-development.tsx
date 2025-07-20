interface UnderDevelopmentProps {
    title?: string
    description?: string
  }
  
  export function UnderDevelopment({ 
    title = "Página em Desenvolvimento",
    description = "Esta funcionalidade está sendo desenvolvida e estará disponível em breve."
  }: UnderDevelopmentProps) {
    return (
      <div className="bg-surface rounded-xl p-8 shadow-custom text-center">
        <div className="text-6xl mb-4">🚧</div>
        <h2 className="text-2xl font-semibold text-primary-dark mb-2">
          {title}
        </h2>
        <p className="text-text-secondary">
          {description}
        </p>
        
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-800 mb-2">🎯 Funcionalidades Planejadas:</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Interface completa para gestão</li>
            <li>• Filtros avançados e busca</li>
            <li>• Exportação de relatórios</li>
            <li>• Notificações automáticas</li>
            <li>• Integração com APIs externas</li>
          </ul>
        </div>
      </div>
    )
  }