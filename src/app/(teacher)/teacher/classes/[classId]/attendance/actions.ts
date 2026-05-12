'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { AttendanceStatus } from '@/types/database'

type Record = { studentId: string; status: AttendanceStatus }

export async function saveAttendance(
  classId: string,
  date: string,
  records: Record[]
): Promise<{ error: string | null }> {
  if (!classId || !date || !records.length) return { error: 'Dados inválidos.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado.' }

  const admin = createAdminClient()

  const [{ data: teacher }, { data: cls }] = await Promise.all([
    admin.from('teachers').select('id').eq('profile_id', user.id).single(),
    admin.from('classes').select('school_id, name').eq('id', classId).single(),
  ])

  if (!teacher) return { error: 'Professor não encontrado.' }
  if (!cls) return { error: 'Turma não encontrada.' }

  const { data: lesson, error: lessonError } = await admin
    .from('lessons')
    .insert({
      school_id: cls.school_id,
      class_id: classId,
      teacher_id: teacher.id,
      title: `Aula — ${cls.name}`,
      scheduled_at: date,
      duration_minutes: 60,
      completed: true,
    })
    .select('id')
    .single()

  if (lessonError || !lesson) return { error: lessonError?.message ?? 'Erro ao criar aula.' }

  const attendanceRows = records.map(r => ({
    school_id: cls.school_id,
    lesson_id: lesson.id,
    student_id: r.studentId,
    status: r.status,
    notes: null,
  }))

  const { error: attendanceError } = await admin
    .from('attendance')
    .upsert(attendanceRows, { onConflict: 'lesson_id,student_id' })

  if (attendanceError) return { error: attendanceError.message }

  revalidatePath(`/teacher/classes/${classId}/attendance`)
  return { error: null }
}
