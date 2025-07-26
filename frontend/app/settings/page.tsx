'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/layout/sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface UserProfile {
  id: string
  email: string
  name: string
  created_at: string
}

interface UserGroup {
  id: string
  name: string
  role: string
}

export default function SettingsPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [userGroups, setUserGroups] = useState<UserGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [editingEmail, setEditingEmail] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: ''
  })

  useEffect(() => {
    fetchProfile()
    fetchUserGroups()
  }, [])

  async function fetchProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Buscar dados do perfil do usuário
        const { data: profileData } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileData) {
          setProfile(profileData)
          setFormData({
            name: profileData.name || '',
            email: profileData.email || user.email || ''
          })
        } else {
          // Criar perfil se não existir
          const { data: newProfile } = await supabase
            .from('users')
            .insert([{
              id: user.id,
              email: user.email,
              name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário'
            }])
            .select()
            .single()

          if (newProfile) {
            setProfile(newProfile)
            setFormData({
              name: newProfile.name,
              email: newProfile.email
            })
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
      toast.error('Erro ao carregar perfil')
    }
  }

  async function fetchUserGroups() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Buscar grupos do usuário
        const { data: groups } = await supabase
          .from('user_groups')
          .select(`
            id,
            groups (
              id,
              name
            )
          `)
          .eq('user_id', user.id)

        if (groups) {
          const formattedGroups = groups.map((ug: any) => ({
            id: ug.id,
            name: ug.groups.name,
            role: ug.role || 'Membro'
          }))
          setUserGroups(formattedGroups)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar grupos:', error)
    }
  }

  async function updateName() {
    if (!formData.name.trim()) {
      toast.error('O nome não pode estar vazio')
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { error } = await supabase
          .from('users')
          .update({
            name: formData.name.trim()
          })
          .eq('id', user.id)

        if (error) throw error

        setProfile(prev => prev ? { ...prev, name: formData.name.trim() } : null)
        setEditingName(false)
        toast.success('Nome de exibição atualizado com sucesso')
      }
    } catch (error) {
      console.error('Erro ao atualizar nome:', error)
      toast.error('Erro ao atualizar nome')
    } finally {
      setLoading(false)
    }
  }

  async function updateEmail() {
    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast.error('Digite um email válido')
      return
    }

    if (formData.email === profile?.email) {
      toast.error('O novo email deve ser diferente do atual')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({
        email: formData.email.trim()
      })

      if (error) throw error

      setEditingEmail(false)
      toast.success('Email atualizado com sucesso. Verifique sua caixa de entrada para confirmar.')
    } catch (error) {
      console.error('Erro ao alterar email:', error)
      toast.error('Erro ao alterar email')
    } finally {
      setLoading(false)
    }
  }

  async function changePassword() {
    const newPassword = prompt('Digite sua nova senha (mínimo 6 caracteres):')
    if (newPassword && newPassword.length >= 6) {
      try {
        const { error } = await supabase.auth.updateUser({
          password: newPassword
        })

        if (error) throw error

        toast.success('Senha alterada com sucesso')
      } catch (error) {
        console.error('Erro ao alterar senha:', error)
        toast.error('Erro ao alterar senha')
      }
    } else if (newPassword) {
      toast.error('A senha deve ter pelo menos 6 caracteres')
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <h1 className="text-3xl font-bold mb-8">Configurações</h1>
        
        <div className="max-w-2xl space-y-8">
          {/* Perfil do Usuário */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-6">Perfil do Usuário</h2>

            {profile && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={!editingEmail}
                      className={editingEmail ? '' : 'bg-gray-50'}
                    />
                    {editingEmail ? (
                      <div className="flex gap-2">
                        <Button
                          onClick={updateEmail}
                          disabled={loading}
                          size="sm"
                        >
                          {loading ? 'Salvando...' : 'Salvar'}
                        </Button>
                        <Button
                          onClick={() => {
                            setEditingEmail(false)
                            setFormData({ ...formData, email: profile.email })
                          }}
                          variant="outline"
                          size="sm"
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setEditingEmail(true)}
                        variant="outline"
                        size="sm"
                      >
                        Editar
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Nome de Exibição</label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={!editingName}
                      className={editingName ? '' : 'bg-gray-50'}
                    />
                    {editingName ? (
                      <div className="flex gap-2">
                        <Button
                          onClick={updateName}
                          disabled={loading}
                          size="sm"
                        >
                          {loading ? 'Salvando...' : 'Salvar'}
                        </Button>
                        <Button
                          onClick={() => {
                            setEditingName(false)
                            setFormData({ ...formData, name: profile.name })
                          }}
                          variant="outline"
                          size="sm"
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={() => setEditingName(true)}
                        variant="outline"
                        size="sm"
                      >
                        Editar
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Senha</label>
                  <Button
                    onClick={changePassword}
                    variant="outline"
                  >
                    Alterar Senha
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Informações da Conta */}
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-xl font-semibold mb-6">Informações da Conta</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Data de Criação</label>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-sm text-gray-600">
                    {profile?.created_at ? formatDate(profile.created_at) : 'Não disponível'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Grupos que Pertence</label>
                <div className="space-y-2">
                  {userGroups.length > 0 ? (
                    userGroups.map((group) => (
                      <div key={group.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{group.name}</span>
                          <span className="text-sm text-gray-600 bg-gray-200 px-2 py-1 rounded">
                            {group.role}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <span className="text-sm text-gray-600">Nenhum grupo atribuído</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">ID da Conta</label>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-sm text-gray-600 font-mono">
                    {profile?.id || 'Não disponível'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
} 