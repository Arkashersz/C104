'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { toast } from 'sonner'
import { Sidebar } from '@/components/layout/sidebar'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const Editor = dynamic(() => import('@tinymce/tinymce-react').then(m => m.Editor), { ssr: false })

export default function NotasPage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const supabase = createClient()
  const router = useRouter()

  const storageKeyTitle = 'c104.notes.title.v1'
  const storageKeyContent = 'c104.notes.content.v1'

  useEffect(() => {
    try {
      const savedTitle = typeof window !== 'undefined' ? localStorage.getItem(storageKeyTitle) : null
      const savedContent = typeof window !== 'undefined' ? localStorage.getItem(storageKeyContent) : null
      if (savedTitle) setTitle(savedTitle)
      if (savedContent) setContent(savedContent)
    } catch {}
  }, [])

  const handleSave = async () => {
    try {
      // opcional: manter rascunho local
      localStorage.setItem(storageKeyTitle, title)
      localStorage.setItem(storageKeyContent, content)

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Você precisa estar autenticado')
        return
      }

      const { data, error } = await supabase
        .from('notes')
        .insert([{ user_id: user.id, title: (title || 'Sem título').trim(), content }])
        .select('id')
        .single()

      if (error) throw error

      // limpar campos e rascunhos após salvar
      setTitle('')
      setContent('')
      localStorage.removeItem(storageKeyTitle)
      localStorage.removeItem(storageKeyContent)

      toast.success('Nota salva')
      if (data?.id) router.push(`/notas/${data.id}`)
    } catch (e) {
      console.error(e)
      toast.error('Não foi possível salvar suas notas')
    }
  }

  const handleClear = () => {
    setContent('')
    toast.info('Conteúdo limpo (não esqueça de salvar)')
  }

  const apiKey = process.env.NEXT_PUBLIC_TINYMCE_API_KEY

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 ml-64 p-8">
        <h1 className="text-3xl font-bold mb-4">Notas</h1>
        <div className="flex items-center justify-between mb-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full max-w-md px-3 py-2 rounded-md border bg-white text-black focus:outline-none focus:ring-2 focus:ring-primary-medium"
            placeholder="Clique para digitar o título"
          />
          <div className="flex items-center gap-2 ml-4">
            <button onClick={handleSave} className="px-4 py-2 rounded-md bg-primary-medium text-white hover:opacity-90">Salvar</button>
            <button onClick={handleClear} className="px-4 py-2 rounded-md bg-white text-black border hover:bg-gray-50">Limpar</button>
          </div>
        </div>

        <div className="bg-white rounded-md shadow border">
          <Editor
            apiKey={apiKey}
            value={content}
            init={{
              height: 600,
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
            onEditorChange={(newContent) => setContent(newContent)}
          />
        </div>

        <p className="text-sm text-muted-foreground mt-3">
          As notas são salvas na sua conta. Veja todas em "Minhas Notas".
        </p>
      </main>
    </div>
  )
} 