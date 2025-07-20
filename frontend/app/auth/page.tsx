// frontend/app/auth/page.tsx
'use client'

import { createClient } from '@/lib/supabase/client'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function AuthPage() {
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (session) {
                router.push('/')
            }
        })
        return () => subscription.unsubscribe()
    }, [supabase, router])

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-lg">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-primary-dark">Bem-vindo!</h1>
                    <p className="text-text-secondary">Faça login para continuar</p>
                </div>
                <Auth
                    supabaseClient={supabase}
                    appearance={{ theme: ThemeSupa }}
                    theme="light"
                    providers={[]}
                    localization={{
                        variables: {
                            sign_in: { email_label: 'Seu e-mail', password_label: 'Sua senha', button_label: 'Entrar', link_text: 'Já tem uma conta? Entre' },
                            sign_up: { email_label: 'Seu e-mail', password_label: 'Crie uma senha', button_label: 'Cadastrar', link_text: 'Não tem uma conta? Cadastre-se' },
                            forgotten_password: { email_label: 'Seu e-mail', button_label: 'Enviar instruções', link_text: 'Esqueceu sua senha?' },
                        },
                    }}
                />
            </div>
        </div>
    )
}