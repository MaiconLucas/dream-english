import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { ClipboardList } from 'lucide-react'

type AttendanceRow = {
  id: string
  status: string
  scheduled_at: string
  lesson_title: string
  class_name: string
}

const BADGE: Record<string, { label: string; className: string }> = {
  PRESENT:   { label: 'Presente',    className: 'bg-[#ecfdf5] text-[#10b981]' },
  ABSENT:    { label: 'Ausente',     className: 'bg-red-50 text-red-600' },
  LATE:      { label: 'Atrasado',    className: 'bg-amber-50 text-[#f59e0b]' },
  JUSTIFIED: { label: 'Justificado', className: 'bg-[#ebf3ff] text-[#1a56db]' },
}

function resolveOne<T>(val: T | T[] | null | undefined): T | null {
  if (!val) return null
  return Array.isArray(val) ? (val[0] ?? null) : val
}

export default async function StudentAttendancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()

  const { data: student } = await admin
    .from('students')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  if (!student) return null

  const { data: raw } = await admin
    .from('attendance')
    .select('id, status, created_at, lessons!lesson_id(title, scheduled_at, classes!class_id(name))')
    .eq('student_id', student.id)

  const rows: AttendanceRow[] = (raw ?? []).map(a => {
    const lesson = resolveOne((a as unknown as { lessons: unknown; created_at: string }).lessons)
    const l = lesson as { title: string; scheduled_at: string; classes: unknown } | null
    const cls = l ? resolveOne(l.classes) : null
    return {
      id: a.id,
      status: a.status,
      scheduled_at: l?.scheduled_at ?? (a as unknown as { created_at: string }).created_at,
      lesson_title: l?.title ?? '—',
      class_name: cls ? (cls as { name: string }).name : '—',
    }
  })

  rows.sort((a, b) => b.scheduled_at.localeCompare(a.scheduled_at))

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Minha Presença
        </h1>
        <p className="text-sm text-[#64748b] mt-1">{rows.length} aula{rows.length !== 1 ? 's' : ''} registrada{rows.length !== 1 ? 's' : ''}</p>
      </div>

      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ClipboardList size={40} className="text-[#e2e8f0] mb-3" />
            <p className="text-sm text-[#64748b]">Nenhum registro de presença encontrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                  {['Data da aula', 'Turma', 'Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[#64748b] uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(r => {
                  const badge = BADGE[r.status] ?? { label: r.status, className: 'bg-[#f1f5f9] text-[#64748b]' }
                  const date = new Date(r.scheduled_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
                  return (
                    <tr key={r.id} className="border-b border-[#f1f5f9] last:border-0 hover:bg-[#f8fafc] transition">
                      <td className="px-4 py-3 text-[#0f172a] whitespace-nowrap">{date}</td>
                      <td className="px-4 py-3 text-[#64748b]">{r.class_name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
                          {badge.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
