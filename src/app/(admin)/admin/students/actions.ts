'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function addStudent(formData: FormData) {
  const fullName = formData.get('fullName') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const level = formData.get('level') as string
  const planId = formData.get('planId') as string
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
    role: 'STUDENT',
    full_name: fullName,
    email,
  })

  if (profileError) {
    await admin.auth.admin.deleteUser(userId)
    return { error: profileError.message }
  }

  const { error: studentError } = await admin.from('students').insert({
    profile_id: userId,
    school_id: schoolId,
    plan_id: planId || null,
    level: level || null,
  })

  if (studentError) {
    await admin.auth.admin.deleteUser(userId)
    return { error: studentError.message }
  }

  revalidatePath('/admin/students')
  return { success: true }
}
