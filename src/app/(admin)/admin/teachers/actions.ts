'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ─── create ─────────────────────────────────────────────────────────────────

const createSchema = z.object({
  fullName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string(),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  specialties: z.array(z.string()),
  bio: z.string(),
  schoolId: z.string().min(1),
})

export type CreateTeacherInput = z.infer<typeof createSchema>

export async function createTeacher(
  input: CreateTeacherInput
): Promise<{ error: string | null; teacherId?: string }> {
  const parsed = createSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { fullName, email, phone, password, specialties, bio, schoolId } = parsed.data
  const admin = createAdminClient()

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, school_id: schoolId, phone: phone.trim() || null },
  })
  if (authError) {
    console.error('[createTeacher] auth error:', JSON.stringify(authError))
    if (authError.message.includes('already')) return { error: 'Já existe um usuário com este email.' }
    return { error: authError.message }
  }

  const userId = authData.user.id

  const { error: profileError } = await admin.from('profiles').insert({
    id: userId,
    school_id: schoolId,
    role: 'TEACHER',
    full_name: fullName,
    email,
    phone: phone.trim() || null,
    active: true,
  })
  if (profileError) {
    await admin.auth.admin.deleteUser(userId)
    return { error: profileError.message }
  }

  const { data: teacher, error: teacherError } = await admin
    .from('teachers')
    .insert({
      profile_id: userId,
      school_id: schoolId,
      specialties: specialties.filter(Boolean),
      bio: bio.trim() || null,
    })
    .select('id')
    .single()

  if (teacherError) {
    await admin.auth.admin.deleteUser(userId)
    return { error: teacherError.message }
  }

  revalidatePath('/admin/teachers')
  return { error: null, teacherId: teacher.id as string }
}

// ─── update ─────────────────────────────────────────────────────────────────

const updateSchema = z.object({
  fullName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  phone: z.string(),
  specialties: z.array(z.string()),
  bio: z.string(),
  active: z.boolean(),
})

export type UpdateTeacherInput = z.infer<typeof updateSchema>

export async function updateTeacher(
  teacherId: string,
  profileId: string,
  input: UpdateTeacherInput
): Promise<{ error: string | null }> {
  const parsed = updateSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { fullName, phone, specialties, bio, active } = parsed.data
  const admin = createAdminClient()

  const [pr, tr] = await Promise.all([
    admin
      .from('profiles')
      .update({ full_name: fullName, phone: phone.trim() || null, active })
      .eq('id', profileId),
    admin
      .from('teachers')
      .update({ specialties: specialties.filter(Boolean), bio: bio.trim() || null })
      .eq('id', teacherId),
  ])

  if (pr.error) return { error: pr.error.message }
  if (tr.error) return { error: tr.error.message }

  revalidatePath('/admin/teachers')
  revalidatePath(`/admin/teachers/${teacherId}`)
  return { error: null }
}

// ─── legacy (AddTeacherModal compat) ─────────────────────────────────────────

export async function addTeacher(
  formData: FormData
): Promise<{ error: string | null; success?: boolean }> {
  const result = await createTeacher({
    fullName: (formData.get('fullName') as string) ?? '',
    email: (formData.get('email') as string) ?? '',
    phone: (formData.get('phone') as string) ?? '',
    password: (formData.get('password') as string) ?? '',
    specialties: ((formData.get('specialties') as string) ?? '')
      .split(',').map((s) => s.trim()).filter(Boolean),
    bio: (formData.get('bio') as string) ?? '',
    schoolId: (formData.get('schoolId') as string) ?? '',
  })
  return result.error ? { error: result.error } : { error: null, success: true }
}
