'use client'

import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Check, ChevronLeft, ChevronRight, Loader2, Mic2, Save } from 'lucide-react'

type Answer = { question_id: string; question_text: string; answer_text: string; teacher_feedback: string; score: number | null }
type Student = { student_id: string; name: string; attended: boolean; performance_note: string; answers: Answer[] }
type LessonContent = {
  title: string
  grammar_focus?: string
  objectives?: string[]
  theory?: { explanation?: string; tip?: string; headers?: string[]; rows?: { col1: string; col2: string; col3?: string }[] }
  activity?: { title?: string; instructions?: string; examples?: string[] }
  song_exercise?: { song_title?: string; artist?: string; verses?: { text: string }[]; discussion_questions?: string[] }
  homework_text?: string
}
type Data = { session: { summary: string; meet_chat: string; lesson: LessonContent }; students: Student[] }

export default function LiveLessonClient({ sessionId }: { sessionId: string }) {
  const [data, setData] = useState<Data | null>(null)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [studentId, setStudentId] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [phase, setPhase] = useState<'content' | 'questions'>('content')
  const [contentIndex, setContentIndex] = useState(0)

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
  const lesson = data.session.lesson
  const contentSlides: { title: string; content: React.ReactNode }[] = []
  if (lesson.objectives?.length) contentSlides.push({ title: 'Objetivos', content: <ul className="space-y-4">{lesson.objectives.map(item => <li key={item} className="text-2xl md:text-3xl leading-relaxed">• {item}</li>)}</ul> })
  if (lesson.theory?.explanation) contentSlides.push({ title: 'Teoria', content: <><p className="text-xl md:text-2xl whitespace-pre-wrap leading-relaxed">{lesson.theory.explanation}</p>{lesson.theory.tip && <p className="mt-6 rounded-xl bg-amber-400/15 border border-amber-300/20 p-4 text-lg text-amber-100">💡 {lesson.theory.tip}</p>}</> })
  if (lesson.theory?.rows?.length) contentSlides.push({ title: 'Exemplos', content: <div className="overflow-x-auto"><table className="w-full text-left text-xl"><thead>{lesson.theory.headers?.length ? <tr>{lesson.theory.headers.map(h => <th key={h} className="pb-4 pr-6 text-violet-300">{h}</th>)}</tr> : null}</thead><tbody>{lesson.theory.rows.map((row, i) => <tr key={i} className="border-t border-white/10"><td className="py-4 pr-6">{row.col1}</td><td className="py-4 pr-6">{row.col2}</td>{row.col3 && <td className="py-4">{row.col3}</td>}</tr>)}</tbody></table></div> })
  if (lesson.activity?.title) contentSlides.push({ title: 'Atividade', content: <><p className="text-3xl font-semibold">{lesson.activity.title}</p><p className="mt-5 text-xl text-slate-300 whitespace-pre-wrap leading-relaxed">{lesson.activity.instructions}</p>{lesson.activity.examples?.map(item => <p key={item} className="mt-3 text-xl text-violet-200">• {item}</p>)}</> })
  if (lesson.song_exercise?.song_title) contentSlides.push({ title: 'Música', content: <><p className="text-3xl font-semibold">{lesson.song_exercise.song_title} — {lesson.song_exercise.artist}</p><div className="mt-6 space-y-3">{lesson.song_exercise.verses?.map((verse, i) => <p key={i} className="text-xl text-slate-300">{verse.text}</p>)}</div></> })

  if (phase === 'content') {
    const slide = contentSlides[contentIndex]
    const isLast = contentIndex >= contentSlides.length - 1
    return <main className="max-w-6xl mx-auto px-5 py-6 flex flex-col min-h-[calc(100vh-57px)]">
      <div className="flex items-start justify-between gap-4 mb-5"><div><p className="text-sm text-violet-300">{lesson.grammar_focus}</p><h1 className="text-2xl font-bold">{lesson.title}</h1></div><p className="text-sm text-slate-400">{contentSlides.length ? `${contentIndex + 1} de ${contentSlides.length}` : 'Apresentação'}</p></div>
      {slide ? <ContentCard title={slide.title}>{slide.content}</ContentCard> : <ContentCard title="Aula"><p className="text-2xl">O conteúdo introdutório desta aula está pronto.</p></ContentCard>}
      <div className="flex items-center justify-between gap-3 mt-5">
        <button onClick={() => setContentIndex(i => Math.max(0, i - 1))} disabled={contentIndex === 0} className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-3 font-semibold disabled:opacity-30"><ChevronLeft size={18} /> Anterior</button>
        <div className="hidden sm:flex gap-1.5">{contentSlides.map((item, index) => <button key={item.title} onClick={() => setContentIndex(index)} aria-label={`Ir para ${item.title}`} className={`h-2 rounded-full transition-all ${index === contentIndex ? 'w-8 bg-violet-400' : 'w-2 bg-white/20'}`} />)}</div>
        {isLast ? <button onClick={() => setPhase('questions')} className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 rounded-xl px-6 py-3 font-semibold">{questions.length ? <Mic2 size={18} /> : <BookOpen size={18} />}{questions.length ? 'Começar conversa' : 'Concluir apresentação'}<ChevronRight size={18} /></button> : <button onClick={() => setContentIndex(i => Math.min(contentSlides.length - 1, i + 1))} className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 rounded-xl px-6 py-3 font-semibold">Próximo <ChevronRight size={18} /></button>}
      </div>
    </main>
  }

  if (!questions.length) return <div className="p-12 text-center text-slate-300">Conteúdo apresentado. Esta aula não possui perguntas de conversação; as atividades permanecem disponíveis ao aluno junto do homework.</div>

  return <main className="max-w-6xl mx-auto px-5 py-7">
    <div className="flex items-center justify-between gap-4 mb-7">
      <div><button onClick={() => setPhase('content')} className="text-sm text-violet-300 hover:text-violet-200">← Rever teoria</button><h1 className="text-xl font-bold">{lesson.title}</h1></div>
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

function ContentCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <section className="flex-1 bg-white/5 border border-white/10 rounded-3xl p-7 md:p-12 flex flex-col justify-center overflow-auto"><h2 className="text-sm font-bold tracking-widest text-violet-300 mb-7">{title.toUpperCase()}</h2>{children}</section>
}
