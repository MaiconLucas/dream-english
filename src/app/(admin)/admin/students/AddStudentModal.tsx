'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Loader2, UserPlus } from 'lucide-react'
import { addStudent } from './actions'

interface Plan { id: string; name: string; price_cents: number; due_day: number | null }
interface Props { schoolId: string; plans: Plan[] }

export default function AddStudentModal({ schoolId, plans }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await addStudent(new FormData(e.currentTarget))
    if (result.error) { setError(result.error); setLoading(false); return }
    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-[#1a56db] text-white text-sm font-medium rounded-lg hover:bg-[#1648c0] transition"
      >
        <UserPlus size={16} />
        Adicionar Aluno
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                Novo Aluno
              </h2>
              <button onClick={() => setOpen(false)} className="text-[#94a3b8] hover:text-[#0f172a]">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="hidden" name="schoolId" value={schoolId} />

              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">Nome completo</label>
                <input name="fullName" required className="w-full px-3.5 py-2.5 rounded-lg border border-[#e2e8f0] text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1a56db] focus:border-transparent" />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">Email</label>
                <input name="email" type="email" required className="w-full px-3.5 py-2.5 rounded-lg border border-[#e2e8f0] text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1a56db] focus:border-transparent" />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">Senha temporária</label>
                <input name="password" type="password" required minLength={6} className="w-full px-3.5 py-2.5 rounded-lg border border-[#e2e8f0] text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1a56db] focus:border-transparent" />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#374151] mb-1.5">Nível</label>
                <select name="level" className="w-full px-3.5 py-2.5 rounded-lg border border-[#e2e8f0] text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1a56db] focus:border-transparent">
                  <option value="">Selecione...</option>
                  <option value="Básico">Básico</option>
                  <option value="Intermediário">Intermediário</option>
                  <option value="Avançado">Avançado</option>
                </select>
              </div>

              {plans.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-[#374151] mb-1.5">Plano</label>
                  <select name="planId" className="w-full px-3.5 py-2.5 rounded-lg border border-[#e2e8f0] text-sm text-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#1a56db] focus:border-transparent">
                    <option value="">Sem plano</option>
                    {plans.map(p => {
                      const price = (p.price_cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                      const day = p.due_day ? ` — vence dia ${p.due_day}` : ''
                      return <option key={p.id} value={p.id}>{p.name} — {price}{day}</option>
                    })}
                  </select>
                </div>
              )}

              {error && (
                <div className="px-3.5 py-2.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-lg border border-[#e2e8f0] text-sm font-medium text-[#64748b] hover:bg-[#f8fafc] transition">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-lg bg-[#1a56db] text-white text-sm font-medium hover:bg-[#1648c0] disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-2">
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  {loading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
