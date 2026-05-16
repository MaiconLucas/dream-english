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
  planId: z.string(),
  classId: z.string(),
  level: z.string(),
  schoolId: z.string().min(1),
})

export type CreateStudentInput = z.infer<typeof createSchema>

export async function createStudent(
  input: CreateStudentInput
): Promise<{ error: string | null; studentId?: string }> {
  const parsed = createSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { fullName, email, phone, password, planId, classId, level, schoolId } = parsed.data
  const admin = createAdminClient()

  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, school_id: schoolId, phone: phone.trim() || null },
  })
  if (authError) {
    console.error('[createStudent] auth.admin.createUser error:', JSON.stringify(authError))
    if (authError.message.includes('already been registered') || authError.message.includes('already exists')) {
      return { error: 'Já existe um usuário com este email.' }
    }
    return { error: authError.message }
  }

  const userId = authData.user.id

  const { error: profileError } = await admin.from('profiles').insert({
    id: userId,
    school_id: schoolId,
    role: 'STUDENT',
    full_name: fullName,
    email,
    phone: phone.trim() || null,
    active: true,
  })
  if (profileError) {
    await admin.auth.admin.deleteUser(userId)
    return { error: profileError.message }
  }

  const { data: student, error: studentError } = await admin
    .from('students')
    .insert({
      profile_id: userId,
      school_id: schoolId,
      plan_id: planId.trim() || null,
      level: level.trim() || null,
    })
    .select('id')
    .single()

  if (studentError) {
    await admin.auth.admin.deleteUser(userId)
    return { error: studentError.message }
  }

  if (classId.trim()) {
    await admin.from('enrollments').insert({
      school_id: schoolId,
      student_id: student.id,
      class_id: classId.trim(),
      status: 'ACTIVE',
    })
  }

  if (planId.trim()) {
    const { data: plan } = await admin
      .from('plans')
      .select('price_cents, due_day')
      .eq('id', planId.trim())
      .single()

    if (plan) {
      const dueDay = (plan as unknown as { price_cents: number; due_day: number | null }).due_day ?? 10
      const priceCents = (plan as unknown as { price_cents: number }).price_cents
      const now = new Date()

      const paymentRows = Array.from({ length: 12 }, (_, i) => {
        const year = now.getFullYear() + Math.floor((now.getMonth() + i) / 12)
        const month = (now.getMonth() + i) % 12
        const lastDay = new Date(year, month + 1, 0).getDate()
        const day = Math.min(dueDay, lastDay)
        const dueDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        const referenceMonth = `${year}-${String(month + 1).padStart(2, '0')}`
        return {
          school_id: schoolId,
          student_id: student.id,
          plan_id: planId.trim(),
          amount_cents: priceCents,
          due_date: dueDate,
          status: 'PENDING',
          reference_month: referenceMonth,
          notes: `Mensalidade ${referenceMonth}`,
        }
      })

      await admin.from('payments').insert(paymentRows)
    }
  }

  revalidatePath('/admin/students')
  revalidatePath('/admin/finance')
  return { error: null, studentId: student.id as string }
}

// ─── update ─────────────────────────────────────────────────────────────────

const updateSchema = z.object({
  fullName: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  phone: z.string(),
  planId: z.string(),
  classId: z.string(),
  level: z.string(),
  active: z.boolean(),
})

export type UpdateStudentInput = z.infer<typeof updateSchema>

export async function updateStudent(
  studentId: string,
  profileId: string,
  schoolId: string,
  input: UpdateStudentInput
): Promise<{ error: string | null }> {
  const parsed = updateSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { fullName, phone, planId, classId, level, active } = parsed.data
  const admin = createAdminClient()

  const [pr, sr] = await Promise.all([
    admin
      .from('profiles')
      .update({ full_name: fullName, phone: phone.trim() || null, active })
      .eq('id', profileId),
    admin
      .from('students')
      .update({ plan_id: planId.trim() || null, level: level.trim() || null })
      .eq('id', studentId),
  ])

  if (pr.error) return { error: pr.error.message }
  if (sr.error) return { error: sr.error.message }

  const cid = classId.trim()
  if (cid) {
    await admin
      .from('enrollments')
      .update({ status: 'INACTIVE' })
      .eq('student_id', studentId)
      .neq('class_id', cid)

    await admin.from('enrollments').upsert(
      { school_id: schoolId, student_id: studentId, class_id: cid, status: 'ACTIVE' },
      { onConflict: 'student_id,class_id' }
    )
  }

  revalidatePath('/admin/students')
  revalidatePath(`/admin/students/${studentId}`)
  return { error: null }
}

// ─── legacy (AddStudentModal compat) ─────────────────────────────────────────

export async function addStudent(
  formData: FormData
): Promise<{ error: string | null; studentId?: string }> {
  return createStudent({
    fullName: (formData.get('fullName') as string) ?? '',
    email: (formData.get('email') as string) ?? '',
    phone: (formData.get('phone') as string) ?? '',
    password: (formData.get('password') as string) ?? '',
    planId: (formData.get('planId') as string) ?? '',
    classId: (formData.get('classId') as string) ?? '',
    level: (formData.get('level') as string) ?? '',
    schoolId: (formData.get('schoolId') as string) ?? '',
  })
}
