'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function completeLesson(lessonId: string, moduleId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autenticado' }

  const admin = createAdminClient()

  const { data: profile } = await admin
    .from('profiles').select('school_id').eq('id', user.id).single()
  if (!profile) return { error: 'Perfil não encontrado' }

  const { data: student } = await admin
    .from('students').select('id').eq('profile_id', user.id).single()
  if (!student) return { error: 'Aluno não encontrado' }

  const { error } = await admin
    .from('lesson_progress')
    .upsert(
      {
        lesson_id: lessonId,
        student_id: student.id,
        school_id: profile.school_id,
        completed: true,
        completed_at: new Date().toISOString(),
      },
      { onConflict: 'student_id,lesson_id' }
    )

  if (error) return { error: error.message }

  revalidatePath(`/trail/${moduleId}/${lessonId}`)
  revalidatePath(`/trail/${moduleId}`)
  revalidatePath('/trail')
  return { ok: true }
}
