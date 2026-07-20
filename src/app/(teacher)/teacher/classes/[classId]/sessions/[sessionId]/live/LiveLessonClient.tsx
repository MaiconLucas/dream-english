'use client'

import { useEffect, useMemo, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, Loader2, Mic2, Save } from 'lucide-react'

type Answer = { question_id: string; question_text: string; answer_text: string; teacher_feedback: string; score: number | null }
type Student = { student_id: string; name: string; attended: boolean; performance_note: string; answers: Answer[] }
type Data = { session: { summary: string; meet_chat: string; lesson: { title: string; grammar_focus?: string } }; students: Student[] }

export default function LiveLessonClient({ sessionId }: { sessionId: string }) {
  const [data, setData] = useState<Data | null>(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [studentId, setStudentId] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => { fetch(`/api/sessions/${sessionId}`).then(r => r.json()).then(d => {
    const normalized = { ...d, students: (d.students ?? []).map((s: Student) => ({ ...s, answers: s.answers.map(a => ({ ...a, answer_text: a.answer_text ?? '', teacher_feedback: a.teacher_feedback ?? '' })) })) }
    setData(normalized); setStudentId(normalized.students.find((s: Student) => s.attended)?.student_id ?? normalized.students[0]?.student_id ?? '')
  }) }, [sessionId])

  const questions = useMemo(() => data?.students[0]?.answers ?? [], [data])
  const selected = data?.students.find(s => s.student_id === studentId)
  const answer = selected?.answers.find(a => a.question_id === questions[questionIndex]?.question_id)

  function updateAnswer(field: 'answer_text' | 'teacher_feedback', value: string) {
    if (!data || !selected || !answer) return
    setSaved(false)
    setData({ ...data, students: data.students.map(s => s.student_id !== selected.student_id ? s : { ...s, attended: true, answers: s.answers.map(a => a.question_id === answer.question_id ? { ...a, [field]: value } : a) }) })
  }

  async function save() {
    if (!data) return
    setSaving(true)
    const response = await fetch(`/api/sessions/${sessionId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ summary: data.session.summary, meet_chat: data.session.meet_chat, students: data.students }) })
    setSaving(false); setSaved(response.ok)
  }

  if (!data) return <div className="h-[70vh] flex items-center justify-center"><Loader2 className="animate-spin text-violet-300" /></div>
  if (!questions.length) return <div className="p-12 text-center text-slate-300">Esta aula não possui perguntas de conversação.</div>

  return <main className="max-w-6xl mx-auto px-5 py-7">
    <div className="flex items-center justify-between gap-4 mb-7">
      <div><p className="text-sm text-violet-300">{data.session.lesson.grammar_focus}</p><h1 className="text-xl font-bold">{data.session.lesson.title}</h1></div>
      <div className="text-sm text-slate-400">Pergunta {questionIndex + 1} de {questions.length}</div>
    </div>

    <section className="bg-white text-slate-950 rounded-3xl p-7 md:p-12 min-h-[260px] flex flex-col justify-center shadow-2xl">
      <div className="inline-flex self-start items-center gap-2 bg-violet-100 text-violet-800 rounded-full px-3 py-1 text-xs font-semibold mb-5"><Mic2 size={14} /> CONVERSATION</div>
      <p className="text-3xl md:text-5xl font-bold leading-tight">{questions[questionIndex].question_text}</p>
    </section>

    <div className="grid lg:grid-cols-[260px_1fr] gap-4 mt-5">
      <aside className="bg-white/5 border border-white/10 rounded-2xl p-4">
        <label className="text-xs font-semibold text-slate-400">QUEM ESTÁ RESPONDENDO?</label>
        <div className="space-y-2 mt-3">{data.students.map(s => <button key={s.student_id} onClick={() => setStudentId(s.student_id)} className={`w-full text-left rounded-xl px-3 py-2.5 text-sm transition ${studentId === s.student_id ? 'bg-violet-600 text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>{s.name}{s.attended && <Check size={13} className="inline ml-2" />}</button>)}</div>
      </aside>
      <section className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <p className="font-semibold mb-4">Registro da conversa — {selected?.name}</p>
        <div className="grid md:grid-cols-2 gap-3">
          <div><label className="block text-xs text-slate-400 mb-1.5">O que o aluno respondeu (opcional)</label><textarea value={answer?.answer_text ?? ''} onChange={e => updateAnswer('answer_text', e.target.value)} rows={3} placeholder="Registre uma frase importante ou o erro..." className="w-full bg-slate-900 border border-white/15 rounded-xl p-3 text-sm text-white resize-none focus:outline-none focus:border-violet-400" /></div>
          <div><label className="block text-xs text-slate-400 mb-1.5">Correção dada pelo professor</label><textarea value={answer?.teacher_feedback ?? ''} onChange={e => updateAnswer('teacher_feedback', e.target.value)} rows={3} placeholder="Ex.: I am 25 years old — não 'I have 25'" className="w-full bg-slate-900 border border-white/15 rounded-xl p-3 text-sm text-white resize-none focus:outline-none focus:border-emerald-400" /></div>
        </div>
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-2"><button onClick={() => setQuestionIndex(i => Math.max(0, i - 1))} disabled={questionIndex === 0} className="p-2.5 rounded-lg bg-white/10 disabled:opacity-30"><ChevronLeft size={18} /></button><button onClick={() => setQuestionIndex(i => Math.min(questions.length - 1, i + 1))} disabled={questionIndex === questions.length - 1} className="p-2.5 rounded-lg bg-white/10 disabled:opacity-30"><ChevronRight size={18} /></button></div>
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl px-5 py-2.5 text-sm font-semibold disabled:opacity-50">{saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <Check size={15} /> : <Save size={15} />}{saved ? 'Salvo' : 'Salvar registros'}</button>
        </div>
      </section>
    </div>
  </main>
}
