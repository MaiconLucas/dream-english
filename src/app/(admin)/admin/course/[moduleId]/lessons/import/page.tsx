'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Sparkles, Loader2, CheckCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { createCourseLesson, type LessonPayload } from '../../../actions'

const inputCls = 'w-full px-3 py-2 rounded-lg border border-[#e2e8f0] text-sm text-[#0f172a] bg-white focus:outline-none focus:ring-2 focus:ring-[#1a56db]'

type ImportedLesson = LessonPayload & { cefr_level: string; status: 'DRAFT' | 'PUBLISHED' }

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-3.5 text-sm font-semibold text-[#0f172a] hover:bg-[#f8fafc] transition"
      >
        {title}
        {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>
      {open && <div className="px-5 pb-5 pt-1 space-y-3 border-t border-[#f1f5f9]">{children}</div>}
    </div>
  )
}

function Badge({ text, color }: { text: string; color: string }) {
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>{text}</span>
}

export default function ImportLessonPage({ params }: { params: { moduleId: string } }) {
  const router = useRouter()
  const [text, setText] = useState('')
  const [processing, setProcessing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [lesson, setLesson] = useState<ImportedLesson | null>(null)

  async function handleProcess() {
    if (!text.trim()) return
    setProcessing(true)
    setError('')
    setLesson(null)
    try {
      const res = await fetch('/api/course/import-lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Erro ao processar'); return }
      setLesson(data.lesson as ImportedLesson)
    } catch {
      setError('Erro de conexão')
    } finally {
      setProcessing(false)
    }
  }

  async function handleCreate(status: 'DRAFT' | 'PUBLISHED') {
    if (!lesson) return
    setSaving(true)
    setError('')
    const payload: LessonPayload = { ...lesson, status }
    const result = await createCourseLesson(params.moduleId, payload)
    setSaving(false)
    if ('error' in result && result.error) { setError(result.error); return }
    if ('id' in result && result.id) {
      router.push(`/admin/course/${params.moduleId}/lessons/${result.id}/edit`)
    } else {
      router.push(`/admin/course/${params.moduleId}`)
    }
  }

  return (
    <div className="max-w-2xl">
      <Link href={`/admin/course/${params.moduleId}`} className="inline-flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#1a56db] transition mb-6">
        <ChevronLeft size={15} />
        Voltar ao módulo
      </Link>

      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={18} className="text-[#1a56db]" />
        <h1 className="text-xl font-bold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Importar Aula com IA
        </h1>
      </div>
      <p className="text-sm text-[#64748b] mb-6">Cole o texto da aula e a IA vai estruturar automaticamente todos os campos do formulário.</p>

      {error && (
        <div className="flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-[#ef4444] mb-5">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Input */}
      {!lesson && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5">
            <label className="block text-xs font-medium text-[#374151] mb-2">Texto da aula</label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={16}
              placeholder={`Cole aqui o texto completo da aula. Pode ser em qualquer formato — o sistema vai identificar automaticamente:\n\n• Título e foco gramatical\n• Objetivos da aula\n• Teoria e tabela gramatical\n• Atividade prática\n• Exercício de música (fill-the-gap)\n• Perguntas de conversação\n• Homework`}
              className="w-full px-3 py-2.5 rounded-lg border border-[#e2e8f0] text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#1a56db] resize-none font-mono"
            />
          </div>

          <button
            onClick={handleProcess}
            disabled={processing || !text.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#1a56db] text-white text-sm font-medium rounded-lg hover:bg-[#1648c0] disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {processing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {processing ? 'Processando com IA…' : 'Estruturar com IA'}
          </button>
        </div>
      )}

      {/* Preview */}
      {lesson && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-4 bg-[#ecfdf5] border border-[#bbf7d0] rounded-xl">
            <CheckCircle size={16} className="text-[#10b981] flex-shrink-0" />
            <p className="text-sm font-medium text-[#065f46]">Aula estruturada com sucesso! Revise abaixo e crie o rascunho.</p>
          </div>

          {/* Basic info */}
          <Section title="1. Informações Básicas">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-medium text-[#94a3b8] uppercase tracking-wide mb-1">Título</p>
                <p className="text-sm font-semibold text-[#0f172a]">{lesson.title || '—'}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-[#94a3b8] uppercase tracking-wide mb-1">Foco Gramatical</p>
                <p className="text-sm text-[#374151]">{lesson.grammar_focus || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <Badge text={lesson.cefr_level || 'A1'} color="bg-emerald-50 text-emerald-700" />
              <Badge text={`${lesson.duration_min || 50} min`} color="bg-[#f1f5f9] text-[#64748b]" />
            </div>
          </Section>

          {/* Objectives */}
          {(lesson.objectives ?? []).length > 0 && (
            <Section title="2. Objetivos">
              <ul className="space-y-1">
                {lesson.objectives.map((o, i) => (
                  <li key={i} className="text-sm text-[#374151] flex gap-2"><span className="text-[#1a56db]">·</span>{o}</li>
                ))}
              </ul>
            </Section>
          )}

          {/* Theory */}
          {lesson.theory?.explanation && (
            <Section title="3. Teoria Gramatical">
              <p className="text-sm text-[#374151] whitespace-pre-wrap leading-relaxed">{lesson.theory.explanation}</p>
              {lesson.theory.tip && (
                <div className="bg-[#fffbeb] border border-[#fde68a] rounded-lg px-4 py-2">
                  <p className="text-xs font-semibold text-[#92400e]">Dica</p>
                  <p className="text-sm text-[#78350f]">{lesson.theory.tip}</p>
                </div>
              )}
              {(lesson.theory.rows ?? []).length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-[#e2e8f0]">
                  <table className="w-full text-sm">
                    {(lesson.theory.headers ?? []).length > 0 && (
                      <thead className="bg-[#f8fafc]">
                        <tr>{lesson.theory.headers!.map((h, i) => <th key={i} className="px-4 py-2 text-left text-xs font-semibold text-[#374151]">{h}</th>)}</tr>
                      </thead>
                    )}
                    <tbody className="divide-y divide-[#f1f5f9]">
                      {lesson.theory.rows.map((r, i) => (
                        <tr key={i}>
                          <td className="px-4 py-2 font-medium text-[#0f172a]">{r.col1}</td>
                          <td className="px-4 py-2 text-[#374151]">{r.col2}</td>
                          {r.col3 && <td className="px-4 py-2 text-[#374151]">{r.col3}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Section>
          )}

          {/* Activity */}
          {lesson.activity?.title && (
            <Section title="4. Atividade">
              <p className="text-sm font-semibold text-[#0f172a]">{lesson.activity.title}</p>
              {lesson.activity.instructions && (
                <p className="text-sm text-[#374151] whitespace-pre-wrap">{lesson.activity.instructions}</p>
              )}
              {(lesson.activity.examples ?? []).length > 0 && (
                <ul className="space-y-1">{lesson.activity.examples.map((e, i) => <li key={i} className="text-sm text-[#374151] italic">· {e}</li>)}</ul>
              )}
            </Section>
          )}

          {/* Song */}
          {lesson.song_exercise?.song_title && (
            <Section title="5. Exercício de Música">
              <p className="text-sm font-semibold text-[#0f172a]">{lesson.song_exercise.song_title} — {lesson.song_exercise.artist}</p>
              {(lesson.song_exercise.verses ?? []).length > 0 && (
                <div className="space-y-2">
                  {lesson.song_exercise.verses.map((v, i) => (
                    <div key={i} className="text-sm text-[#374151]">
                      <span className="font-mono">{v.text}</span>
                      <span className="ml-2 text-xs text-[#1a56db] font-medium">→ {v.blank_word}</span>
                    </div>
                  ))}
                </div>
              )}
            </Section>
          )}

          {/* Questions */}
          {(lesson.questions ?? []).length > 0 && (
            <Section title="6. Perguntas de Conversação">
              <div className="space-y-3">
                {lesson.questions.map((q, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-lg flex-shrink-0">{q.emoji || '·'}</span>
                    <div>
                      <p className="text-sm font-medium text-[#0f172a]">{q.question}</p>
                      {q.follow_up && <p className="text-xs text-[#64748b] mt-0.5">↳ {q.follow_up}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Homework */}
          {lesson.homework_text && (
            <Section title="7. Homework">
              <p className="text-sm text-[#374151] whitespace-pre-wrap">{lesson.homework_text}</p>
            </Section>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => handleCreate('DRAFT')}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#1a56db] text-white text-sm font-medium rounded-lg hover:bg-[#1648c0] disabled:opacity-60 transition"
            >
              {saving && <Loader2 size={15} className="animate-spin" />}
              Criar como Rascunho e Editar
            </button>
            <button
              onClick={() => { setLesson(null); setError('') }}
              className="px-5 py-3 text-sm font-medium text-[#64748b] border border-[#e2e8f0] rounded-lg hover:bg-[#f8fafc] transition"
            >
              Novo texto
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
