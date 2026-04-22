'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/api/auth/callback?next=/reset-password`,
    })

    if (error) {
      setError('Não foi possível enviar o email. Tente novamente.')
      setLoading(false)
      return
    }

    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-[#e2e8f0] p-8 shadow-sm">

          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#ebf3ff] mb-4">
              <span className="text-2xl">🎓</span>
            </div>
            <h1 className="text-2xl font-bold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              Recuperar senha
            </h1>
            <p className="text-sm text-[#64748b] mt-1">
              Enviaremos um link para redefinir sua senha
            </p>
          </div>

          {sent ? (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-50">
                <CheckCircle size={24} className="text-green-500" />
              </div>
              <p className="text-sm text-[#0f172a] font-medium">Email enviado!</p>
              <p className="text-sm text-[#64748b]">
                Verifique sua caixa de entrada em <span className="font-medium text-[#0f172a]">{email}</span> e siga as instruções.
              </p>
              <a
                href="/login"
                className="inline-flex items-center gap-1.5 text-sm text-[#1a56db] hover:underline mt-2"
              >
                <ArrowLeft size={14} />
                Voltar para o login
              </a>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#0f172a] mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#e2e8f0] text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#1a56db] focus:border-transparent transition"
                />
              </div>

              {error && (
                <div className="px-3.5 py-2.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-lg bg-[#1a56db] text-white text-sm font-medium hover:bg-[#1648c0] focus:outline-none focus:ring-2 focus:ring-[#1a56db] focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={16} className="animate-spin" />}
                {loading ? 'Enviando...' : 'Enviar link de recuperação'}
              </button>

              <div className="text-center">
                <a
                  href="/login"
                  className="inline-flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#0f172a] transition"
                >
                  <ArrowLeft size={14} />
                  Voltar para o login
                </a>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  )
}
