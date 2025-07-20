export function StatsGrid() {
    const stats = [
      {
        number: '47',
        label: 'Contratos Ativos',
        trend: '↗️ +12% este mês',
        trendColor: 'text-green-600',
        borderColor: 'border-l-primary-medium'
      },
      {
        number: '8',
        label: 'Vencem em 30 dias',
        trend: '⚠️ Atenção necessária',
        trendColor: 'text-yellow-600',
        borderColor: 'border-l-yellow-500'
      },
      {
        number: '23',
        label: 'Processos em Andamento',
        trend: '⏳ 5 aguardando ação',
        trendColor: 'text-blue-600',
        borderColor: 'border-l-blue-500'
      },
      {
        number: 'R$ 2.3M',
        label: 'Valor Total Contratado',
        trend: '📈 +8% no período',
        trendColor: 'text-green-600',
        borderColor: 'border-l-green-500'
      },
    ]
  
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`stat-card ${stat.borderColor}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-primary-dark mb-2">
                  {stat.number}
                </div>
                <div className="text-text-secondary font-medium">
                  {stat.label}
                </div>
                <div className={`mt-2 text-sm ${stat.trendColor}`}>
                  {stat.trend}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }