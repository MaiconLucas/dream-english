'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { KeyRound, X, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'

export default function ChangePasswordButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  function handleClose() {
    setOpen(false)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setError('')
    setSuccess(false)
    setLoading(false)
    setShowCurrent(false)
    setShowNew(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (newPassword.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) {
      setError('Não foi possível identificar o usuário.')
      setLoading(false)
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    })
    if (signInError) {
      setError('Senha atual incorreta.')
      setLoading(false)
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    setTimeout(handleClose, 2000)
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        <KeyRound size={15} />
        Alterar senha
      </button>

      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 z-10">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-[#0f172a]">Alterar senha</h2>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg text-[#64748b] hover:bg-[#f1f5f9] transition"
              >
                <X size={16} />
              </button>
            </div>

            {success ? (
              <div className="flex flex-col items-center py-6 text-center">
                <CheckCircle2 size={40} className="text-[#10b981] mb-3" />
                <p className="text-sm font-medium text-[#0f172a]">Senha alterada com sucesso!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#64748b] mb-1.5">
                    Senha atual
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={e => setCurrentPassword(e.target.value)}
                      required
                      className="w-full pr-10 pl-3 py-2.5 rounded-lg border border-[#e2e8f0] text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1a56db] focus:border-transparent transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrent(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b]"
                    >
                      {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#64748b] mb-1.5">
                    Nova senha
                  </label>
                  <div className="relative">
                    <input
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required
                      className="w-full pr-10 pl-3 py-2.5 rounded-lg border border-[#e2e8f0] text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1a56db] focus:border-transparent transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b]"
                    >
                      {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#64748b] mb-1.5">
                    Confirmar nova senha
                  </label>
                  <input
                    type={showNew ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    className="w-full pl-3 py-2.5 rounded-lg border border-[#e2e8f0] text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1a56db] focus:border-transparent transition"
                  />
                </div>

                {error && <p className="text-xs text-[#ef4444]">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg bg-[#1a56db] text-white text-sm font-medium hover:bg-[#1648c0] disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                  {loading
                    ? <><Loader2 size={14} className="animate-spin" /> Salvando…</>
                    : 'Salvar nova senha'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
