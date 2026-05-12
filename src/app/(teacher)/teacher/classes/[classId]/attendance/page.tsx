import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import AttendanceForm from './AttendanceForm'

type Student = { student_id: string; full_name: string }

function resolveOne<T>(val: T | T[] | null | undefined): T | null {
  if (!val) return null
  return Array.isArray(val) ? (val[0] ?? null) : val
}

export default async function AttendancePage({ params }: { params: { classId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()

  const [{ data: teacher }, { data: cls }] = await Promise.all([
    admin.from('teachers').select('id').eq('profile_id', user.id).single(),
    admin.from('classes').select('id, name, school_id, teacher_id').eq('id', params.classId).single(),
  ])

  if (!cls || !teacher || cls.teacher_id !== teacher.id) notFound()

  const { data: enrollments } = await admin
    .from('enrollments')
    .select('student_id, students!student_id(profile_id, profiles!profile_id(full_name))')
    .eq('class_id', params.classId)
    .eq('status', 'ACTIVE')

  const students: Student[] = (enrollments ?? []).flatMap(e => {
    const student = resolveOne((e as unknown as { students: unknown }).students)
    const profile = student ? resolveOne((student as { profiles: unknown }).profiles) : null
    if (!profile) return []
    return [{ student_id: e.student_id, full_name: (profile as { full_name: string }).full_name }]
  })

  students.sort((a, b) => a.full_name.localeCompare(b.full_name, 'pt-BR'))

  return (
    <div>
      <div className="mb-8">
        <p className="text-xs font-medium text-[#64748b] uppercase tracking-wide mb-1">Chamada</p>
        <h1 className="text-2xl font-bold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          {cls.name}
        </h1>
        <p className="text-sm text-[#64748b] mt-1">
          {students.length} aluno{students.length !== 1 ? 's' : ''} matriculado{students.length !== 1 ? 's' : ''}
        </p>
      </div>

      {students.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-10 text-center">
          <p className="text-sm text-[#64748b]">Nenhum aluno ativo matriculado nesta turma.</p>
        </div>
      ) : (
        <AttendanceForm
          classId={params.classId}
          schoolId={cls.school_id}
          students={students}
        />
      )}
    </div>
  )
}
