'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/layout/sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

interface Group {
  id: string
  name: string
  members: GroupMember[]
}

interface GroupMember {
  id: string
  email: string
  name: string
  role: string
}

interface User {
  id: string
  name: string
  email: string
}

export default function GruposPage() {
  const supabase = createClient()
  const [groups, setGroups] = useState<Group[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('')
  const [selectedRole, setSelectedRole] = useState('member')

  useEffect(() => { 
    fetchAll() 
  }, [])

  async function fetchAll() {
    setLoading(true)
    try {
      // Buscar grupos via API
      const token = await getAuthToken()
      console.log('🔑 Token obtido:', token ? 'Sim' : 'Não')
      
      if (!token) {
        console.error('❌ Token não encontrado')
        toast.error('Token de autenticação não encontrado. Faça login novamente.')
        return
      }

      const groupsResponse = await fetch('http://localhost:3001/api/groups', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('📡 Response status:', groupsResponse.status)
      
      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json()
        console.log('✅ Grupos carregados:', groupsData.data?.length || 0)
        setGroups(groupsData.data || [])
      } else {
        const errorData = await groupsResponse.json()
        console.error('❌ Erro ao buscar grupos:', groupsResponse.status, errorData)
        toast.error(`Erro ao carregar grupos: ${errorData.message || 'Erro desconhecido'}`)
      }

      // Buscar usuários
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, email')
        .order('name')

      if (usersError) {
        console.error('❌ Erro ao buscar usuários:', usersError)
        toast.error('Erro ao carregar usuários')
      } else {
        console.log('✅ Usuários carregados:', usersData?.length || 0)
        setUsers(usersData || [])
      }
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados')
    } finally {
      setLoading(false)
    }
  }

  async function getAuthToken() {
    const { data: { session } } = await supabase.auth.getSession()
    return session?.access_token
  }

  async function handleAddUserToGroup() {
    if (!selectedGroup || !newUserEmail.trim()) {
      toast.error('Selecione um grupo e informe um email')
      return
    }

    setLoading(true)
    try {
      const token = await getAuthToken()
      const response = await fetch('http://localhost:3001/api/groups/add-user', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_email: newUserEmail.trim(),
          group_id: selectedGroup,
          role: selectedRole
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(result.message)
        setNewUserEmail('')
        setSelectedGroup('')
        setSelectedRole('member')
        await fetchAll() // Recarregar dados
      } else {
        toast.error(result.message || 'Erro ao adicionar usuário')
      }
    } catch (error) {
      console.error('Erro ao adicionar usuário:', error)
      toast.error('Erro ao adicionar usuário ao grupo')
    } finally {
      setLoading(false)
    }
  }

  async function handleRemoveUserFromGroup(userEmail: string, groupId: string) {
    setLoading(true)
    try {
      const token = await getAuthToken()
      const response = await fetch('http://localhost:3001/api/groups/remove-user', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_email: userEmail,
          group_id: groupId
        })
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(result.message)
        await fetchAll() // Recarregar dados
      } else {
        toast.error(result.message || 'Erro ao remover usuário')
      }
    } catch (error) {
      console.error('Erro ao remover usuário:', error)
      toast.error('Erro ao remover usuário do grupo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <h1 className="text-3xl font-bold mb-8">Administração de Grupos</h1>
        
        {/* Seção para adicionar usuário */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Adicionar Usuário ao Grupo</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Email do usuário"
              value={newUserEmail}
              onChange={(e) => setNewUserEmail(e.target.value)}
              disabled={loading}
            />
            <select 
              value={selectedGroup} 
              onChange={(e) => {
                console.log('🎯 Grupo selecionado:', e.target.value)
                setSelectedGroup(e.target.value)
              }} 
              disabled={loading}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Selecione o grupo</option>
              {groups.map(group => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
            <select 
              value={selectedRole} 
              onChange={(e) => {
                console.log('🎯 Role selecionado:', e.target.value)
                setSelectedRole(e.target.value)
              }} 
              disabled={loading}
              className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="member">Membro</option>
              <option value="admin">Administrador</option>
            </select>
            <Button 
              onClick={handleAddUserToGroup} 
              disabled={loading || !newUserEmail.trim() || !selectedGroup}
            >
              {loading ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </div>
        </div>

        {loading && <div className="mb-4 text-blue-600">Carregando...</div>}
        
        {/* Lista de grupos */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {groups.map(group => (
            <div key={group.id} className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold mb-4">{group.name}</h2>
              
              {group.members.length === 0 ? (
                <p className="text-gray-500 italic">Nenhum membro neste grupo</p>
              ) : (
                <ul className="space-y-2">
                  {group.members.map(member => (
                    <li key={member.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                      <div>
                        <span className="font-medium">{member.name || member.email}</span>
                        <span className="text-sm text-gray-500 ml-2">({member.role})</span>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRemoveUserFromGroup(member.email, group.id)}
                        disabled={loading}
                      >
                        Remover
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
} 