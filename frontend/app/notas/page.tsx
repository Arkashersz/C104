'use client'
import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'
import { 
  Save, 
  FileText, 
  Trash2, 
  Plus,
  Calendar,
  Clock
} from 'lucide-react'

interface Note {
  id: string
  title: string
  content: string
  created_at: string
  updated_at: string
  user_id: string
}

export default function NotasPage() {
  const supabase = createClient()
  const [notes, setNotes] = useState<Note[]>([])
  const [currentNote, setCurrentNote] = useState<Note | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Carregar notas do usuário
  useEffect(() => {
    fetchNotes()
  }, [])

  async function fetchNotes() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('user_notes')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) {
        console.error('Erro ao buscar notas:', error)
        return
      }

      setNotes(data || [])
    } catch (error) {
      console.error('Erro ao carregar notas:', error)
    }
  }

  async function createNote() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const newNote = {
        title: 'Nova Nota',
        content: '<p>Digite seu conteúdo aqui...</p>',
        user_id: user.id
      }

      const { data, error } = await supabase
        .from('user_notes')
        .insert([newNote])
        .select()
        .single()

      if (error) {
        console.error('Erro ao criar nota:', error)
        return
      }

      setNotes(prev => [data, ...prev])
      setCurrentNote(data)
      setIsEditing(true)
    } catch (error) {
      console.error('Erro ao criar nota:', error)
    }
  }

  async function saveNote() {
    if (!currentNote) return

    try {
      setLoading(true)
      const { error } = await supabase
        .from('user_notes')
        .update({
          title: currentNote.title,
          content: currentNote.content,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentNote.id)

      if (error) {
        console.error('Erro ao salvar nota:', error)
        return
      }

      setNotes(prev => 
        prev.map(note => 
          note.id === currentNote.id 
            ? { ...currentNote, updated_at: new Date().toISOString() }
            : note
        )
      )
      setIsEditing(false)
    } catch (error) {
      console.error('Erro ao salvar nota:', error)
    } finally {
      setLoading(false)
    }
  }

  async function deleteNote(noteId: string) {
    try {
      const { error } = await supabase
        .from('user_notes')
        .delete()
        .eq('id', noteId)

      if (error) {
        console.error('Erro ao deletar nota:', error)
        return
      }

      setNotes(prev => prev.filter(note => note.id !== noteId))
      if (currentNote?.id === noteId) {
        setCurrentNote(null)
        setIsEditing(false)
      }
    } catch (error) {
      console.error('Erro ao deletar nota:', error)
    }
  }

  function selectNote(note: Note) {
    setCurrentNote(note)
    setIsEditing(false)
  }

  const filteredNotes = notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Bloco de Notas</h1>
          <p className="text-gray-600 mt-2">Crie e gerencie suas anotações pessoais</p>
        </div>
        <Button onClick={createNote} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nova Nota
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Lista de Notas */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Minhas Notas
              </CardTitle>
              <Input
                placeholder="Buscar notas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-2"
              />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      currentNote?.id === note.id
                        ? 'bg-blue-50 border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => selectNote(note)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm text-gray-900 truncate">
                          {note.title}
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(note.updated_at).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          deleteNote(note.id)
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {filteredNotes.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-8 w-8 mx-auto mb-2" />
                    <p>Nenhuma nota encontrada</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Editor/Visualizador */}
        <div className="lg:col-span-3">
          <Card>
            <CardContent className="p-6">
              {currentNote ? (
                <div>
                  {isEditing ? (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <Input
                          value={currentNote.title}
                          onChange={(e) => setCurrentNote(prev => prev ? { ...prev, title: e.target.value } : null)}
                          className="text-xl font-semibold border-none p-0 focus:ring-0"
                          placeholder="Título da nota"
                        />
                        <div className="flex items-center gap-2">
                          <Button onClick={saveNote} disabled={loading} className="flex items-center gap-2">
                            <Save className="h-4 w-4" />
                            {loading ? 'Salvando...' : 'Salvar'}
                          </Button>
                          <Button variant="outline" onClick={() => setIsEditing(false)}>
                            Cancelar
                          </Button>
                        </div>
                      </div>

                      {/* Editor de Conteúdo */}
                      <textarea
                        value={currentNote?.content.replace(/<[^>]*>/g, '') || ''}
                        onChange={(e) => {
                          if (currentNote) {
                            setCurrentNote(prev => prev ? { ...prev, content: e.target.value } : null);
                          }
                        }}
                        className="w-full h-96 p-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                        placeholder="Digite seu conteúdo aqui..."
                        style={{ 
                          fontFamily: 'inherit',
                          lineHeight: '1.6',
                          direction: 'ltr',
                          textAlign: 'left'
                        }}
                      />
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">
                          {currentNote.title}
                        </h2>
                        <Button onClick={() => setIsEditing(true)} className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Editar
                        </Button>
                      </div>
                      <div 
                        className="prose max-w-none"
                        dangerouslySetInnerHTML={{ __html: currentNote.content }}
                      />
                    </>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500 pt-4 border-t">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Criado: {new Date(currentNote.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Atualizado: {new Date(currentNote.updated_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Selecione uma nota
                  </h3>
                  <p className="text-gray-600">
                    Escolha uma nota da lista ou crie uma nova para começar
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 