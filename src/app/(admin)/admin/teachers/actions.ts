'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function addTeacher(formData: FormData) {
  const fullName = formData.get('fullName') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const specialties = (formData.get('specialties') as string)
    .split(',').map(s => s.trim()).filter(Boolean)
  const bio = formData.get('bio') as string
  const schoolId = formData.get('schoolId') as string

  const admin = createAdminClient()

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) return { error: authError.message }

  const userId = authData.user.id

  const { error: profileError } = await admin.from('profiles').insert({
    id: userId,
    school_id: schoolId,
    role: 'TEACHER',
    full_name: fullName,
    email,
  })

  if (profileError) {
    await admin.auth.admin.deleteUser(userId)
    return { error: profileError.message }
  }

  const { error: teacherError } = await admin.from('teachers').insert({
    profile_id: userId,
    school_id: schoolId,
    specialties,
    bio: bio || null,
  })

  if (teacherError) {
    await admin.auth.admin.deleteUser(userId)
    return { error: teacherError.message }
  }

  revalidatePath('/admin/teachers')
  return { success: true }
}
