// app/layout.tsx
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sistema de Gestão de Contratos',
  description: 'Sistema completo para gestão de contratos e licitações',
  keywords: ['contratos', 'licitações', 'gestão', 'governo'],
  authors: [{ name: 'Sua Empresa' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f132e',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="h-full">
      <body className={`${inter.className} h-full bg-background`}>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}