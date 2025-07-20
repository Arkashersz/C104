import { useState } from 'react'

interface BiddingProcessFormProps {
    onSuccess?: () => void
}

export function BiddingProcessForm({ onSuccess }: BiddingProcessFormProps) {
    const [formData, setFormData] = useState({
        processNumber: 'LIC-2025-003',
        modality: 'pregao-eletronico',
        object: 'Contratação de empresa especializada para fornecimento e instalação de sistema de segurança eletrônica',
        estimatedValue: '500.000,00',
        executionDeadline: '120 dias'
    })

    const workflowSteps = [
        {
            id: 1,
            title: 'Elaboração',
            responsible: 'Maria Santos',
            notification: 'Notificação diária',
            borderColor: 'border-l-primary-medium'
        },
        {
            id: 2,
            title: 'Aprovação Jurídica',
            responsible: 'Dr. Carlos Lima',
            notification: 'Notificação diária',
            borderColor: 'border-l-accent-dark'
        },
        {
            id: 3,
            title: 'Publicação',
            responsible: 'João Silva',
            notification: 'Notificação diária',
            borderColor: 'border-l-primary-light'
        },
        {
            id: 4,
            title: 'Sessão Pública',
            responsible: 'Ana Costa',
            notification: 'Notificação diária',
            borderColor: 'border-l-green-500'
        }
    ]

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // Simular salvamento
        setTimeout(() => {
            onSuccess?.()
        }, 1000)
    }

    return (
        <div className="bg-surface rounded-xl p-8 shadow-custom border max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8 pb-6 border-b-2 border-background">
                <div>
                    <h3 className="text-2xl font-semibold text-primary-dark">
                        Novo Processo Licitatório
                    </h3>
                    <p className="text-text-secondary mt-1">
                        Configuração de workflow
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Número do Processo *
                        </label>
                        <input
                            type="text"
                            value={formData.processNumber}
                            onChange={(e) => setFormData(prev => ({ ...prev, processNumber: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-transparent"
                            placeholder="LIC-2025-001"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Modalidade *
                        </label>
                        <select
                            value={formData.modality}
                            onChange={(e) => setFormData(prev => ({ ...prev, modality: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-transparent"
                        >
                            <option value="concorrencia">Concorrência</option>
                            <option value="pregao-eletronico">Pregão Eletrônico</option>
                            <option value="tomada-precos">Tomada de Preços</option>
                            <option value="convite">Convite</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Objeto da Licitação *
                    </label>
                    <textarea
                        value={formData.object}
                        onChange={(e) => setFormData(prev => ({ ...prev, object: e.target.value }))}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-