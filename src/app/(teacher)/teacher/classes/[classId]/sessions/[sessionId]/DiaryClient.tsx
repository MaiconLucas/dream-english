'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronDown, ChevronUp, Save, Send, CheckCircle, Clock } from 'lucide-react'

type Answer = {
  question_id: string
  question_text: string
  answer_text: string | null
  teacher_feedback: string | null
  score: number | null
}

type StudentRecord = {
  student_id: string
  name: string
  attended: boolean
  performance_note: string
  answers: Answer[]
}

type SessionData = {
  id: string
  status: 'draft' | 'published'
  summary: string
  meet_chat: string
  conducted_at: string
  lesson: {
    title: string
    grammar_focus?: string
    objectives?: string[]
    theory?: Record<string, unknown>
    activity?: Record<string, unknown>
    homework_text?: string
  } | null
}

type Props = {
  sessionId: string
  initialData: {
    session: SessionData
    students: StudentRecord[]
  }
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export default function DiaryClient({ sessionId, initialData }: Props) {
  const published = initialData.session.status === 'published'
  const lesson = initialData.session.lesson

  const [summary, setSummary] = useState(initialData.session.summary)
  const [meetChat, setMeetChat] = useState(initialData.session.meet_chat)
  const [students, setStudents] = useState<StudentRecord[]>(
    initialData.students.map(s => ({
      ...s,
      answers: s.answers.map(a => ({
        ...a,
        answer_text: a.answer_text ?? '',
        teacher_feedback: a.teacher_feedback ?? '',
      })),
    }))
  )
  const [lessonOpen, setLessonOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [isPublished, setIsPublished] = useState(published)
  const [showPublishConfirm, setShowPublishConfirm] = useState(false)

  const dirtyRef = useRef(false)
  const readOnly = isPublished

  const buildPayload = useCallback(() => ({
    summary,
    meet_chat: meetChat,
    students: students.map(s => ({
      student_id: s.student_id,
      attended: s.attended,
      performance_note: s.performance_note,
      answers: s.answers.map(a => ({
        question_id: a.question_id,
        answer_text: a.answer_text,
        teacher_feedback: a.teacher_feedback,
        score: a.score,
      })),
    })),
  }), [summary, meetChat, students])

  async function save() {
    setSaving(true)
    try {
      await fetch(`/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      })
      setLastSaved(new Date())
      dirtyRef.current = false
    } finally {
      setSaving(false)
    }
  }

  async function publish() {
    setPublishing(true)
    try {
      await save()
      const res = await fetch(`/api/sessions/${sessionId}/publish`, { method: 'POST' })
      if (res.ok) {
        setIsPublished(true)
        setShowPublishConfirm(false)
      } else {
        const d = await res.json()
        alert(`Erro ao publicar: ${d.error}`)
      }
    } finally {
      setPublishing(false)
    }
  }

  // Mark dirty on any change
  useEffect(() => { dirtyRef.current = true }, [summary, meetChat, students])

  // Auto-save every 30s
  useEffect(() => {
    if (readOnly) return
    const timer = setInterval(() => {
      if (dirtyRef.current) save()
    }, 30_000)
    return () => clearInterval(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [readOnly, buildPayload])

  function updateStudent(idx: number, patch: Partial<StudentRecord>) {
    setStudents(prev => prev.map((s, i) => i === idx ? { ...s, ...patch } : s))
  }

  function updateAnswer(studentIdx: number, answerIdx: number, patch: Partial<Answer>) {
    setStudents(prev => prev.map((s, i) => {
      if (i !== studentIdx) return s
      return {
        ...s,
        answers: s.answers.map((a, j) => j === answerIdx ? { ...a, ...patch } : a),
      }
    }))
  }

  const theory = lesson?.theory as {
    explanation?: string
    tip?: string
    headers?: string[]
    rows?: { col1: string; col2: string; col3?: string }[]
  } | undefined

  const activity = lesson?.activity as {
    type?: string
    title?: string
    instructions?: string
    examples?: string[]
  } | undefined

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
              isPublished ? 'bg-[#ecfdf5] text-[#10b981]' : 'bg-amber-50 text-[#f59e0b]'
            }`}>
              {isPublished ? 'Publicada' : 'Rascunho'}
            </span>
          </div>
          <h1 className="text-xl font-bold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            {lesson?.title ?? 'Diário de Aula'}
          </h1>
          {lesson?.grammar_focus && (
            <p className="text-sm text-[#64748b] mt-0.5">{lesson.grammar_focus}</p>
          )}
          {lastSaved && (
            <p className="text-xs text-[#94a3b8] mt-1 flex items-center gap-1">
              <Clock size={10} />
              Salvo automaticamente às {formatTime(lastSaved.toISOString())}
            </p>
          )}
        </div>

        {!isPublished && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={save}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 border border-[#e2e8f0] bg-white text-sm font-medium text-[#374151] rounded-lg hover:bg-[#f8fafc] disabled:opacity-50 transition"
            >
              <Save size={14} />
              {saving ? 'Salvando…' : 'Salvar Rascunho'}
            </button>
            <button
              onClick={() => setShowPublishConfirm(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1a56db] text-sm font-medium text-white rounded-lg hover:bg-[#1648c0] transition"
            >
              <Send size={14} />
              Publicar Aula
            </button>
          </div>
        )}

        {isPublished && (
          <div className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#ecfdf5] text-sm font-medium text-[#10b981] rounded-lg">
            <CheckCircle size={14} />
            Aula publicada
          </div>
        )}
      </div>

      {/* Publish confirm modal */}
      {showPublishConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h2 className="text-base font-semibold text-[#0f172a] mb-2">Publicar aula?</h2>
            <p className="text-sm text-[#64748b] mb-6">
              Ao publicar, os alunos terão acesso a esta aula na trilha. Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowPublishConfirm(false)}
                className="px-4 py-2 border border-[#e2e8f0] text-sm font-medium text-[#374151] rounded-lg hover:bg-[#f8fafc] transition"
              >
                Cancelar
              </button>
              <button
                onClick={publish}
                disabled={publishing}
                className="px-4 py-2 bg-[#1a56db] text-sm font-medium text-white rounded-lg hover:bg-[#1648c0] disabled:opacity-50 transition"
              >
                {publishing ? 'Publicando…' : 'Publicar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lesson content (collapsible) */}
      {lesson && (
        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
          <button
            onClick={() => setLessonOpen(o => !o)}
            className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-[#0f172a] hover:bg-[#f8fafc] transition"
          >
            Ver conteúdo da aula
            {lessonOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          {lessonOpen && (
            <div className="px-5 pb-5 space-y-4 border-t border-[#f1f5f9]">
              {lesson.objectives && lesson.objectives.length > 0 && (
                <div className="pt-4">
                  <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-2">Objetivos</p>
                  <ul className="space-y-1">
                    {lesson.objectives.map((o, i) => (
                      <li key={i} className="text-sm text-[#374151] flex gap-2"><span className="text-[#1a56db]">·</span>{o}</li>
                    ))}
                  </ul>
                </div>
              )}
              {theory?.explanation && (
                <div>
                  <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-2">Gramática</p>
                  <p className="text-sm text-[#374151] whitespace-pre-wrap">{theory.explanation}</p>
                  {theory.tip && (
                    <div className="mt-2 bg-[#fffbeb] border border-[#fde68a] rounded-lg px-4 py-2">
                      <p className="text-xs font-semibold text-[#92400e]">Dica</p>
                      <p className="text-sm text-[#78350f]">{theory.tip}</p>
                    </div>
                  )}
                </div>
              )}
              {activity?.title && (
                <div>
                  <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-2">Atividade</p>
                  <p className="text-sm font-medium text-[#0f172a]">{activity.title}</p>
                  {activity.instructions && (
                    <p className="text-sm text-[#374151] mt-1 whitespace-pre-wrap">{activity.instructions}</p>
                  )}
                </div>
              )}
              {lesson.homework_text && (
                <div>
                  <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-2">Homework</p>
                  <p className="text-sm text-[#374151] whitespace-pre-wrap">{lesson.homework_text}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5 space-y-4">
        <h2 className="text-sm font-semibold text-[#0f172a]">Resumo da Aula</h2>
        <div>
          <label className="block text-xs font-medium text-[#64748b] mb-1.5">O que foi ensinado</label>
          <textarea
            value={summary}
            onChange={e => setSummary(e.target.value)}
            readOnly={readOnly}
            rows={4}
            placeholder="Descreva o que foi abordado na aula..."
            className="w-full px-3 py-2.5 rounded-lg border border-[#e2e8f0] text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#1a56db] focus:border-transparent resize-none disabled:bg-[#f8fafc] transition read-only:bg-[#f8fafc]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#64748b] mb-1.5">Chat do Meet / Observações gerais</label>
          <textarea
            value={meetChat}
            onChange={e => setMeetChat(e.target.value)}
            readOnly={readOnly}
            rows={3}
            placeholder="Cole o chat do Meet ou adicione observações gerais..."
            className="w-full px-3 py-2.5 rounded-lg border border-[#e2e8f0] text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#1a56db] focus:border-transparent resize-none read-only:bg-[#f8fafc] transition"
          />
        </div>
      </div>

      {/* Student records */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-[#0f172a]">Registro por Aluno</h2>

        {students.length === 0 && (
          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm px-5 py-10 text-center">
            <p className="text-sm text-[#64748b]">Nenhum aluno matriculado nesta turma.</p>
          </div>
        )}

        {students.map((student, si) => (
          <div key={student.student_id} className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#0f172a]">{student.name}</p>
              {!readOnly && (
                <button
                  onClick={() => updateStudent(si, { attended: !student.attended })}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition ${
                    student.attended
                      ? 'bg-[#ecfdf5] border-[#bbf7d0] text-[#10b981]'
                      : 'bg-[#f1f5f9] border-[#e2e8f0] text-[#64748b] hover:bg-[#e2e8f0]'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${student.attended ? 'bg-[#10b981]' : 'bg-[#94a3b8]'}`} />
                  {student.attended ? 'Presente' : 'Ausente'}
                </button>
              )}
              {readOnly && (
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  student.attended ? 'bg-[#ecfdf5] text-[#10b981]' : 'bg-[#f1f5f9] text-[#64748b]'
                }`}>
                  {student.attended ? 'Presente' : 'Ausente'}
                </span>
              )}
            </div>

            {student.attended && student.answers.length > 0 && (
              <div className="space-y-4 pt-2 border-t border-[#f1f5f9]">
                {student.answers.map((answer, ai) => (
                  <div key={answer.question_id} className="space-y-2">
                    <p className="text-xs font-semibold text-[#1a56db] bg-[#ebf3ff] px-3 py-1.5 rounded-lg">
                      {answer.question_text}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-medium text-[#94a3b8] mb-1">Resposta do aluno</label>
                        <input
                          type="text"
                          value={answer.answer_text ?? ''}
                          onChange={e => updateAnswer(si, ai, { answer_text: e.target.value })}
                          readOnly={readOnly}
                          placeholder="Digite a resposta..."
                          className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#1a56db] focus:border-transparent read-only:bg-[#f8fafc] transition"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-medium text-[#94a3b8] mb-1">Feedback</label>
                        <input
                          type="text"
                          value={answer.teacher_feedback ?? ''}
                          onChange={e => updateAnswer(si, ai, { teacher_feedback: e.target.value })}
                          readOnly={readOnly}
                          placeholder="Seu feedback..."
                          className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#1a56db] focus:border-transparent read-only:bg-[#f8fafc] transition"
                        />
                      </div>
                    </div>
                    <div className="w-28">
                      <label className="block text-[10px] font-medium text-[#94a3b8] mb-1">Nota (0–100)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={answer.score ?? ''}
                        onChange={e => updateAnswer(si, ai, { score: e.target.value === '' ? null : Number(e.target.value) })}
                        readOnly={readOnly}
                        placeholder="—"
                        className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#1a56db] focus:border-transparent read-only:bg-[#f8fafc] transition"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className={student.answers.length > 0 ? 'pt-2 border-t border-[#f1f5f9]' : ''}>
              <label className="block text-xs font-medium text-[#64748b] mb-1.5">Observação geral sobre o aluno</label>
              <textarea
                value={student.performance_note}
                onChange={e => updateStudent(si, { performance_note: e.target.value })}
                readOnly={readOnly}
                rows={2}
                placeholder="Pontos fortes, áreas de melhoria..."
                className="w-full px-3 py-2.5 rounded-lg border border-[#e2e8f0] text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#1a56db] focus:border-transparent resize-none read-only:bg-[#f8fafc] transition"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
