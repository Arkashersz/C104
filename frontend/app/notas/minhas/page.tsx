'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Sidebar } from '@/components/layout/sidebar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

interface NoteItem {
  id: string
  title: string
  created_at: string
}

export default function MinhasNotasPage() {
  const [notes, setNotes] = useState<NoteItem[]>([])
  const supabase = createClient()

  useEffect(() => {
    const fetchNotes = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('notes')
        .select('id, title, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!error && data) setNotes(data as NoteItem[])
    }
    fetchNotes()
  }, [supabase])

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <h1 className="text-3xl font-bold mb-6">Minhas Notas</h1>

        {notes.length === 0 ? (
          <p className="text-muted-foreground">Nenhuma nota salva ainda.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map((note) => (
              <Link key={note.id} href={`/notas/${note.id}`} className="block">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg truncate">{note.title || 'Sem título'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">{new Date(note.created_at).toLocaleString('pt-BR')}</p>
                    <p className="text-sm text-primary-medium mt-2">Clique para visualizar</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
} 