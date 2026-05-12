import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { BookOpen, ClipboardList, Users } from 'lucide-react'

type Schedule = { days: string[]; time: string; duration: number }

const DAY_SHORT: Record<string, string> = {
  Monday: 'Seg', Tuesday: 'Ter', Wednesday: 'Qua',
  Thursday: 'Qui', Friday: 'Sex', Saturday: 'Sáb', Sunday: 'Dom',
}

function scheduleLabel(schedule: Schedule | null): string {
  if (!schedule || (!schedule.days?.length && !schedule.time)) return '—'
  const days = (schedule.days ?? []).map(d => DAY_SHORT[d] ?? d).join(', ')
  const time = schedule.time ? ` · ${schedule.time}` : ''
  const dur = schedule.duration ? ` (${schedule.duration}min)` : ''
  return `${days}${time}${dur}`
}

export default async function TeacherDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  const { data: teacher } = await admin
    .from('teachers')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  if (!teacher) {
    return (
      <div>
        <p className="text-sm text-[#64748b]">Perfil de professor não encontrado.</p>
      </div>
    )
  }

  const { data: classes } = await admin
    .from('classes')
    .select('id, name, level, schedule, max_students')
    .eq('teacher_id', teacher.id)
    .eq('active', true)
    .order('name')

  const classIds = (classes ?? []).map(c => c.id)

  const { data: enrollCounts } = classIds.length
    ? await admin
        .from('enrollments')
        .select('class_id')
        .in('class_id', classIds)
        .eq('status', 'ACTIVE')
    : { data: [] }

  const countMap: Record<string, number> = {}
  for (const e of enrollCounts ?? []) {
    countMap[e.class_id] = (countMap[e.class_id] ?? 0) + 1
  }

  const firstName = (profile?.full_name ?? '').split(' ')[0]

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Olá, {firstName}! 👋
        </h1>
        <p className="text-sm text-[#64748b] mt-1">Suas turmas ativas.</p>
      </div>

      {(classes ?? []).length === 0 ? (
        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-10 flex flex-col items-center text-center">
          <BookOpen size={40} className="text-[#e2e8f0] mb-3" />
          <p className="text-sm text-[#64748b]">Nenhuma turma ativa atribuída a você ainda.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {(classes ?? []).map(cls => (
            <div key={cls.id} className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5">
              <p className="text-base font-semibold text-[#0f172a] mb-0.5">{cls.name}</p>
              <p className="text-xs text-[#64748b] mb-3">{cls.level ?? '—'}</p>
              <div className="flex items-center gap-4 text-xs text-[#94a3b8] mb-4">
                <span className="flex items-center gap-1">
                  <Users size={12} />
                  {countMap[cls.id] ?? 0}/{cls.max_students} alunos
                </span>
                <span>{scheduleLabel(cls.schedule as Schedule | null)}</span>
              </div>
              <Link
                href={`/teacher/classes/${cls.id}/attendance`}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#1a56db] text-white text-xs font-medium rounded-lg hover:bg-[#1648c0] transition"
              >
                <ClipboardList size={13} />
                Lançar Chamada
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
