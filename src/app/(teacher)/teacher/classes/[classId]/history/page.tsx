import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, ClipboardList } from 'lucide-react'

type AttendanceEntry = { student_name: string; status: string }
type LessonRow = { id: string; title: string; scheduled_at: string; entries: AttendanceEntry[] }

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

export default async function ClassHistoryPage({ params }: { params: { classId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()

  const [{ data: teacher }, { data: cls }] = await Promise.all([
    admin.from('teachers').select('id').eq('profile_id', user.id).single(),
    admin.from('classes').select('id, name, teacher_id').eq('id', params.classId).single(),
  ])

  if (!cls || !teacher || cls.teacher_id !== teacher.id) notFound()

  const { data: rawLessons } = await admin
    .from('lessons')
    .select(`
      id, title, scheduled_at,
      attendance!lesson_id(
        status,
        students!student_id(profiles!profile_id(full_name))
      )
    `)
    .eq('class_id', params.classId)
    .order('scheduled_at', { ascending: false })

  const lessons: LessonRow[] = (rawLessons ?? []).map(l => {
    const raw = l as unknown as {
      id: string; title: string; scheduled_at: string
      attendance: Array<{ status: string; students: unknown }>
    }
    const entries: AttendanceEntry[] = (raw.attendance ?? []).flatMap(a => {
      const student = resolveOne(a.students)
      const profile = student ? resolveOne((student as { profiles: unknown }).profiles) : null
      if (!profile) return []
      return [{ student_name: (profile as { full_name: string }).full_name, status: a.status }]
    })
    entries.sort((a, b) => a.student_name.localeCompare(b.student_name, 'pt-BR'))
    return { id: raw.id, title: raw.title, scheduled_at: raw.scheduled_at, entries }
  })

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/teacher/classes"
          className="inline-flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#1a56db] transition mb-4"
        >
          <ChevronLeft size={15} />
          Minhas Turmas
        </Link>
        <h1 className="text-2xl font-bold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Histórico — {cls.name}
        </h1>
        <p className="text-sm text-[#64748b] mt-1">{lessons.length} aula{lessons.length !== 1 ? 's' : ''} registrada{lessons.length !== 1 ? 's' : ''}</p>
      </div>

      {lessons.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-10 flex flex-col items-center text-center">
          <ClipboardList size={40} className="text-[#e2e8f0] mb-3" />
          <p className="text-sm text-[#64748b]">Nenhuma aula registrada para esta turma ainda.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {lessons.map(lesson => {
            const date = new Date(lesson.scheduled_at).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
            const presentCount = lesson.entries.filter(e => e.status === 'PRESENT').length
            return (
              <details key={lesson.id} className="group bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer list-none hover:bg-[#f8fafc] transition">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#0f172a] truncate">{lesson.title}</p>
                      <p className="text-xs text-[#64748b] mt-0.5">{date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                    <span className="text-xs text-[#64748b] tabular-nums">
                      {presentCount}/{lesson.entries.length} presentes
                    </span>
                    <svg className="w-4 h-4 text-[#94a3b8] transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </summary>
                <div className="border-t border-[#f1f5f9]">
                  {lesson.entries.length === 0 ? (
                    <p className="px-5 py-4 text-sm text-[#64748b]">Nenhum aluno registrado nesta aula.</p>
                  ) : (
                    <table className="w-full text-sm">
                      <tbody>
                        {lesson.entries.map((e, i) => {
                          const badge = BADGE[e.status] ?? { label: e.status, className: 'bg-[#f1f5f9] text-[#64748b]' }
                          return (
                            <tr key={i} className="border-b border-[#f1f5f9] last:border-0">
                              <td className="px-5 py-2.5 text-[#0f172a] font-medium">{e.student_name}</td>
                              <td className="px-5 py-2.5 text-right">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
                                  {badge.label}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </details>
            )
          })}
        </div>
      )}
    </div>
  )
}
