import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import EditClassForm from './EditClassForm'
import type { Schedule } from '../../actions'

export default async function EditClassPage({ params }: { params: { id: string } }) {
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

  const [{ data: cls }, { data: rawTeachers }] = await Promise.all([
    admin
      .from('classes')
      .select('id, name, level, max_students, active, schedule, teacher_id')
      .eq('id', params.id)
      .eq('school_id', myProfile.school_id)
      .single(),
    admin
      .from('teachers')
      .select('id, profiles!profile_id(full_name, active)')
      .eq('school_id', myProfile.school_id),
  ])

  if (!cls) notFound()

  type RawTeacher = { id: string; profiles: { full_name: string; active: boolean } | { full_name: string; active: boolean }[] | null }
  const teachers = ((rawTeachers ?? []) as unknown as RawTeacher[])
    .map((t) => {
      const p = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles
      return { id: t.id, name: p?.full_name ?? '—', active: p?.active ?? false }
    })
    .filter((t) => t.active)

  const schedule = (cls.schedule as Schedule | null) ?? { days: [], time: '', duration: 60 }

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/admin/classes/${params.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#1a56db] transition mb-4"
        >
          <ChevronLeft size={15} />
          Voltar para detalhes
        </Link>
        <h1
          className="text-2xl font-bold text-[#0f172a]"
          style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          Editar Turma
        </h1>
        <p className="text-sm text-[#64748b] mt-1">{cls.name}</p>
      </div>

      <EditClassForm
        classId={params.id}
        teachers={teachers}
        defaults={{
          name: cls.name,
          teacherId: cls.teacher_id ?? '',
          level: cls.level ?? '',
          maxStudents: cls.max_students,
          active: cls.active,
          scheduleDays: schedule.days ?? [],
          scheduleTime: schedule.time ?? '',
          scheduleDuration: schedule.duration ?? 60,
        }}
      />
    </div>
  )
}
