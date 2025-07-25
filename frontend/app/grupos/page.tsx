'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Sidebar } from '@/components/layout/sidebar'
import { Button } from '@/components/ui/button'

export default function GruposPage() {
  const supabase = createClient()
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([])
  const [users, setUsers] = useState<{ id: string; name: string; email: string }[]>([])
  const [groupUsers, setGroupUsers] = useState<Record<string, string[]>>({}) // group_id -> [user_id]
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    const { data: groupsData } = await supabase.from('groups').select('*').order('name')
    const { data: usersData } = await supabase.from('users').select('id, name, email').order('name')
    const { data: groupUsersData } = await supabase.from('group_users').select('*')
    setGroups(groupsData || [])
    setUsers(usersData || [])
    const map: Record<string, string[]> = {}
    for (const gu of groupUsersData || []) {
      if (!map[gu.group_id]) map[gu.group_id] = []
      map[gu.group_id].push(gu.user_id)
    }
    setGroupUsers(map)
    setLoading(false)
  }

  async function handleToggleUser(groupId: string, userId: string) {
    setLoading(true)
    const isMember = groupUsers[groupId]?.includes(userId)
    if (isMember) {
      await supabase.from('group_users').delete().eq('group_id', groupId).eq('user_id', userId)
    } else {
      await supabase.from('group_users').insert({ group_id: groupId, user_id: userId })
    }
    await fetchAll()
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <h1 className="text-3xl font-bold mb-8">Administração de Grupos</h1>
        {loading && <div className="mb-4 text-blue-600">Carregando...</div>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {groups.map(group => (
            <div key={group.id} className="bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold mb-4">{group.name}</h2>
              <ul>
                {users.map(user => (
                  <li key={user.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <span>{user.name || user.email}</span>
                    <Button
                      size="sm"
                      variant={groupUsers[group.id]?.includes(user.id) ? 'primary' : 'outline'}
                      onClick={() => handleToggleUser(group.id, user.id)}
                      disabled={loading}
                    >
                      {groupUsers[group.id]?.includes(user.id) ? 'Remover' : 'Adicionar'}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
} 