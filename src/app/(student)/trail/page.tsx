import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Lock, CheckCircle, ChevronRight, BookOpen } from 'lucide-react'

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

export default async function TrailPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles').select('school_id').eq('id', user.id).single()
  if (!profile) return null

  const { data: student } = await admin
    .from('students').select('id').eq('profile_id', user.id).single()

  const { data: modules } = await admin
    .from('course_modules')
    .select('id, title, description, cefr_level, order_index')
    .eq('school_id', profile.school_id)
    .eq('is_published', true)
    .order('order_index')

  if (!modules || modules.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-[#0f172a] mb-8" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Minha Trilha
        </h1>
        <div className="text-center py-16">
          <BookOpen size={32} className="mx-auto text-[#94a3b8] mb-3" />
          <p className="text-sm text-[#64748b]">Nenhuma aula disponível ainda.</p>
          <p className="text-xs text-[#94a3b8] mt-1">Aguarde seu professor publicar o conteúdo.</p>
        </div>
      </div>
    )
  }

  const moduleIds = modules.map(m => m.id)

  const { data: lessonRows } = await admin
    .from('course_lessons')
    .select('id, module_id')
    .in('module_id', moduleIds)
    .eq('status', 'PUBLISHED')

  const lessonsByModule: Record<string, string[]> = {}
  for (const l of lessonRows ?? []) {
    if (!lessonsByModule[l.module_id]) lessonsByModule[l.module_id] = []
    lessonsByModule[l.module_id].push(l.id)
  }

  const allLessonIds = (lessonRows ?? []).map(l => l.id)
  const { data: progressRows } = student && allLessonIds.length
    ? await admin
        .from('lesson_progress')
        .select('lesson_id, completed')
        .eq('student_id', student.id)
        .in('lesson_id', allLessonIds)
    : { data: [] }

  const completedSet = new Set(
    (progressRows ?? []).filter(p => p.completed).map(p => p.lesson_id)
  )

  function moduleProgress(moduleId: string) {
    const ids = lessonsByModule[moduleId] ?? []
    const total = ids.length
    const done = ids.filter(id => completedSet.has(id)).length
    return { total, done, isDone: total > 0 && done === total }
  }

  function isUnlocked(index: number): boolean {
    if (index === 0) return true
    return moduleProgress(modules![index - 1].id).isDone
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Minha Trilha
        </h1>
        <p className="text-sm text-[#64748b] mt-1">
          {modules.length} módulo{modules.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="space-y-3">
        {modules.map((mod, index) => {
          const { total, done, isDone } = moduleProgress(mod.id)
          const unlocked = isUnlocked(index)
          const pct = total > 0 ? Math.round((done / total) * 100) : 0

          return (
            <div
              key={mod.id}
              className={`relative bg-white rounded-xl border shadow-sm overflow-hidden transition ${
                !unlocked
                  ? 'opacity-60 cursor-not-allowed border-[#e2e8f0]'
                  : isDone
                  ? 'border-[#bbf7d0]'
                  : 'border-[#e2e8f0] hover:border-[#1a56db]'
              }`}
            >
              <div className="flex items-center gap-4 px-5 py-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isDone ? 'bg-[#ecfdf5]' : unlocked ? 'bg-[#ebf3ff]' : 'bg-[#f1f5f9]'
                }`}>
                  {!unlocked ? (
                    <Lock size={16} className="text-[#94a3b8]" />
                  ) : isDone ? (
                    <CheckCircle size={18} className="text-[#10b981]" />
                  ) : (
                    <span className="text-sm font-bold text-[#1a56db]">{index + 1}</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CEFR_COLORS[mod.cefr_level] ?? 'bg-gray-100 text-gray-600'}`}>
                      {mod.cefr_level}
                    </span>
                    {isDone && (
                      <span className="text-[10px] font-semibold text-[#10b981] bg-[#ecfdf5] px-2 py-0.5 rounded-full">Concluído</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-[#0f172a] truncate">{mod.title}</p>
                  {mod.description && (
                    <p className="text-xs text-[#64748b] truncate mt-0.5">{mod.description}</p>
                  )}
                  {total > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${isDone ? 'bg-[#10b981]' : 'bg-[#1a56db]'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-[#94a3b8] flex-shrink-0">{done}/{total} aulas</span>
                    </div>
                  )}
                </div>

                <ChevronRight size={16} className={`flex-shrink-0 ${unlocked ? 'text-[#94a3b8]' : 'text-[#e2e8f0]'}`} />
              </div>

              {unlocked && (
                <Link href={`/trail/${mod.id}`} className="absolute inset-0" aria-label={`Abrir ${mod.title}`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
