import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { BookOpen, CheckCircle, ChevronRight, Clock, ArrowRight } from 'lucide-react'
import { formatDate } from '@/lib/utils'

type PendingHw = {
  id: string
  homework_id: string
  homework: { id: string; title: string; due_date: string | null } | null
}

export default async function StudentDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, school_id')
    .eq('id', user.id)
    .single()
  if (!profile) return null

  const { data: student } = await admin
    .from('students')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  const { data: modules } = await admin
    .from('course_modules')
    .select('id, title, order_index')
    .eq('school_id', profile.school_id)
    .eq('is_published', true)
    .order('order_index')

  const moduleIds = (modules ?? []).map(m => m.id)

  const { data: lessonRows } = moduleIds.length
    ? await admin
        .from('course_lessons')
        .select('id, module_id, title, duration_min, order_index')
        .in('module_id', moduleIds)
        .eq('status', 'PUBLISHED')
        .order('order_index')
    : { data: [] }

  const lessons = lessonRows ?? []
  const lessonIds = lessons.map(l => l.id)

  const { data: progressRows } = student && lessonIds.length
    ? await admin
        .from('lesson_progress')
        .select('lesson_id')
        .eq('student_id', student.id)
        .eq('completed', true)
        .in('lesson_id', lessonIds)
    : { data: [] }

  const completedSet = new Set((progressRows ?? []).map(p => p.lesson_id))
  const totalLessons = lessons.length
  const completedCount = completedSet.size
  const pct = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

  const moduleOrderMap: Record<string, number> = {}
  for (const m of modules ?? []) moduleOrderMap[m.id] = m.order_index

  const sortedLessons = [...lessons].sort((a, b) => {
    const modDiff = (moduleOrderMap[a.module_id] ?? 0) - (moduleOrderMap[b.module_id] ?? 0)
    return modDiff !== 0 ? modDiff : a.order_index - b.order_index
  })

  const nextLesson = sortedLessons.find(l => !completedSet.has(l.id))
  const nextModule = nextLesson ? (modules ?? []).find(m => m.id === nextLesson.module_id) : null

  const { data: pendingHw } = student
    ? await admin
        .from('hw_submissions')
        .select('id, homework_id, homework:homework!homework_id(id, title, due_date)')
        .eq('student_id', student.id)
        .eq('status', 'PENDING')
        .limit(3)
    : { data: [] }

  const firstName = (profile.full_name ?? '').split(' ')[0]
  const allDone = totalLessons > 0 && completedCount === totalLessons

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Olá, {firstName}! 👋
        </h1>
        <p className="text-sm text-[#64748b] mt-1">Aqui está seu resumo de aprendizado.</p>
      </div>

      {/* Progresso geral */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Progresso geral
          </h2>
          <span className="text-sm font-bold text-[#1a56db]">{pct}%</span>
        </div>
        <div className="h-2 bg-[#f1f5f9] rounded-full overflow-hidden mb-2">
          <div
            className={`h-full rounded-full transition-all ${allDone ? 'bg-[#10b981]' : 'bg-[#1a56db]'}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-[#64748b]">{completedCount} de {totalLessons} aulas concluídas</p>
      </div>

      {/* Próxima aula */}
      {nextLesson && nextModule && (
        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5 mb-4">
          <h2 className="text-sm font-semibold text-[#0f172a] mb-3" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            📚 Próxima aula
          </h2>
          <p className="text-xs text-[#64748b] mb-0.5">{nextModule.title}</p>
          <p className="text-base font-semibold text-[#0f172a] mb-1">{nextLesson.title}</p>
          <p className="flex items-center gap-1 text-xs text-[#94a3b8] mb-4">
            <Clock size={11} />
            {nextLesson.duration_min} min
          </p>
          <Link
            href={`/trail/${nextLesson.module_id}/${nextLesson.id}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1a56db] text-white text-sm font-medium rounded-lg hover:bg-[#1648c0] transition"
          >
            Continuar
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* Trilha concluída */}
      {allDone && (
        <div className="bg-[#ecfdf5] rounded-xl border border-[#bbf7d0] p-5 mb-4 flex items-center gap-3">
          <CheckCircle size={20} className="text-[#10b981] flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-[#065f46]">Trilha concluída!</p>
            <p className="text-xs text-[#047857] mt-0.5">Você completou todas as aulas disponíveis.</p>
          </div>
        </div>
      )}

      {/* Homework pendente */}
      {(pendingHw ?? []).length > 0 && (
        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5 mb-4">
          <h2 className="text-sm font-semibold text-[#0f172a] mb-3" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            📝 Homework pendente
          </h2>
          <div className="space-y-2">
            {(pendingHw as unknown as PendingHw[]).map(sub => (
              <Link
                key={sub.id}
                href={`/homework/${sub.homework_id}`}
                className="flex items-center justify-between py-2.5 px-3 rounded-lg border border-[#f1f5f9] hover:bg-[#f8fafc] transition"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#0f172a] truncate">{sub.homework?.title ?? '—'}</p>
                  {sub.homework?.due_date && (
                    <p className="text-xs text-[#94a3b8] mt-0.5">Prazo: {formatDate(sub.homework.due_date)}</p>
                  )}
                </div>
                <ChevronRight size={14} className="text-[#94a3b8] flex-shrink-0 ml-2" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Ver trilha completa */}
      <Link
        href="/trail"
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-[#e2e8f0] bg-white text-sm font-medium text-[#64748b] hover:border-[#1a56db] hover:text-[#1a56db] transition"
      >
        <BookOpen size={15} />
        Ver trilha completa
      </Link>
    </div>
  )
}
