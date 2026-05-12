import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { BookOpen, ClipboardList, History, Users } from 'lucide-react'

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

export default async function TeacherClassesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()

  const { data: teacher } = await admin
    .from('teachers')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  const { data: classes } = teacher
    ? await admin
        .from('classes')
        .select('id, name, level, schedule, max_students, active')
        .eq('teacher_id', teacher.id)
        .order('name')
    : { data: [] }

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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Minhas Turmas
        </h1>
        <p className="text-sm text-[#64748b] mt-1">
          {(classes ?? []).length} turma{(classes ?? []).length !== 1 ? 's' : ''} atribuída{(classes ?? []).length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        {(classes ?? []).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen size={40} className="text-[#e2e8f0] mb-3" />
            <p className="text-sm text-[#64748b]">Nenhuma turma atribuída a você ainda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                  {['Nome', 'Nível', 'Horário', 'Alunos ativos', 'Status', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[#64748b] uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(classes ?? []).map(cls => (
                  <tr key={cls.id} className="border-b border-[#f1f5f9] last:border-0 hover:bg-[#f8fafc] transition">
                    <td className="px-4 py-3 font-medium text-[#0f172a]">{cls.name}</td>
                    <td className="px-4 py-3 text-[#64748b]">{cls.level ?? '—'}</td>
                    <td className="px-4 py-3 text-[#64748b] whitespace-nowrap text-xs">
                      {scheduleLabel(cls.schedule as Schedule | null)}
                    </td>
                    <td className="px-4 py-3 text-[#64748b]">
                      <span className="flex items-center gap-1.5 tabular-nums">
                        <Users size={13} className="text-[#94a3b8]" />
                        {countMap[cls.id] ?? 0}/{cls.max_students}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        cls.active ? 'bg-[#ecfdf5] text-[#10b981]' : 'bg-[#f1f5f9] text-[#64748b]'
                      }`}>
                        {cls.active ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/teacher/classes/${cls.id}/attendance`}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#1a56db] hover:underline"
                        >
                          <ClipboardList size={13} />
                          Chamada
                        </Link>
                        <Link
                          href={`/teacher/classes/${cls.id}/history`}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#64748b] hover:text-[#1a56db] hover:underline"
                        >
                          <History size={13} />
                          Histórico
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
