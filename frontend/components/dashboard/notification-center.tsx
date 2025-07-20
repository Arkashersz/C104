export function NotificationCenter() {
    const notifications = [
      {
        icon: '⚠️',
        title: 'Contratos Próximos ao Vencimento',
        description: '8 contratos vencem em 30 dias',
        lastNotification: 'Hoje, 09:00',
        nextNotification: 'Amanhã, 09:00',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-l-yellow-500',
        titleColor: 'text-yellow-700'
      },
      {
        icon: '🔴',
        title: 'Processos Atrasados',
        description: '3 processos aguardando há mais de 5 dias',
        lastNotification: 'Diárias às 08:00',
        nextNotification: 'Escalação: Após 7 dias',
        bgColor: 'bg-red-50',
        borderColor: 'border-l-red-500',
        titleColor: 'text-red-700'
      },
      {
        icon: '✅',
        title: 'Sistema Funcionando',
        description: '127 e-mails enviados hoje',
        lastNotification: 'Taxa de entrega: 99.2%',
        nextNotification: 'Última sincronização: 14:23',
        bgColor: 'bg-green-50',
        borderColor: 'border-l-green-500',
        titleColor: 'text-green-700'
      }
    ]
  
    return (
      <div className="bg-surface rounded-xl p-6 shadow-custom">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-primary-dark">
            Centro de Notificações
          </h3>
          <div className="flex gap-2">
            <button className="btn-secondary text-sm px-4 py-2">
              📧 Enviar Teste
            </button>
            <button className="btn-primary text-sm px-4 py-2">
              ⚙️ Configurar
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notifications.map((notification, index) => (
            <div
              key={index}
              className={`${notification.bgColor} ${notification.borderColor} border-l-4 rounded-lg p-6`}
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{notification.icon}</span>
                <div>
                  <div className={`font-semibold ${notification.titleColor}`}>
                    {notification.title}
                  </div>
                  <div className="text-sm text-text-secondary">
                    {notification.description}
                  </div>
                </div>
              </div>
              <div className="text-sm text-text-secondary space-y-1">
                <div>Última notificação: {notification.lastNotification}</div>
                <div>Próxima: {notification.nextNotification}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }