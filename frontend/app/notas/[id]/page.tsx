'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Sidebar } from '@/components/layout/sidebar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'

const Editor = dynamic<any>(() => import('@tinymce/tinymce-react').then(m => m.Editor as any), { ssr: false })

interface NoteItem {
  id: string
  title: string
  content: string
  created_at: string
}

export default function NotaDetalhePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = createClient()
  const [note, setNote] = useState<NoteItem | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [titleInput, setTitleInput] = useState('')
  const [contentInput, setContentInput] = useState('')
  const apiKey = process.env.NEXT_PUBLIC_TINYMCE_API_KEY || ''

  useEffect(() => {
    const fetchNote = async () => {
      const id = params?.id
      if (!id) return
      const { data, error } = await supabase
        .from('notes')
        .select('id, title, content, created_at')
        .eq('id', id)
        .single()
      if (!error && data) {
        setNote(data as NoteItem)
        setTitleInput((data as NoteItem).title || '')
        setContentInput((data as NoteItem).content || '')
      }
    }
    fetchNote()
  }, [params?.id, supabase])

  const handleDelete = async () => {
    if (!note) return
    const confirmed = confirm('Deseja realmente excluir esta nota?')
    if (!confirmed) return
    const { error } = await supabase.from('notes').delete().eq('id', note.id)
    if (error) {
      toast.error('Não foi possível excluir a nota')
      return
    }
    toast.success('Nota excluída')
    router.push('/notas/minhas')
  }

  const handleSaveEdit = async () => {
    if (!note) return
    const { data, error } = await supabase
      .from('notes')
      .update({ title: (titleInput || 'Sem título').trim(), content: contentInput })
      .eq('id', note.id)
      .select('id, title, content, created_at')
      .single()
    if (error) {
      toast.error('Não foi possível salvar alterações')
      return
    }
    setNote(data as NoteItem)
    setIsEditing(false)
    toast.success('Alterações salvas')
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 space-y-4">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={() => router.back()}>Voltar</Button>
          {!isEditing && <Button onClick={() => setIsEditing(true)}>Editar</Button>}
          {isEditing && (
            <>
              <Button variant="secondary" onClick={() => setIsEditing(false)}>Cancelar</Button>
              <Button onClick={handleSaveEdit}>Salvar</Button>
            </>
          )}
          <Button variant="danger" onClick={handleDelete}>Excluir</Button>
        </div>

        <Card className="bg-white">
          <CardHeader>
            {isEditing ? (
              <Input
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                placeholder="Clique para digitar o título"
              />
            ) : (
              <CardTitle className="text-2xl">{note?.title || 'Sem título'}</CardTitle>
            )}
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Editor
                apiKey={apiKey}
                value={contentInput}
                init={{
                  height: 500,
                  menubar: true,
                  language: 'pt_BR',
                  language_url: 'https://cdn.jsdelivr.net/npm/tinymce-i18n/langs5/pt_BR.js',
                  paste_data_images: true,
                  plugins: [
                    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview', 'anchor',
                    'searchreplace', 'visualblocks', 'code', 'fullscreen', 'insertdatetime', 'media', 'table', 'wordcount'
                  ],
                  toolbar:
                    'undo redo | blocks | bold italic forecolor | alignleft aligncenter alignright alignjustify | ' +
                    'bullist numlist outdent indent | link image media table | removeformat | code | preview',
                  file_picker_types: 'image media',
                  file_picker_callback: (callback, value, meta) => {
                    if (meta.filetype === 'image' || meta.filetype === 'media') {
                      const input = document.createElement('input')
                      input.setAttribute('type', 'file')
                      input.setAttribute('accept', meta.filetype === 'image' ? 'image/*' : 'video/*,audio/*')
                      input.onchange = () => {
                        const file = (input.files && input.files[0]) as File
                        const reader = new FileReader()
                        reader.onload = () => {
                          const id = 'blobid' + new Date().getTime()
                          const blobCache = (window as any).tinymce.activeEditor.editorUpload.blobCache
                          const base64 = (reader.result as string).toString().split(',')[1]
                          const blobInfo = blobCache.create(id, file, base64)
                          blobCache.add(blobInfo)
                          callback(blobInfo.blobUri(), { title: file.name })
                        }
                        reader.readAsDataURL(file)
                      }
                      input.click()
                    }
                  },
                  content_style: 'body { font-family:Inter, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial, sans-serif; font-size:14px }'
                }}
                onEditorChange={(val: string) => setContentInput(val)}
              />
            ) : (
              <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: note?.content || '' }} />
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
} 