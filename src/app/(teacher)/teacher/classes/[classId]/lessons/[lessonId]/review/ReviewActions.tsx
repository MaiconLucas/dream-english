'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Loader2, MessageSquareWarning } from 'lucide-react'

export default function ReviewActions({ lessonId, currentStatus }: { lessonId: string; currentStatus: string }) {
  const router = useRouter()
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState<'approve' | 'request_changes' | null>(null)
  const [error, setError] = useState('')

  async function submit(action: 'approve' | 'request_changes') {
    setError('')
    setLoading(action)
    const response = await fetch(`/api/lessons/${lessonId}/review`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action, note }),
    })
    const data = await response.json()
    setLoading(null)
    if (!response.ok) return setError(data.error ?? 'Não foi possível salvar a revisão')
    router.refresh()
  }

  return (
    <div className="bg-white border border-[#e2e8f0] rounded-xl p-5 sticky top-5">
      <h2 className="font-semibold text-[#0f172a]">Decisão do professor</h2>
      <p className="text-xs text-[#64748b] mt-1 mb-4">A aprovação libera o botão “Iniciar aula” para esta turma.</p>
      {currentStatus === 'APPROVED' && <p className="text-sm text-emerald-700 bg-emerald-50 rounded-lg p-3 mb-3">Conteúdo aprovado.</p>}
      <textarea value={note} onChange={e => setNote(e.target.value)} rows={4} placeholder="Explique ao administrador o que precisa mudar..." className="w-full border border-[#e2e8f0] rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1a56db]" />
      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}
      <div className="grid gap-2 mt-3">
        <button onClick={() => submit('approve')} disabled={!!loading} className="inline-flex justify-center items-center gap-2 bg-emerald-600 text-white rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50">
          {loading === 'approve' ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle size={15} />} Aprovar conteúdo
        </button>
        <button onClick={() => submit('request_changes')} disabled={!!loading || !note.trim()} className="inline-flex justify-center items-center gap-2 border border-amber-300 text-amber-800 bg-amber-50 rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-50">
          {loading === 'request_changes' ? <Loader2 size={15} className="animate-spin" /> : <MessageSquareWarning size={15} />} Solicitar alteração
        </button>
      </div>
    </div>
  )
}
