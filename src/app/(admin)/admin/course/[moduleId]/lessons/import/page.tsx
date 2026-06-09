'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft, Sparkles, Loader2, CheckCircle, AlertCircle,
  Copy, Check, ChevronDown, ChevronUp,
} from 'lucide-react'
import { createCourseLesson, type LessonPayload } from '../../../actions'

// ── Template prompt the user copies into their AI ─────────────────────────────

const TEMPLATE_PROMPT = `Converta o texto da aula abaixo para este JSON exato (sem texto fora do JSON):

{
  "title": "string",
  "grammar_focus": "string",
  "duration_min": 50,
  "cefr_level": "A1",
  "objectives": ["string"],
  "theory": {
    "explanation": "string",
    "tip": "string ou null",
    "headers": ["Col1", "Col2", "Col3"],
    "rows": [{ "col1": "string", "col2": "string", "col3": "string ou null" }]
  },
  "activity": {
    "type": "game",
    "title": "string",
    "duration_min": 15,
    "instructions": "string",
    "examples": ["string"]
  },
  "song_exercise": {
    "song_title": "string ou null",
    "artist": "string ou null",
    "verses": [{ "text": "frase com ___ no lugar da lacuna", "blank_word": "a resposta" }],
    "discussion_questions": ["string"]
  },
  "homework_text": "string ou null",
  "questions": [
    { "emoji": "🙂", "question": "string", "follow_up": "string ou null" }
  ]
}

Regras:
- cefr_level deve ser um de: A1, A1/A2, A2, A2/B1, B1, B1/B2, B2, C1
- Nos versos da música, substitua a palavra-lacuna por ___ e coloque a palavra correta em blank_word
- Se uma seção não existir no texto, use null ou array vazio
- Responda SOMENTE com o JSON, sem markdown ou explicações

TEXTO DA AULA:
[COLE AQUI O TEXTO DA SUA AULA]`

// ── Types ─────────────────────────────────────────────────────────────────────

