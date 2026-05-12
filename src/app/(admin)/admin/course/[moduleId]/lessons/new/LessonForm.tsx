'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import Link from 'next/link'
import { ChevronLeft, Plus, Trash2, Loader2 } from 'lucide-react'
import { createCourseLesson, updateCourseLesson, type LessonPayload } from '../../../actions'
import type { CourseLesson, LessonQuestion } from '@/types/course'

const CEFR_LEVELS = ['A1', 'A1/A2', 'A2', 'A2/B1', 'B1', 'B1/B2', 'B2', 'C1']

// ── Form types ──────────────────────────────────────────────
type FormValues = {
  title: string
  grammar_focus: string
  duration_min: number
  cefr_level: string
  status: 'DRAFT' | 'PUBLISHED'
  objectives: { value: string }[]
  theory_explanation: string
  theory_tip: string
  theory_header1: string
  theory_header2: string
  theory_header3: string
  theory_rows: { col1: string; col2: string; col3: string }[]
  activity_type: 'game' | 'song'
  activity_title: string
  activity_duration: number
  activity_instructions: string
  activity_examples: { value: string }[]
  song_title: string
  song_artist: string
  song_verses: { text: string; blank_word: string }[]
  song_discussion: { value: string }[]
  homework_text: string
  questions: { emoji: string; question: string; follow_up: string }[]
}

// ── Helpers ──────────────────────────────────────────────────
const inputCls = 'w-full px-3 py-2 rounded-lg border border-[#e2e8f0] text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#1a56db] focus:border-transparent'
const labelCls = 'block text-xs font-medium text-[#374151] mb-1.5'
const sectionCls = 'bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5 space-y-4'
const sectionTitle = 'text-sm font-semibold text-[#0f172a] border-b border-[#f1f5f9] pb-3 mb-1'

function toPayload(v: FormValues): LessonPayload {
  return {
    title: v.title,
    grammar_focus: v.grammar_focus || undefined,
    duration_min: Number(v.duration_min),
    cefr_level: v.cefr_level,
    status: v.status,
    objectives: v.objectives.map(o => o.value).filter(Boolean),
    theory: {
      explanation: v.theory_explanation,
      tip: v.theory_tip || undefined,
      headers: [v.theory_header1, v.theory_header2, v.theory_header3].filter(Boolean),
      rows: v.theory_rows.filter(r => r.col1),
    },
    activity: {
      type: v.activity_type,
      title: v.activity_title,
      duration_min: Number(v.activity_duration),
      instructions: v.activity_instructions,
      examples: v.activity_examples.map(e => e.value).filter(Boolean),
    },
    song_exercise: {
      song_title: v.song_title,
      artist: v.song_artist,
      verses: v.song_verses.filter(s => s.text),
      discussion_questions: v.song_discussion.map(d => d.value).filter(Boolean),
    },
    homework_text: v.homework_text || undefined,
    questions: v.questions
      .filter(q => q.question)
      .map(q => ({ emoji: q.emoji || undefined, question: q.question, follow_up: q.follow_up || undefined })),
  }
}

function fromLesson(lesson: CourseLesson, questions: LessonQuestion[]): Partial<FormValues> {
  const th = lesson.theory ?? {}
  const ac = lesson.activity ?? {}
  const sg = lesson.song_exercise ?? {}
  return {
    title: lesson.title,
    grammar_focus: lesson.grammar_focus ?? '',
    duration_min: lesson.duration_min,
    cefr_level: lesson.cefr_level,
    status: lesson.status,
    objectives: (lesson.objectives ?? []).map((v: string) => ({ value: v })),
    theory_explanation: th.explanation ?? '',
    theory_tip: th.tip ?? '',
    theory_header1: th.headers?.[0] ?? '',
    theory_header2: th.headers?.[1] ?? '',
    theory_header3: th.headers?.[2] ?? '',
    theory_rows: (th.rows ?? []).map((r: { col1: string; col2: string; col3?: string }) => ({
      col1: r.col1 ?? '', col2: r.col2 ?? '', col3: r.col3 ?? '',
    })),
    activity_type: ac.type ?? 'game',
    activity_title: ac.title ?? '',
    activity_duration: ac.duration_min ?? 15,
    activity_instructions: ac.instructions ?? '',
    activity_examples: (ac.examples ?? []).map((v: string) => ({ value: v })),
    song_title: sg.song_title ?? '',
    song_artist: sg.artist ?? '',
    song_verses: (sg.verses ?? []).map((v: { text: string; blank_word: string }) => ({
      text: v.text, blank_word: v.blank_word,
    })),
    song_discussion: (sg.discussion_questions ?? []).map((v: string) => ({ value: v })),
    homework_text: lesson.homework_text ?? '',
    questions: questions.map(q => ({ emoji: q.emoji ?? '', question: q.question, follow_up: q.follow_up ?? '' })),
  }
}

