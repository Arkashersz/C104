// frontend/components/layout/sidebar.tsx
'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  LayoutDashboard,
  FileText,
  Gavel,
  Bell,
  BarChart2,
  Users,
  Settings,
  LogOut,
  StickyNote
} from 'lucide-react'

// Componente para os links de navegação
const NavLink = ({ href, icon, label }: { href: string, icon: React.ReactNode, label: string }) => {
  const pathname = usePathname()
  const isActive = pathname === href
  return (
    <Link
      href={href}
      className={`group flex items-center space-x-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
        isActive
          ? 'bg-accent-light text-primary-dark shadow-md transform translate-x-1'
          : 'text-white/80 hover:bg-white/10 hover:text-white'
      }`}
    >
      <div className="transition-transform duration-200 group-hover:scale-110">
        {icon}
      </div>
      <span>{label}</span>
    </Link>
  )
}

// Componente para o perfil do usuário
function UserProfile() {
  const router = useRouter()
  const supabase = createClient()
  const [userName, setUserName] = useState('')

  useEffect(() => {
    const fetchUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            // Buscar nome de exibição do usuário
            try {
                const { data: profileData } = await supabase
                    .from('users')
                    .select('name')
                    .eq('id', user.id)
                    .single()

                if (profileData && profileData.name) {
                    setUserName(profileData.name)
                } else {
                    // Fallback para email se não houver nome
                    setUserName(user.email?.split('@')[0] || 'Usuário')
                }
            } catch (error) {
                // Fallback para email se houver erro
                setUserName(user.email?.split('@')[0] || 'Usuário')
            }
        }
    }
    fetchUser()
  }, [supabase])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth')
  }

  return (
      <div className="absolute bottom-0 left-0 w-full p-4">
        <div className="p-2 rounded-lg bg-white/5">
            <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-accent-light rounded-full flex items-center justify-center text-primary-dark font-semibold text-sm">
                    {userName ? userName.charAt(0).toUpperCase() : '?'}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{userName}</p>
                </div>
            </div>
        </div>
         <button
            onClick={handleLogout}
            className="flex w-full items-center space-x-3 px-4 py-3 mt-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-colors"
        >
            <LogOut size={20} />
            <span className="font-medium text-sm">Sair</span>
        </button>
      </div>
  )
}

// Componente principal da Sidebar
export function Sidebar() {
  const navItems = [
    { href: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { href: '/processos', icon: <FileText size={20} />, label: 'Processos' },
    { href: '/grupos', icon: <Users size={20} />, label: 'Grupos' },
    { href: '/notas', icon: <StickyNote size={20} />, label: 'Notas' },
    { href: '/notifications', icon: <Bell size={20} />, label: 'Notificações' },
    { href: '/settings', icon: <Settings size={20} />, label: 'Configurações' },
  ]

  return (
    <aside className="fixed top-0 left-0 w-64 h-full bg-gradient-to-b from-primary-dark to-primary-medium text-white z-10">
      <div className="flex items-center justify-center h-20 border-b border-white/10">
        <h1 className="text-2xl font-bold tracking-wider">C104</h1>
      </div>

      <nav className="p-4">
        <div className="flex flex-col space-y-2">
            {navItems.map((item) => (
            <NavLink key={item.href} {...item} />
            ))}
        </div>
      </nav>

      <UserProfile />
    </aside>
  )
}