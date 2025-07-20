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

    const updateField = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
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
                            onChange={(e) => updateField('processNumber', e.target.value)}
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
                            onChange={(e) => updateField('modality', e.target.value)}
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
                        onChange={(e) => updateField('object', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-transparent"
                        placeholder="Descrição detalhada do objeto"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Valor Estimado (R$)
                        </label>
                        <input
                            type="text"
                            value={formData.estimatedValue}
                            onChange={(e) => updateField('estimatedValue', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-transparent"
                            placeholder="0,00"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Prazo de Execução
                        </label>
                        <input
                            type="text"
                            value={formData.executionDeadline}
                            onChange={(e) => updateField('executionDeadline', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-transparent"
                            placeholder="Ex: 90 dias"
                        />
                    </div>
                </div>

                {/* Workflow de Status */}
                <div className="mt-8">
                    <label className="block text-sm font-semibold text-gray-700 mb-4">
                        Workflow de Status
                    </label>
                    <div className="bg-background border-radius-8 p-6 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            {workflowSteps.map((step) => (
                                <div
                                    key={step.id}
                                    className={`bg-surface rounded-lg p-4 border-l-4 ${step.borderColor} shadow-sm`}
                                >
                                    <div className="font-semibold text-gray-800 mb-2">
                                        {step.id}. {step.title}
                                    </div>
                                    <div className="text-sm text-text-secondary mb-1">
                                        Responsável: {step.responsible}
                                    </div>
                                    <div className="text-xs text-text-secondary">
                                        📧 {step.notification}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                            <div className="font-semibold text-green-700 mb-2 flex items-center gap-2">
                                <span>✅</span>
                                Sistema de Notificações Automáticas
                            </div>
                            <div className="text-sm text-text-secondary space-y-1">
                                <div>• E-mails diários para responsáveis de processos pendentes</div>
                                <div>• Escalação automática após prazo limite</div>
                                <div>• Dashboard em tempo real com status atual</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Seção de documentos */}
                <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-4">
                        📎 Documentos do Processo
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
                        <div className="text-gray-500">
                            <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <p className="text-sm">
                                Arraste arquivos aqui ou{' '}
                                <span className="text-blue-500 hover:text-blue-600 cursor-pointer font-semibold">
                                    clique para selecionar
                                </span>
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                PDF, DOC, DOCX até 10MB
                            </p>
                        </div>
                    </div>
                </div>

                {/* Configurações de Notificação */}
                <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-4">
                        🔔 Configurações de Notificação
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="flex items-center space-x-3 bg-white p-4 rounded-lg border hover:bg-blue-50 cursor-pointer transition-colors">
                                <input
                                    type="checkbox"
                                    defaultChecked
                                    className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                                />
                                <div>
                                    <span className="font-medium text-gray-700">Notificações Diárias</span>
                                    <p className="text-sm text-gray-500">E-mail diário para responsáveis</p>
                                </div>
                            </label>
                        </div>

                        <div>
                            <label className="flex items-center space-x-3 bg-white p-4 rounded-lg border hover:bg-blue-50 cursor-pointer transition-colors">
                                <input
                                    type="checkbox"
                                    defaultChecked
                                    className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                                />
                                <div>
                                    <span className="font-medium text-gray-700">Escalação Automática</span>
                                    <p className="text-sm text-gray-500">Após 7 dias sem ação</p>
                                </div>
                            </label>
                        </div>

                        <div>
                            <label className="flex items-center space-x-3 bg-white p-4 rounded-lg border hover:bg-blue-50 cursor-pointer transition-colors">
                                <input
                                    type="checkbox"
                                    defaultChecked
                                    className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                                />
                                <div>
                                    <span className="font-medium text-gray-700">Notificações de Prazo</span>
                                    <p className="text-sm text-gray-500">Alertas de vencimento</p>
                                </div>
                            </label>
                        </div>

                        <div>
                            <label className="flex items-center space-x-3 bg-white p-4 rounded-lg border hover:bg-blue-50 cursor-pointer transition-colors">
                                <input
                                    type="checkbox"
                                    defaultChecked
                                    className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                                />
                                <div>
                                    <span className="font-medium text-gray-700">Dashboard em Tempo Real</span>
                                    <p className="text-sm text-gray-500">Atualização automática</p>
                                </div>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Botões de ação */}
                <div className="flex justify-end space-x-4 pt-8 border-t-2 border-gray-100">
                    <button
                        type="button"
                        onClick={() => onSuccess?.()}
                        className="px-8 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="px-8 py-3 bg-primary-medium text-white rounded-lg font-medium hover:bg-primary-dark transition-colors flex items-center gap-2"
                    >
                        🚀 Iniciar Processo
                    </button>
                </div>
            </form>
        </div>
    )
}