// ── Props ──────────────────────────────────────────────────────
type Props =
  | { moduleId: string; lessonId?: undefined; lesson?: undefined; questions?: undefined }
  | { moduleId: string; lessonId: string; lesson: CourseLesson; questions: LessonQuestion[] }

export default function LessonForm({ moduleId, lessonId, lesson, questions }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const defaults: Partial<FormValues> = lesson
    ? fromLesson(lesson, questions ?? [])
    : {
        duration_min: 50,
        cefr_level: 'A1',
        status: 'DRAFT',
        objectives: [{ value: '' }],
        theory_rows: [{ col1: '', col2: '', col3: '' }],
        activity_type: 'game',
        activity_duration: 15,
        activity_examples: [{ value: '' }],
        song_verses: [{ text: '', blank_word: '' }],
        song_discussion: [{ value: '' }],
        questions: Array.from({ length: 5 }, () => ({ emoji: '', question: '', follow_up: '' })),
      }

  const { register, control, handleSubmit } = useForm<FormValues>({ defaultValues: defaults as FormValues })

  const objectives = useFieldArray({ control, name: 'objectives' })
  const theoryRows = useFieldArray({ control, name: 'theory_rows' })
  const activityExamples = useFieldArray({ control, name: 'activity_examples' })
  const songVerses = useFieldArray({ control, name: 'song_verses' })
  const songDiscussion = useFieldArray({ control, name: 'song_discussion' })
  const questionFields = useFieldArray({ control, name: 'questions' })

  async function onSubmit(values: FormValues) {
    setSaving(true)
    setError('')
    const payload = toPayload(values)
    const result = lessonId
      ? await updateCourseLesson(lessonId, moduleId, payload)
      : await createCourseLesson(moduleId, payload)
    setSaving(false)
    if ('error' in result && result.error) { setError(result.error); return }
    router.push(`/admin/course/${moduleId}`)
  }

  return (
    <div className="max-w-2xl">
      <Link href={`/admin/course/${moduleId}`} className="inline-flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#1a56db] transition mb-6">
        <ChevronLeft size={15} />
        Voltar
      </Link>

      <h1 className="text-xl font-bold text-[#0f172a] mb-6" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        {lessonId ? 'Editar Aula' : 'Nova Aula'}
      </h1>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">{error}</div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* ── 1. Informações Básicas ── */}
        <div className={sectionCls}>
          <p className={sectionTitle}>1. Informações Básicas</p>

          <div>
            <label className={labelCls}>Título *</label>
            <input {...register('title', { required: true })} placeholder="Ex: To Be — Presente" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Foco Gramatical</label>
            <input {...register('grammar_focus')} placeholder="Ex: Verb To Be (am / is / are)" className={inputCls} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Nível CEFR</label>
              <select {...register('cefr_level')} className={inputCls}>
                {CEFR_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Duração (min)</label>
              <input {...register('duration_min', { valueAsNumber: true })} type="number" min={1} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select {...register('status')} className={inputCls}>
                <option value="DRAFT">Rascunho</option>
                <option value="PUBLISHED">Publicado</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── 2. Objetivos ── */}
        <div className={sectionCls}>
          <p className={sectionTitle}>2. Objetivos da Aula</p>
          <div className="space-y-2">
            {objectives.fields.map((f, i) => (
              <div key={f.id} className="flex gap-2">
                <input {...register(`objectives.${i}.value`)} placeholder={`Objetivo ${i + 1}`} className={inputCls} />
                <button type="button" onClick={() => objectives.remove(i)} className="text-[#94a3b8] hover:text-red-500 transition flex-shrink-0">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => objectives.append({ value: '' })}
            className="flex items-center gap-1.5 text-xs font-medium text-[#1a56db] hover:text-[#1648c0] transition mt-1">
            <Plus size={13} /> Adicionar objetivo
          </button>
        </div>

        {/* ── 3. Teoria Gramatical ── */}
        <div className={sectionCls}>
          <p className={sectionTitle}>3. Teoria Gramatical</p>

          <div>
            <label className={labelCls}>Explicação</label>
            <textarea {...register('theory_explanation')} rows={4} placeholder="Explique a gramática da aula..." className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Dica (opcional)</label>
            <input {...register('theory_tip')} placeholder="Ex: Use 'is' com he/she/it" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Cabeçalhos da tabela</label>
            <div className="grid grid-cols-3 gap-2">
              <input {...register('theory_header1')} placeholder="Coluna 1" className={inputCls} />
              <input {...register('theory_header2')} placeholder="Coluna 2" className={inputCls} />
              <input {...register('theory_header3')} placeholder="Coluna 3 (opcional)" className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Linhas da tabela</label>
            <div className="space-y-2">
              {theoryRows.fields.map((f, i) => (
                <div key={f.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                  <input {...register(`theory_rows.${i}.col1`)} placeholder="Col 1" className={inputCls} />
                  <input {...register(`theory_rows.${i}.col2`)} placeholder="Col 2" className={inputCls} />
                  <input {...register(`theory_rows.${i}.col3`)} placeholder="Col 3" className={inputCls} />
                  <button type="button" onClick={() => theoryRows.remove(i)} className="text-[#94a3b8] hover:text-red-500 transition">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => theoryRows.append({ col1: '', col2: '', col3: '' })}
              className="flex items-center gap-1.5 text-xs font-medium text-[#1a56db] hover:text-[#1648c0] transition mt-2">
              <Plus size={13} /> Adicionar linha
            </button>
          </div>
        </div>

        {/* ── 4. Atividade ── */}
        <div className={sectionCls}>
          <p className={sectionTitle}>4. Atividade Principal</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Tipo</label>
              <select {...register('activity_type')} className={inputCls}>
                <option value="game">Jogo</option>
                <option value="song">Música</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Duração (min)</label>
              <input {...register('activity_duration', { valueAsNumber: true })} type="number" min={1} className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Título da atividade</label>
            <input {...register('activity_title')} placeholder="Ex: Verb To Be Bingo" className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Instruções</label>
            <textarea {...register('activity_instructions')} rows={3} placeholder="Como funciona a atividade..." className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Exemplos</label>
            <div className="space-y-2">
              {activityExamples.fields.map((f, i) => (
                <div key={f.id} className="flex gap-2">
                  <input {...register(`activity_examples.${i}.value`)} placeholder={`Exemplo ${i + 1}`} className={inputCls} />
                  <button type="button" onClick={() => activityExamples.remove(i)} className="text-[#94a3b8] hover:text-red-500 transition flex-shrink-0">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => activityExamples.append({ value: '' })}
              className="flex items-center gap-1.5 text-xs font-medium text-[#1a56db] hover:text-[#1648c0] transition mt-1">
              <Plus size={13} /> Adicionar exemplo
            </button>
          </div>
        </div>

        {/* ── 5. Exercício de Música ── */}
        <div className={sectionCls}>
          <p className={sectionTitle}>5. Exercício de Música (Fill the Gap)</p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Nome da música</label>
              <input {...register('song_title')} placeholder="Ex: Hello" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Artista</label>
              <input {...register('song_artist')} placeholder="Ex: Adele" className={inputCls} />
            </div>
          </div>

          <div>
            <label className={labelCls}>Versos com lacunas</label>
            <p className="text-[11px] text-[#94a3b8] mb-2">Use ___ no texto onde vai a lacuna. Escreva a resposta correta em &ldquo;Resposta&rdquo;.</p>
            <div className="space-y-3">
              {songVerses.fields.map((f, i) => (
                <div key={f.id} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-1.5">
                    <input {...register(`song_verses.${i}.text`)} placeholder='Ex: Hello, ___ from the other side' className={inputCls} />
                    <input {...register(`song_verses.${i}.blank_word`)} placeholder="Resposta: it's" className={inputCls} />
                  </div>
                  <button type="button" onClick={() => songVerses.remove(i)} className="text-[#94a3b8] hover:text-red-500 transition mt-2 flex-shrink-0">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => songVerses.append({ text: '', blank_word: '' })}
              className="flex items-center gap-1.5 text-xs font-medium text-[#1a56db] hover:text-[#1648c0] transition mt-2">
              <Plus size={13} /> Adicionar verso
            </button>
          </div>

          <div>
            <label className={labelCls}>Perguntas de discussão sobre a música</label>
            <div className="space-y-2">
              {songDiscussion.fields.map((f, i) => (
                <div key={f.id} className="flex gap-2">
                  <input {...register(`song_discussion.${i}.value`)} placeholder={`Pergunta ${i + 1}`} className={inputCls} />
                  <button type="button" onClick={() => songDiscussion.remove(i)} className="text-[#94a3b8] hover:text-red-500 transition flex-shrink-0">
                    <Trash2 size={15} />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => songDiscussion.append({ value: '' })}
              className="flex items-center gap-1.5 text-xs font-medium text-[#1a56db] hover:text-[#1648c0] transition mt-1">
              <Plus size={13} /> Adicionar pergunta
            </button>
          </div>
        </div>

        {/* ── 6. Perguntas de Conversação ── */}
        <div className={sectionCls}>
          <p className={sectionTitle}>6. Perguntas de Conversação</p>
          <div className="space-y-4">
            {questionFields.fields.map((f, i) => (
              <div key={f.id} className="flex gap-2 items-start">
                <div className="flex-1 space-y-1.5">
                  <div className="flex gap-2">
                    <input {...register(`questions.${i}.emoji`)} placeholder="🙂" className="w-16 px-3 py-2 rounded-lg border border-[#e2e8f0] text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#1a56db]" />
                    <input {...register(`questions.${i}.question`)} placeholder={`Pergunta ${i + 1}`} className={inputCls} />
                  </div>
                  <input {...register(`questions.${i}.follow_up`)} placeholder="Follow-up (opcional)" className={inputCls} />
                </div>
                <button type="button" onClick={() => questionFields.remove(i)} className="text-[#94a3b8] hover:text-red-500 transition mt-2 flex-shrink-0">
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => questionFields.append({ emoji: '', question: '', follow_up: '' })}
            className="flex items-center gap-1.5 text-xs font-medium text-[#1a56db] hover:text-[#1648c0] transition mt-1">
            <Plus size={13} /> Adicionar pergunta
          </button>
        </div>

        {/* ── 7. Homework ── */}
        <div className={sectionCls}>
          <p className={sectionTitle}>7. Homework</p>
          <textarea {...register('homework_text')} rows={4} placeholder="Descreva a tarefa de casa (opcional)..." className={inputCls} />
        </div>

        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3 bg-[#1a56db] text-white text-sm font-medium rounded-lg hover:bg-[#1648c0] disabled:opacity-60 transition"
        >
          {saving && <Loader2 size={15} className="animate-spin" />}
          {lessonId ? 'Salvar Alterações' : 'Criar Aula'}
        </button>
      </form>
    </div>
  )
}
