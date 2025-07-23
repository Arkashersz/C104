'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { generateProcessNumber } from '@/lib/utils'

interface BiddingProcessFormProps {
    onSuccess?: () => void
}

export function BiddingProcessForm({ onSuccess }: BiddingProcessFormProps) {
    const [isLoading, setIsLoading] = useState(false);
    const supabase = createClient();
    const [formData, setFormData] = useState({
        process_number: generateProcessNumber(),
        title: 'Contratação de empresa especializada para fornecimento e instalação de sistema de segurança eletrônica',
        estimated_value: 500000.00,
        current_status_id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef' // ID Fixo para o exemplo, substitua por um seletor dinâmico
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error('Usuário não autenticado. Faça o login para continuar.');
            }
            const token = session.access_token;

            const response = await fetch('http://localhost:3001/api/bidding', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Falha ao criar o processo de licitação.');
            }

            onSuccess?.();

        } catch (error) {
            console.error(error);
            alert(error instanceof Error ? error.message : 'Ocorreu um erro desconhecido.');
        } finally {
            setIsLoading(false);
        }
    }

    const updateField = (field: string, value: string | number) => {
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
                            value={formData.process_number}
                            onChange={(e) => updateField('process_number', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-transparent"
                            placeholder="LIC-2025-001"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Objeto da Licitação *
                    </label>
                    <textarea
                        value={formData.title}
                        onChange={(e) => updateField('title', e.target.value)}
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
                            type="number"
                            value={formData.estimated_value}
                            onChange={(e) => updateField('estimated_value', parseFloat(e.target.value))}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-transparent"
                            placeholder="0,00"
                        />
                    </div>
                </div>

                {/* Botões de ação */}
                <div className="flex justify-end space-x-4 pt-8 border-t-2 border-gray-100">
                    <button
                        type="button"
                        onClick={() => onSuccess?.()}
                        className="px-8 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                        disabled={isLoading}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="px-8 py-3 bg-primary-medium text-white rounded-lg font-medium hover:bg-primary-dark transition-colors flex items-center gap-2"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Iniciando...' : '🚀 Iniciar Processo'}
                    </button>
                </div>
            </form>
        </div>
    )
}