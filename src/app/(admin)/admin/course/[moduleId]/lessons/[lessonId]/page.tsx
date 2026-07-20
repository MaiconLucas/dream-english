import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Clock, Pencil } from 'lucide-react'
import { CEFR_COLORS } from '../../../constants'
import type { CourseLesson, LessonQuestion } from '@/types/course'

export default async function LessonDetailPage({
  params,
}: {
  params: { moduleId: string; lessonId: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('school_id').eq('id', user.id).single()
  if (!profile) return null

  const { data: lesson } = await admin
    .from('course_lessons')
    .select('*')
    .eq('id', params.lessonId)
    .eq('school_id', profile.school_id)
    .single()

  if (!lesson) notFound()

  const { data: questions } = await admin
    .from('lesson_questions')
    .select('*')
    .eq('lesson_id', params.lessonId)
    .order('order_index')

  const l = lesson as CourseLesson
  const qs = (questions ?? []) as LessonQuestion[]
  const theory = l.theory ?? {}
  const activity = l.activity ?? {}
  const song = l.song_exercise ?? {}

  return (
    <div className="max-w-2xl">
      <Link
        href={`/admin/course/${params.moduleId}`}
        className="inline-flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#1a56db] transition mb-6"
      >
        <ChevronLeft size={15} />
        Voltar ao Módulo
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-6 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CEFR_COLORS[l.cefr_level] ?? 'bg-gray-100 text-gray-600'}`}>
                {l.cefr_level}
              </span>
              {l.status === 'PUBLISHED' ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#ecfdf5] text-[#10b981]">Publicado</span>
              ) : (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f8fafc] text-[#94a3b8]">Rascunho</span>
              )}
              <span className="flex items-center gap-1 text-[10px] text-[#94a3b8]"><Clock size={10} />{l.duration_min} min</span>
            </div>
            <h1 className="text-xl font-bold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>{l.title}</h1>
            {l.grammar_focus && <p className="text-sm text-[#64748b] mt-1">{l.grammar_focus}</p>}
          </div>
          <Link
            href={`/admin/course/${params.moduleId}/lessons/${params.lessonId}/edit`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#64748b] border border-[#e2e8f0] rounded-lg hover:bg-[#f1f5f9] transition flex-shrink-0"
          >
            <Pencil size={12} /> Editar
          </Link>
        </div>
      </div>

      {l.review_status === 'CHANGES_REQUESTED' && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-5 mb-4">
          <p className="text-xs font-semibold text-amber-800 mb-1">ALTERAÇÃO SOLICITADA PELO PROFESSOR</p>
          <p className="text-sm text-amber-950 whitespace-pre-wrap">{l.review_note}</p>
          <Link href={`/admin/course/${params.moduleId}/lessons/${params.lessonId}/edit`} className="inline-flex mt-3 text-xs font-semibold text-[#1a56db] hover:underline">Editar conteúdo para nova revisão</Link>
        </div>
      )}

      {l.review_status === 'APPROVED' && (
        <div className="bg-emerald-50 rounded-xl border border-emerald-200 px-5 py-3 mb-4 text-sm font-medium text-emerald-800">
          Conteúdo revisado e aprovado pelo professor.
        </div>
      )}

      {/* Objectives */}
      {l.objectives?.length > 0 && (
        <Section title="Objetivos">
          <ul className="space-y-1">
            {l.objectives.map((o: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[#374151]">
                <span className="text-[#1a56db] font-bold mt-0.5">·</span>{o}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {/* Theory */}
      {theory.explanation && (
        <Section title="Teoria Gramatical">
          <p className="text-sm text-[#374151] whitespace-pre-wrap">{theory.explanation}</p>
          {theory.tip && (
            <div className="mt-3 bg-[#fffbeb] border border-[#fde68a] rounded-lg px-4 py-2.5">
              <p className="text-xs font-semibold text-[#92400e] mb-0.5">Dica</p>
              <p className="text-sm text-[#78350f]">{theory.tip}</p>
            </div>
          )}
          {theory.rows?.length > 0 && (
            <div className="mt-3 overflow-x-auto rounded-lg border border-[#e2e8f0]">
              <table className="w-full text-sm">
                {(theory.headers ?? []).length > 0 && (
                  <thead className="bg-[#f8fafc]">
                    <tr>
                      {(theory.headers ?? []).map((h: string, i: number) => (
                        <th key={i} className="px-4 py-2.5 text-left text-xs font-semibold text-[#374151]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                )}
                <tbody className="divide-y divide-[#f1f5f9]">
                  {theory.rows.map((r: { col1: string; col2: string; col3?: string }, i: number) => (
                    <tr key={i}>
                      <td className="px-4 py-2.5 text-[#0f172a]">{r.col1}</td>
                      <td className="px-4 py-2.5 text-[#374151]">{r.col2}</td>
                      {r.col3 && <td className="px-4 py-2.5 text-[#374151]">{r.col3}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>
      )}

      {/* Activity */}
      {activity.title && (
        <Section title="Atividade Principal">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#ebf3ff] text-[#1a56db]">
              {activity.type === 'game' ? 'Jogo' : 'Música'}
            </span>
            <span className="text-xs text-[#94a3b8]">{activity.duration_min} min</span>
          </div>
          <p className="text-sm font-semibold text-[#0f172a]">{activity.title}</p>
          {activity.instructions && <p className="text-sm text-[#374151] mt-2 whitespace-pre-wrap">{activity.instructions}</p>}
          {activity.examples?.length > 0 && (
            <div className="mt-3 space-y-1">
              {activity.examples.map((ex: string, i: number) => (
                <p key={i} className="text-sm text-[#374151] italic">· {ex}</p>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* Song exercise */}
      {song.song_title && (
        <Section title="Exercício de Música">
          <p className="text-sm font-semibold text-[#0f172a]">{song.song_title} — {song.artist}</p>
          {song.verses?.length > 0 && (
            <div className="mt-3 space-y-2">
              {song.verses.map((v: { text: string; blank_word: string }, i: number) => (
                <div key={i} className="bg-[#f8fafc] rounded-lg px-4 py-2.5">
                  <p className="text-sm text-[#374151]">{v.text}</p>
                  <p className="text-xs text-[#1a56db] font-medium mt-1">→ {v.blank_word}</p>
                </div>
              ))}
            </div>
          )}
          {song.discussion_questions?.length > 0 && (
            <div className="mt-3">
              <p className="text-xs font-semibold text-[#374151] mb-1">Discussão</p>
              <ul className="space-y-1">
                {song.discussion_questions.map((q: string, i: number) => (
                  <li key={i} className="text-sm text-[#374151]">· {q}</li>
                ))}
              </ul>
            </div>
          )}
        </Section>
      )}

      {/* Conversation questions */}
      {qs.length > 0 && (
        <Section title={`Perguntas de Conversação (${qs.length})`}>
          <div className="space-y-3">
            {qs.map((q, i) => (
              <div key={q.id} className="flex gap-3">
                <span className="text-lg flex-shrink-0">{q.emoji ?? `${i + 1}.`}</span>
                <div>
                  <p className="text-sm text-[#0f172a]">{q.question}</p>
                  {q.follow_up && <p className="text-xs text-[#64748b] mt-0.5">↳ {q.follow_up}</p>}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Homework */}
      {l.homework_text && (
        <Section title="Homework">
          <p className="text-sm text-[#374151] whitespace-pre-wrap">{l.homework_text}</p>
        </Section>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5 mb-4">
      <h2 className="text-sm font-semibold text-[#0f172a] mb-3 pb-2 border-b border-[#f1f5f9]">{title}</h2>
      {children}
    </div>
  )
}
