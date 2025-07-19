// app/page.tsx
'use client'

import { useState } from 'react'
import { ContractForm } from '@/components/forms/contract-form'
import { Sidebar } from '@/components/layout/sidebar'
import { Button } from '@/components/ui/button'
import { Plus, FileText, AlertCircle, CheckCircle } from 'lucide-react'

export default function HomePage() {
  const [showForm, setShowForm] = useState(false)

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-primary-dark mb-2">
              📋 Sistema de Gestão de Contratos
            </h1>
            <p className="text-gray-600">
              Gerencie contratos e licitações de forma eficiente
            </p>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Sistema Funcionando</h3>
                  <p className="text-sm text-gray-600">Todos os componentes carregados</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Contratos</h3>
                  <p className="text-sm text-gray-600">Pronto para cadastro</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Configure</h3>
                  <p className="text-sm text-gray-600">Supabase para salvar dados</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  Teste o Sistema
                </h2>
                <p className="text-gray-600">
                  Clique no botão abaixo para testar o formulário de contratos
                </p>
              </div>
              <Button 
                onClick={() => setShowForm(!showForm)}
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>{showForm ? 'Fechar Formulário' : 'Novo Contrato'}</span>
              </Button>
            </div>
          </div>

          {/* Form */}
          {showForm && (
            <div className="animate-fade-in">
              <ContractForm 
                onSuccess={() => {
                  setShowForm(false)
                  console.log('Formulário testado com sucesso!')
                }}
              />
            </div>
          )}

          {/* Instructions */}
          {!showForm && (
            <div className="bg-gradient-to-r from-primary-dark to-primary-medium text-white rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-3">🚀 Próximos Passos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">1. Configure o Supabase:</h4>
                  <ul className="space-y-1 text-white/90">
                    <li>• Crie uma conta no Supabase</li>
                    <li>• Execute o schema SQL fornecido</li>
                    <li>• Configure as variáveis de ambiente</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium mb-2">2. Teste as Funcionalidades:</h4>
                  <ul className="space-y-1 text-white/90">
                    <li>• Formulário de contratos</li>
                    <li>• Validações em tempo real</li>
                    <li>• Interface responsiva</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}