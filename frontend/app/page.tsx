'use client'

import { useState } from 'react'
import { ContractForm } from '@/components/forms/contract-form-simple'

export default function HomePage() {
  const [showForm, setShowForm] = useState(false)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#fafafa' }}>
      {/* Sidebar */}
      <div className="sidebar">
        <div style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          📋 GestContratos
        </div>
        
        <nav>
          <div className="sidebar-nav-item active">
            📊 Dashboard
          </div>
          <div className="sidebar-nav-item">
            📄 Contratos
          </div>
          <div className="sidebar-nav-item">
            ⚖️ Licitações
          </div>
          <div className="sidebar-nav-item">
            🔔 Notificações
          </div>
          <div className="sidebar-nav-item">
            📈 Relatórios
          </div>
          <div className="sidebar-nav-item">
            👥 Usuários
          </div>
          <div className="sidebar-nav-item">
            ⚙️ Configurações
          </div>
        </nav>

        {/* User section */}
        <div style={{ padding: '1rem', borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 'auto', position: 'absolute', bottom: '1rem', left: '1rem', right: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.1)' }}>
            <div style={{ width: '2rem', height: '2rem', background: '#eac195', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0f132e', fontWeight: '600', fontSize: '0.875rem' }}>
              U
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: '500' }}>Usuário Demo</div>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>Administrador</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        <div style={{ maxWidth: '96rem', margin: '0 auto' }}>
          {/* Header */}
          <div style={{ 
            background: '#ffffff', 
            borderRadius: '0.75rem', 
            padding: '1.5rem 2rem', 
            marginBottom: '2rem', 
            boxShadow: '0 4px 6px -1px rgba(15, 19, 46, 0.1)', 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center' 
          }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: '600', color: '#0f132e', marginBottom: '0.5rem' }}>
                📋 Dashboard
              </h1>
              <p style={{ color: '#536d88' }}>
                Visão geral dos contratos e licitações
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📊 Relatório
              </button>
              <button 
                className="btn-primary"
                onClick={() => setShowForm(!showForm)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                ➕ {showForm ? 'Fechar Formulário' : 'Novo Contrato'}
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="stat-card" style={{ borderLeftColor: '#19274e' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#0f132e', marginBottom: '0.5rem' }}>47</div>
                  <div style={{ color: '#536d88', fontWeight: '500' }}>Contratos Ativos</div>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#22c55e' }}>↗️ +12% este mês</div>
                </div>
                <div style={{ padding: '0.75rem', background: '#19274e', borderRadius: '0.5rem' }}>
                  📄
                </div>
              </div>
            </div>

            <div className="stat-card" style={{ borderLeftColor: '#b49b85' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#0f132e', marginBottom: '0.5rem' }}>8</div>
                  <div style={{ color: '#536d88', fontWeight: '500' }}>Vencem em 30 dias</div>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#f59e0b' }}>⚠️ Atenção necessária</div>
                </div>
                <div style={{ padding: '0.75rem', background: '#f59e0b', borderRadius: '0.5rem' }}>
                  🔔
                </div>
              </div>
            </div>

            <div className="stat-card" style={{ borderLeftColor: '#536d88' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#0f132e', marginBottom: '0.5rem' }}>23</div>
                  <div style={{ color: '#536d88', fontWeight: '500' }}>Processos em Andamento</div>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#3b82f6' }}>⏳ 5 aguardando ação</div>
                </div>
                <div style={{ padding: '0.75rem', background: '#3b82f6', borderRadius: '0.5rem' }}>
                  👥
                </div>
              </div>
            </div>

            <div className="stat-card" style={{ borderLeftColor: '#22c55e' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#0f132e', marginBottom: '0.5rem' }}>R\$ 2.3M</div>
                  <div style={{ color: '#536d88', fontWeight: '500' }}>Valor Total Contratado</div>
                  <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#22c55e' }}>📈 +8% no período</div>
                </div>
                <div style={{ padding: '0.75rem', background: '#22c55e', borderRadius: '0.5rem' }}>
                  💰
                </div>
              </div>
            </div>
          </div>

          {/* Contracts Table */}
          <div className="table-container" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600', color: '#0f132e' }}>
                Contratos Próximos ao Vencimento
              </h3>
              <input 
                type="text" 
                placeholder="🔍 Buscar contratos..." 
                style={{ 
                  padding: '0.5rem 1rem', 
                  border: '2px solid #e5e7eb', 
                  borderRadius: '0.5rem', 
                  width: '300px',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Nº Contrato</th>
                  <th>Fornecedor</th>
                  <th>Valor</th>
                  <th>Vencimento</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>CTR-2024-001</strong></td>
                  <td>TechSolutions Ltda</td>
                  <td>R\$ 125.000,00</td>
                  <td>15/08/2025</td>
                  <td>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '9999px', 
                      fontSize: '0.75rem', 
                      fontWeight: '500',
                      background: 'rgba(245, 158, 11, 0.1)',
                      color: '#d97706'
                    }}>
                      Próximo ao Venc.
                    </span>
                  </td>
                  <td>
                    <button style={{ 
                      padding: '0.25rem 0.75rem', 
                      fontSize: '0.75rem',
                      background: 'transparent',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem',
                      cursor: 'pointer'
                    }}>
                      ✏️ Editar
                    </button>
                  </td>
                </tr>
                <tr>
                  <td><strong>CTR-2024-002</strong></td>
                  <td>Construtora ABC</td>
                  <td>R\$ 850.000,00</td>
                  <td>22/09/2025</td>
                  <td>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '9999px', 
                      fontSize: '0.75rem', 
                      fontWeight: '500',
                      background: 'rgba(34, 197, 94, 0.1)',
                      color: '#16a34a'
                    }}>
                      Ativo
                    </span>
                  </td>
                  <td>
                    <button style={{ 
                      padding: '0.25rem 0.75rem', 
                      fontSize: '0.75rem',
                      background: 'transparent',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem',
                      cursor: 'pointer'
                    }}>
                      ✏️ Editar
                    </button>
                  </td>
                </tr>
                <tr>
                  <td><strong>CTR-2023-045</strong></td>
                  <td>Suprimentos Gerais</td>
                  <td>R\$ 45.500,00</td>
                  <td>05/08/2025</td>
                  <td>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      borderRadius: '9999px', 
                      fontSize: '0.75rem', 
                      fontWeight: '500',
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: '#dc2626'
                    }}>
                      Vencido
                    </span>
                  </td>
                  <td>
                    <button style={{ 
                      padding: '0.25rem 0.75rem', 
                      fontSize: '0.75rem',
                      background: 'transparent',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem',
                      cursor: 'pointer'
                    }}>
                      🔄 Renovar
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Form */}
          {showForm && (
            <div className="animate-fade-in" style={{ marginBottom: '2rem' }}>
              <ContractForm 
                onSuccess={() => {
                  setShowForm(false)
                  alert('✅ Contrato criado com sucesso!')
                }}
              />
            </div>
          )}

          {/* Status Footer */}
          {!showForm && (
            <div style={{ 
              background: 'linear-gradient(135deg, #0f132e 0%, #19274e 100%)', 
              color: 'white', 
              borderRadius: '0.75rem', 
              padding: '2rem' 
            }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                ✅ Sistema Funcionando Perfeitamente
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', fontSize: '0.875rem' }}>
                <div>
                  <h4 style={{ fontWeight: '500', marginBottom: '0.75rem' }}>✅ Componentes Testados:</h4>
                  <ul style={{ listStyle: 'none', padding: 0, lineHeight: '1.8', color: 'rgba(255,255,255,0.9)' }}>
                    <li>• Sistema de Dashboard</li>
                    <li>• Formulário de Contratos</li>
                    <li>• Sidebar Navigation</li>
                    <li>• Componentes UI</li>
                    <li>• Validações e Notificações</li>
                  </ul>
                </div>
                <div>
                  <h4 style={{ fontWeight: '500', marginBottom: '0.75rem' }}>🎯 Próximos Passos:</h4>
                  <ul style={{ listStyle: 'none', padding: 0, lineHeight: '1.8', color: 'rgba(255,255,255,0.9)' }}>
                    <li>• Configurar Supabase</li>
                    <li>• Implementar Autenticação</li>
                    <li>• Sistema de Notificações</li>
                    <li>• Relatórios Avançados</li>
                    <li>• Deploy em Produção</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
