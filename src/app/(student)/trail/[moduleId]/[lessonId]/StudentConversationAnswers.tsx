'use client'

import { useState } from 'react'
import { Check, Loader2, Send } from 'lucide-react'

type Question = { id: string; emoji?: string; question: string; follow_up?: string }

export default function StudentConversationAnswers({ sessionId, questions, initialAnswers, isLive }: { sessionId: string; questions: Question[]; initialAnswers: Record<string, string>; isLive: boolean }) {
  const [answers, setAnswers] = useState(initialAnswers)
  const [saving, setSaving] = useState<string | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  async function save(questionId: string) {
    setSaving(questionId); setSaved(null)
    const response = await fetch(`/api/student/sessions/${sessionId}/answers`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question_id: questionId, answer_text: answers[questionId] ?? '' }) })
    setSaving(null); if (response.ok) setSaved(questionId)
  }
  return <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5 mb-4">
    <div className="flex items-center justify-between gap-3 mb-1"><h2 className="text-sm font-semibold text-[#0f172a]">💬 Suas respostas</h2>{isLive && <span className="text-[10px] font-semibold text-red-700 bg-red-50 px-2 py-1 rounded-full">AULA EM ANDAMENTO</span>}</div>
    <p className="text-xs text-[#64748b] mb-4">Responda durante a conversa. O que ficar em branco continuará disponível para fazer em casa junto do homework.</p>
    <div className="space-y-5">{questions.map((q, index) => <div key={q.id}><p className="text-sm font-medium text-[#0f172a] mb-2">{q.emoji ?? `${index + 1}.`} {q.question}</p>{q.follow_up && <p className="text-xs text-[#64748b] mb-2">↳ {q.follow_up}</p>}<div className="flex gap-2"><textarea value={answers[q.id] ?? ''} onChange={e => { setAnswers(v => ({ ...v, [q.id]: e.target.value })); setSaved(null) }} rows={2} placeholder="Escreva sua resposta em inglês..." className="flex-1 border border-[#e2e8f0] rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1a56db]" /><button onClick={() => save(q.id)} disabled={saving === q.id} className="self-end inline-flex items-center gap-1.5 px-3 py-2.5 bg-[#1a56db] text-white rounded-lg text-xs font-semibold disabled:opacity-50">{saving === q.id ? <Loader2 size={14} className="animate-spin" /> : saved === q.id ? <Check size={14} /> : <Send size={14} />}{saved === q.id ? 'Salvo' : 'Enviar'}</button></div></div>)}</div>
  </div>
}
