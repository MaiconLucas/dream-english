import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Clock } from 'lucide-react'
import type { CourseLesson, LessonQuestion, SongExercise } from '@/types/course'
import SongExerciseComponent from './SongExercise'
import CompleteButton from './CompleteButton'

const CEFR_COLORS: Record<string, string> = {
  'A1':    'bg-emerald-50 text-emerald-700',
  'A1/A2': 'bg-emerald-50 text-emerald-700',
  'A2':    'bg-blue-50 text-blue-700',
  'A2/B1': 'bg-blue-50 text-blue-700',
  'B1':    'bg-violet-50 text-violet-700',
  'B1/B2': 'bg-violet-50 text-violet-700',
  'B2':    'bg-orange-50 text-orange-700',
  'C1':    'bg-red-50 text-red-700',
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5 mb-4">
      {children}
    </div>
  )
}

export default async function LessonPage({
  params,
}: {
  params: { moduleId: string; lessonId: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles').select('school_id').eq('id', user.id).single()
  if (!profile) return null

  const { data: student } = await admin
    .from('students').select('id').eq('profile_id', user.id).single()

  const { data: lesson } = await admin
    .from('course_lessons')
    .select('*')
    .eq('id', params.lessonId)
    .eq('module_id', params.moduleId)
    .eq('status', 'PUBLISHED')
    .single()

  if (!lesson) notFound()

  const { data: questions } = await admin
    .from('lesson_questions')
    .select('*')
    .eq('lesson_id', params.lessonId)
    .order('order_index')

  const { data: progress } = student
    ? await admin
        .from('lesson_progress')
        .select('completed')
        .eq('lesson_id', params.lessonId)
        .eq('student_id', student.id)
        .maybeSingle()
    : { data: null }

  const l = lesson as CourseLesson
  const qs = (questions ?? []) as LessonQuestion[]
  const theory = (l.theory ?? {}) as {
    explanation?: string
    tip?: string
    headers?: string[]
    rows?: { col1: string; col2: string; col3?: string }[]
  }
  const activity = (l.activity ?? {}) as {
    type?: string
    title?: string
    duration_min?: number
    instructions?: string
    examples?: string[]
  }
  const song = (l.song_exercise ?? {}) as SongExercise
  const isCompleted = progress?.completed ?? false

  return (
    <div className="max-w-2xl">
      <Link
        href={`/trail/${params.moduleId}`}
        className="inline-flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#1a56db] transition mb-6"
      >
        <ChevronLeft size={15} />
        Voltar ao módulo
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CEFR_COLORS[l.cefr_level] ?? 'bg-gray-100 text-gray-600'}`}>
            {l.cefr_level}
          </span>
          <span className="flex items-center gap-1 text-[10px] text-[#94a3b8]">
            <Clock size={10} />{l.duration_min} min
          </span>
          {isCompleted && (
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#ecfdf5] text-[#10b981]">Concluída</span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          {l.title}
        </h1>
        {l.grammar_focus && <p className="text-sm text-[#64748b] mt-1">{l.grammar_focus}</p>}
      </div>

      {/* Objectives */}
      {l.objectives?.length > 0 && (
        <Card>
          <h2 className="text-sm font-semibold text-[#0f172a] mb-3">🎯 Objetivos da Aula</h2>
          <ul className="space-y-1.5">
            {l.objectives.map((o: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-[#374151]">
                <span className="text-[#1a56db] font-bold mt-0.5 flex-shrink-0">·</span>
                {o}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Theory */}
      {theory.explanation && (
        <Card>
          <h2 className="text-sm font-semibold text-[#0f172a] mb-3">📖 Gramática</h2>
          <p className="text-sm text-[#374151] whitespace-pre-wrap leading-relaxed">{theory.explanation}</p>
          {theory.tip && (
            <div className="mt-3 bg-[#fffbeb] border border-[#fde68a] rounded-lg px-4 py-2.5">
              <p className="text-xs font-semibold text-[#92400e] mb-0.5">💡 Dica</p>
              <p className="text-sm text-[#78350f]">{theory.tip}</p>
            </div>
          )}
          {theory.rows && theory.rows.length > 0 && (
            <div className="mt-4 overflow-x-auto rounded-lg border border-[#e2e8f0]">
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
                  {theory.rows.map((r, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2.5 font-medium text-[#0f172a]">{r.col1}</td>
                      <td className="px-4 py-2.5 text-[#374151]">{r.col2}</td>
                      {r.col3 && <td className="px-4 py-2.5 text-[#374151]">{r.col3}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Activity */}
      {activity.title && (
        <Card>
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-sm font-semibold text-[#0f172a]">
              {activity.type === 'game' ? '🎮' : '🎵'} Atividade
            </h2>
            {activity.duration_min && (
              <span className="text-[10px] text-[#94a3b8]">{activity.duration_min} min</span>
            )}
          </div>
          <p className="text-sm font-semibold text-[#0f172a] mb-2">{activity.title}</p>
          {activity.instructions && (
            <p className="text-sm text-[#374151] whitespace-pre-wrap leading-relaxed">{activity.instructions}</p>
          )}
          {activity.examples && activity.examples.length > 0 && (
            <div className="mt-3 space-y-1">
              {activity.examples.map((ex: string, i: number) => (
                <p key={i} className="text-sm text-[#374151] italic">· {ex}</p>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Song exercise */}
      {song.song_title && (
        <Card>
          <h2 className="text-sm font-semibold text-[#0f172a] mb-4">🎵 Fill the Gap</h2>
          <SongExerciseComponent exercise={song} />
        </Card>
      )}

      {/* Conversation questions */}
      {qs.length > 0 && (
        <Card>
          <h2 className="text-sm font-semibold text-[#0f172a] mb-4">💬 Perguntas de Conversação</h2>
          <div className="space-y-4">
            {qs.map((q) => (
              <div key={q.id} className="flex gap-3">
                <span className="text-xl flex-shrink-0 leading-tight">{q.emoji ?? '·'}</span>
                <div>
                  <p className="text-sm font-medium text-[#0f172a]">{q.question}</p>
                  {q.follow_up && (
                    <p className="text-xs text-[#64748b] mt-1">↳ {q.follow_up}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Homework */}
      {l.homework_text && (
        <Card>
          <h2 className="text-sm font-semibold text-[#0f172a] mb-3">📝 Homework</h2>
          <p className="text-sm text-[#374151] whitespace-pre-wrap leading-relaxed">{l.homework_text}</p>
        </Card>
      )}

      {/* Complete button */}
      {student && (
        <div className="mt-2 mb-8">
          <CompleteButton
            lessonId={params.lessonId}
            moduleId={params.moduleId}
            completed={isCompleted}
          />
        </div>
      )}
    </div>
  )
}