type ImportedLesson = LessonPayload & { cefr_level: string; status: 'DRAFT' | 'PUBLISHED' }

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true)
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
      {open && <div className="px-5 pb-5 pt-2 space-y-3 border-t border-[#f1f5f9]">{children}</div>}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ImportLessonPage({ params }: { params: { moduleId: string } }) {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [jsonText, setJsonText] = useState('')
  const [parseError, setParseError] = useState('')
  const [lesson, setLesson] = useState<ImportedLesson | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  function copyPrompt() {
    navigator.clipboard.writeText(TEMPLATE_PROMPT)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleParse() {
    setParseError('')
    setLesson(null)
    const trimmed = jsonText.trim()
    if (!trimmed) { setParseError('Cole o JSON gerado pela IA.'); return }

    // Extract JSON even if wrapped in markdown code blocks
    const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/) ?? trimmed.match(/(\{[\s\S]*\})/)
    const raw = match ? (match[1] ?? match[0]) : trimmed

    try {
      const parsed = JSON.parse(raw) as ImportedLesson
      if (!parsed.title) { setParseError('JSON inválido: campo "title" não encontrado.'); return }
      parsed.status = 'DRAFT'
      // Normalise arrays that AI might leave as null
      parsed.objectives = parsed.objectives ?? []
      parsed.questions = parsed.questions ?? []
      parsed.theory = parsed.theory ?? { explanation: '', rows: [] }
      parsed.theory.rows = parsed.theory.rows ?? []
      parsed.theory.headers = parsed.theory.headers ?? []
      parsed.activity = parsed.activity ?? { type: 'game', title: '', duration_min: 15, instructions: '', examples: [] }
      parsed.activity.examples = parsed.activity.examples ?? []
      parsed.song_exercise = parsed.song_exercise ?? { song_title: '', artist: '', verses: [], discussion_questions: [] }
      parsed.song_exercise.verses = parsed.song_exercise.verses ?? []
      parsed.song_exercise.discussion_questions = parsed.song_exercise.discussion_questions ?? []
      setLesson(parsed)
    } catch {
      setParseError('JSON inválido. Verifique se a IA retornou somente o JSON.')
    }
  }

  async function handleCreate() {
    if (!lesson) return
    setSaving(true)
    setSaveError('')
    const result = await createCourseLesson(params.moduleId, lesson)
    setSaving(false)
    if ('error' in result && result.error) { setSaveError(result.error); return }
    if ('id' in result && result.id) {
      router.push(`/admin/course/${params.moduleId}/lessons/${result.id}/edit`)
    } else {
      router.push(`/admin/course/${params.moduleId}`)
    }
  }

  return (
    <div className="max-w-2xl">
      <Link
        href={`/admin/course/${params.moduleId}`}
        className="inline-flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#1a56db] transition mb-6"
      >
        <ChevronLeft size={15} />
        Voltar ao módulo
      </Link>

      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={18} className="text-[#1a56db]" />
        <h1 className="text-xl font-bold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Importar Aula
        </h1>
      </div>
      <p className="text-sm text-[#64748b] mb-6">
        Use o ChatGPT, Claude ou qualquer IA com o prompt abaixo para converter sua aula em JSON, depois cole o resultado aqui.
      </p>

      {/* Step 1 – copy prompt */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5 mb-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-[#0f172a]">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#1a56db] text-white text-[10px] font-bold mr-2">1</span>
            Copie este prompt e cole na sua IA preferida
          </p>
          <button
            onClick={copyPrompt}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#e2e8f0] rounded-lg hover:bg-[#f8fafc] transition text-[#374151]"
          >
            {copied ? <Check size={12} className="text-[#10b981]" /> : <Copy size={12} />}
            {copied ? 'Copiado!' : 'Copiar prompt'}
          </button>
        </div>
        <pre className="text-[11px] text-[#64748b] bg-[#f8fafc] rounded-lg p-4 overflow-x-auto whitespace-pre-wrap leading-relaxed border border-[#f1f5f9] max-h-48 overflow-y-auto">
          {TEMPLATE_PROMPT}
        </pre>
      </div>

      {/* Step 2 – paste JSON */}
      {!lesson && (
        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5 mb-5">
          <p className="text-sm font-semibold text-[#0f172a] mb-3">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#1a56db] text-white text-[10px] font-bold mr-2">2</span>
            Cole o JSON gerado pela IA
          </p>
          <textarea
            value={jsonText}
            onChange={e => { setJsonText(e.target.value); setParseError('') }}
            rows={12}
            placeholder={'{\n  "title": "...",\n  "grammar_focus": "...",\n  ...\n}'}
            className="w-full px-3 py-2.5 rounded-lg border border-[#e2e8f0] text-sm text-[#0f172a] font-mono placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#1a56db] resize-none"
          />
          {parseError && (
            <div className="flex items-center gap-2 mt-2 text-xs text-[#ef4444]">
              <AlertCircle size={13} />
              {parseError}
            </div>
          )}
          <button
            onClick={handleParse}
            disabled={!jsonText.trim()}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 bg-[#1a56db] text-white text-sm font-medium rounded-lg hover:bg-[#1648c0] disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Verificar e visualizar
          </button>
        </div>
      )}

      {/* Preview */}
      {lesson && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-4 bg-[#ecfdf5] border border-[#bbf7d0] rounded-xl">
            <CheckCircle size={16} className="text-[#10b981] flex-shrink-0" />
            <p className="text-sm font-medium text-[#065f46]">JSON válido! Revise abaixo e crie a aula como rascunho.</p>
          </div>

          <Section title="Informações básicas">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-medium text-[#94a3b8] uppercase tracking-wide mb-1">Título</p>
                <p className="text-sm font-semibold text-[#0f172a]">{lesson.title}</p>
              </div>
              <div>
                <p className="text-[10px] font-medium text-[#94a3b8] uppercase tracking-wide mb-1">Foco Gramatical</p>
                <p className="text-sm text-[#374151]">{lesson.grammar_focus || '—'}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-1 flex-wrap">
              <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">{lesson.cefr_level || 'A1'}</span>
              <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-[#f1f5f9] text-[#64748b]">{lesson.duration_min} min</span>
            </div>
          </Section>

          {lesson.objectives.length > 0 && (
            <Section title="Objetivos">
              <ul className="space-y-1">
                {lesson.objectives.map((o, i) => <li key={i} className="text-sm text-[#374151] flex gap-2"><span className="text-[#1a56db]">·</span>{o}</li>)}
              </ul>
            </Section>
          )}

          {lesson.theory?.explanation && (
            <Section title="Teoria Gramatical">
              <p className="text-sm text-[#374151] whitespace-pre-wrap leading-relaxed">{lesson.theory.explanation}</p>
              {lesson.theory.tip && (
                <div className="bg-[#fffbeb] border border-[#fde68a] rounded-lg px-4 py-2">
                  <p className="text-xs font-semibold text-[#92400e]">Dica</p>
                  <p className="text-sm text-[#78350f]">{lesson.theory.tip}</p>
                </div>
              )}
              {lesson.theory.rows.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-[#e2e8f0]">
                  <table className="w-full text-sm">
                    {lesson.theory.headers && lesson.theory.headers.length > 0 && (
                      <thead className="bg-[#f8fafc]">
                        <tr>{lesson.theory.headers.map((h, i) => <th key={i} className="px-4 py-2 text-left text-xs font-semibold text-[#374151]">{h}</th>)}</tr>
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

          {lesson.activity?.title && (
            <Section title="Atividade">
              <p className="text-sm font-semibold text-[#0f172a]">{lesson.activity.title}</p>
              {lesson.activity.instructions && <p className="text-sm text-[#374151] whitespace-pre-wrap">{lesson.activity.instructions}</p>}
              {lesson.activity.examples.length > 0 && (
                <ul className="space-y-1">{lesson.activity.examples.map((e, i) => <li key={i} className="text-sm text-[#374151] italic">· {e}</li>)}</ul>
              )}
            </Section>
          )}

          {lesson.song_exercise?.song_title && (
            <Section title="Exercício de Música">
              <p className="text-sm font-semibold text-[#0f172a]">{lesson.song_exercise.song_title} — {lesson.song_exercise.artist}</p>
              {lesson.song_exercise.verses.length > 0 && (
                <div className="space-y-2">
                  {lesson.song_exercise.verses.map((v, i) => (
                    <p key={i} className="text-sm font-mono text-[#374151]">
                      {v.text} <span className="ml-2 text-[#1a56db] font-sans font-medium not-italic">→ {v.blank_word}</span>
                    </p>
                  ))}
                </div>
              )}
            </Section>
          )}

          {lesson.questions.length > 0 && (
            <Section title="Perguntas de Conversação">
              <div className="space-y-3">
                {lesson.questions.map((q, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-lg flex-shrink-0 leading-snug">{q.emoji || '·'}</span>
                    <div>
                      <p className="text-sm font-medium text-[#0f172a]">{q.question}</p>
                      {q.follow_up && <p className="text-xs text-[#64748b] mt-0.5">↳ {q.follow_up}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {lesson.homework_text && (
            <Section title="Homework">
              <p className="text-sm text-[#374151] whitespace-pre-wrap">{lesson.homework_text}</p>
            </Section>
          )}

          {saveError && (
            <div className="flex items-center gap-2 text-sm text-[#ef4444] bg-red-50 border border-red-200 rounded-lg px-4 py-3">
              <AlertCircle size={14} />
              {saveError}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              onClick={handleCreate}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#1a56db] text-white text-sm font-medium rounded-lg hover:bg-[#1648c0] disabled:opacity-60 transition"
            >
              {saving && <Loader2 size={15} className="animate-spin" />}
              Criar Rascunho e Editar
            </button>
            <button
              onClick={() => { setLesson(null); setJsonText('') }}
              className="px-5 py-3 text-sm font-medium text-[#64748b] border border-[#e2e8f0] rounded-lg hover:bg-[#f8fafc] transition"
            >
              Voltar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
