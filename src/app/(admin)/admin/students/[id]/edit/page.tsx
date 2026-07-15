import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import EditStudentForm from './EditStudentForm'

export default async function EditStudentPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()

  const { data: myProfile } = await admin
    .from('profiles')
    .select('school_id')
    .eq('id', user.id)
    .single()
  if (!myProfile) return null

  const [{ data: student }, { data: classes }] = await Promise.all([
    admin
      .from('students')
      .select(`
        id, level, profile_id, monthly_fee_cents, discount_percent, first_due_date,
        profiles!profile_id(full_name, email, phone, active),
        enrollments!student_id(status, class_id, classes!class_id(name))
      `)
      .eq('id', params.id)
      .eq('school_id', myProfile.school_id)
      .single(),
    admin.from('classes').select('id, name').eq('school_id', myProfile.school_id).order('name'),
  ])

  if (!student) notFound()

  const profile = Array.isArray(student.profiles) ? student.profiles[0] : student.profiles
  const enrollments = (student.enrollments ?? []) as Array<{ status: string; class_id: string; classes: unknown }>
  const activeEnrollment = enrollments.find((e) => e.status === 'ACTIVE') ?? enrollments[0]

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/admin/students/${params.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#1a56db] transition mb-4"
        >
          <ChevronLeft size={15} />
          Voltar para detalhes
        </Link>
        <h1
          className="text-2xl font-bold text-[#0f172a]"
          style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          Editar Aluno
        </h1>
        <p className="text-sm text-[#64748b] mt-1">{profile?.full_name ?? '—'}</p>
      </div>

      <EditStudentForm
        studentId={params.id}
        profileId={student.profile_id}
        schoolId={myProfile.school_id}
        classes={classes ?? []}
        defaults={{
          fullName:         profile?.full_name ?? '',
          phone:            profile?.phone ?? '',
          classId:          activeEnrollment?.class_id ?? '',
          level:            student.level ?? '',
          active:           profile?.active ?? true,
          enrollmentActive: activeEnrollment?.status === 'ACTIVE',
          monthlyFee:       ((student.monthly_fee_cents as number) ?? 0) / 100,
          discountPercent:  (student.discount_percent as number) ?? 0,
          firstDueDate:     (student.first_due_date as string) ?? '',
        }}
      />
    </div>
  )
}
