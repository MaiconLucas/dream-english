'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function addClass(formData: FormData) {
  const name = formData.get('name') as string
  const level = formData.get('level') as string
  const teacherId = formData.get('teacherId') as string
  const maxStudents = parseInt(formData.get('maxStudents') as string) || 10
  const schoolId = formData.get('schoolId') as string

  const admin = createAdminClient()

  const { error } = await admin.from('classes').insert({
    school_id: schoolId,
    name,
    level: level || null,
    teacher_id: teacherId || null,
    max_students: maxStudents,
  })

  if (error) return { error: error.message }

  revalidatePath('/admin/classes')
  return { success: true }
}
