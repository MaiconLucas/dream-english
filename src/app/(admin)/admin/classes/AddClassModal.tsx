'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X, Loader2, Plus } from 'lucide-react'
import { addClass } from './actions'

interface Teacher { id: string; name: string }
interface Props { schoolId: string; teachers: Teacher[] }

export default function AddClassModal({ schoolId, teachers }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await addClass(new FormData(e.currentTarget))
    if (result.error) { setError(result.error); setLoading(false); return }
    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
      >
        <Plus size={16} />
        Adicionar Turma
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-text" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                Nova Turma
              </h2>
              <button onClick={() => setOpen(false)} className="text-text-muted hover:text-text">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="hidden" name="schoolId" value={schoolId} />

              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Nome da turma</label>
                <input name="name" required placeholder="Ex: Turma A - Básico" className="w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Nível</label>
                <select name="level" className="w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                  <option value="">Selecione...</option>
                  <option value="Básico">Básico</option>
                  <option value="Intermediário">Intermediário</option>
                  <option value="Avançado">Avançado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Professor</label>
                <select name="teacherId" className="w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent">
                  <option value="">Sem professor</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text mb-1.5">Máx. de alunos</label>
                <input name="maxStudents" type="number" min={1} defaultValue={10} required className="w-full px-3.5 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
              </div>

              {error && (
                <div className="px-3.5 py-2.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)} className="flex-1 py-2.5 rounded-lg border border-border text-sm font-medium text-text-muted hover:bg-bg transition">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-lg bg-primary text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-2">
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
