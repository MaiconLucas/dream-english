import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Clock, Lock, CheckCircle } from 'lucide-react'

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

type Lesson = {
  id: string
  title: string
  grammar_focus: string | null
  duration_min: number
  cefr_level: string
  order_index: number
}

export default async function ModulePage({ params }: { params: { moduleId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles').select('school_id').eq('id', user.id).single()
  if (!profile) return null

  const { data: student } = await admin
    .from('students').select('id').eq('profile_id', user.id).single()

  const { data: mod } = await admin
    .from('course_modules')
    .select('id, title, description, cefr_level, order_index')
    .eq('id', params.moduleId)
    .eq('school_id', profile.school_id)
    .eq('is_published', true)
    .single()

  if (!mod) notFound()

  const { data: lessons } = await admin
    .from('course_lessons')
    .select('id, title, grammar_focus, duration_min, cefr_level, order_index')
    .eq('module_id', params.moduleId)
    .eq('status', 'PUBLISHED')
    .order('order_index')

  const lessonList = (lessons ?? []) as Lesson[]
  const lessonIds = lessonList.map(l => l.id)

  const { data: progressRows } = student && lessonIds.length
    ? await admin
        .from('lesson_progress')
        .select('lesson_id, completed')
        .eq('student_id', student.id)
        .in('lesson_id', lessonIds)
    : { data: [] }

  const completedSet = new Set(
    (progressRows ?? []).filter(p => p.completed).map(p => p.lesson_id)
  )

  function isLessonUnlocked(index: number): boolean {
    if (index === 0) return true
    return completedSet.has(lessonList[index - 1].id)
  }

  const totalDone = lessonIds.filter(id => completedSet.has(id)).length

  return (
    <div>
      <Link href="/trail" className="inline-flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#1a56db] transition mb-6">
        <ChevronLeft size={15} />
        Minha Trilha
      </Link>

      <div className="mb-6">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CEFR_COLORS[mod.cefr_level] ?? 'bg-gray-100 text-gray-600'}`}>
          {mod.cefr_level}
        </span>
        <h1 className="text-2xl font-bold text-[#0f172a] mt-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          {mod.title}
        </h1>
        {mod.description && <p className="text-sm text-[#64748b] mt-1">{mod.description}</p>}
        {lessonList.length > 0 && (
          <p className="text-xs text-[#94a3b8] mt-2">{totalDone} de {lessonList.length} aulas concluídas</p>
        )}
      </div>

      {lessonList.length === 0 ? (
        <div className="text-center py-10 text-sm text-[#64748b]">
          Nenhuma aula publicada neste módulo ainda.
        </div>
      ) : (
        <div className="space-y-3">
          {lessonList.map((lesson, index) => {
            const unlocked = isLessonUnlocked(index)
            const done = completedSet.has(lesson.id)

            return (
              <div
                key={lesson.id}
                className={`relative bg-white rounded-xl border shadow-sm overflow-hidden transition ${
                  !unlocked
                    ? 'opacity-60 cursor-not-allowed border-[#e2e8f0]'
                    : done
                    ? 'border-[#bbf7d0]'
                    : 'border-[#e2e8f0] hover:border-[#1a56db]'
                }`}
              >
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                    done ? 'bg-[#ecfdf5]' : unlocked ? 'bg-[#ebf3ff]' : 'bg-[#f1f5f9]'
                  }`}>
                    {!unlocked ? (
                      <Lock size={15} className="text-[#94a3b8]" />
                    ) : done ? (
                      <CheckCircle size={17} className="text-[#10b981]" />
                    ) : (
                      <span className="text-sm font-semibold text-[#1a56db]">{index + 1}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#0f172a] truncate">{lesson.title}</p>
                    {lesson.grammar_focus && (
                      <p className="text-xs text-[#64748b] truncate mt-0.5">{lesson.grammar_focus}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1 text-[10px] text-[#94a3b8]">
                        <Clock size={10} />{lesson.duration_min} min
                      </span>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${CEFR_COLORS[lesson.cefr_level] ?? 'bg-gray-100 text-gray-600'}`}>
                        {lesson.cefr_level}
                      </span>
                    </div>
                  </div>

                  {done ? (
                    <span className="text-[10px] font-semibold text-[#10b981] bg-[#ecfdf5] px-2.5 py-1 rounded-full flex-shrink-0">
                      Concluída
                    </span>
                  ) : unlocked ? (
                    <span className="text-[10px] font-semibold text-[#1a56db] bg-[#ebf3ff] px-2.5 py-1 rounded-full flex-shrink-0">
                      Estudar
                    </span>
                  ) : null}

                  <ChevronRight size={15} className={`flex-shrink-0 ${unlocked ? 'text-[#94a3b8]' : 'text-[#e2e8f0]'}`} />
                </div>

                {unlocked && (
                  <Link href={`/trail/${mod.id}/${lesson.id}`} className="absolute inset-0" aria-label={lesson.title} />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
