'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ─── create ─────────────────────────────────────────────────────────────────

const createSchema = z.object({
  fullName:        z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email:           z.string().email('Email inválido'),
  phone:           z.string(),
  password:        z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  classId:         z.string(),
  level:           z.string(),
  schoolId:        z.string().min(1),
  monthlyFeeCents: z.number().int().min(0),
  discountPercent: z.number().min(0).max(100),
  firstDueDate:    z.string().min(1, 'Informe a data do 1° vencimento'),
})

export type CreateStudentInput = z.infer<typeof createSchema>

export async function createStudent(
  input: CreateStudentInput
): Promise<{ error: string | null; studentId?: string }> {
  const parsed = createSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { fullName, email, phone, password, classId, level, schoolId,
          monthlyFeeCents, discountPercent, firstDueDate } = parsed.data
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
      profile_id:       userId,
      school_id:        schoolId,
      level:             level.trim() || null,
      monthly_fee_cents: monthlyFeeCents,
      discount_percent:  discountPercent,
      first_due_date:    firstDueDate,
    })
    .select('id')
    .single()

  if (studentError) {
    await admin.auth.admin.deleteUser(userId)
    return { error: studentError.message }
  }

  if (classId.trim()) {
    await admin.from('enrollments').insert({
      school_id:  schoolId,
      student_id: student.id,
      class_id:   classId.trim(),
      status:     'ACTIVE',
    })
  }

  // Generate 12 payments: first on firstDueDate, then +1 month each
  if (monthlyFeeCents > 0) {
    const finalAmountCents = Math.round(monthlyFeeCents * (1 - discountPercent / 100))
    const base = new Date(firstDueDate + 'T12:00:00Z')
    const baseDay   = base.getUTCDate()
    const baseMonth = base.getUTCMonth()
    const baseYear  = base.getUTCFullYear()

    const paymentRows = Array.from({ length: 12 }, (_, i) => {
      const year    = baseYear + Math.floor((baseMonth + i) / 12)
      const month   = (baseMonth + i) % 12
      const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
      const day     = Math.min(baseDay, lastDay)
      const dueDate        = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const referenceMonth = `${year}-${String(month + 1).padStart(2, '0')}`
      return {
        school_id:       schoolId,
        student_id:      student.id,
        amount_cents:    finalAmountCents,
        due_date:        dueDate,
        status:          'PENDING',
        reference_month: referenceMonth,
        notes:           `Mensalidade ${referenceMonth}`,
      }
    })

    await admin.from('payments').insert(paymentRows)
  }

  revalidatePath('/admin/students')
  revalidatePath('/admin/finance')
  return { error: null, studentId: student.id as string }
}

// ─── update ─────────────────────────────────────────────────────────────────

const updateSchema = z.object({
  fullName:         z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  phone:            z.string(),
  classId:          z.string(),
  level:            z.string(),
  active:           z.boolean(),
  enrollmentActive: z.boolean(),
  monthlyFeeCents:  z.number().int().min(0),
  discountPercent:  z.number().min(0).max(100),
  firstDueDate:     z.string(),
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

  const { fullName, phone, classId, level, active, enrollmentActive,
          monthlyFeeCents, discountPercent, firstDueDate } = parsed.data
  const admin = createAdminClient()

  const [pr, sr] = await Promise.all([
    admin
      .from('profiles')
      .update({ full_name: fullName, phone: phone.trim() || null, active })
      .eq('id', profileId),
    admin
      .from('students')
      .update({
        level:             level.trim() || null,
        monthly_fee_cents: monthlyFeeCents,
        discount_percent:  discountPercent,
        first_due_date:    firstDueDate || null,
      })
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
      { school_id: schoolId, student_id: studentId, class_id: cid, status: enrollmentActive ? 'ACTIVE' : 'INACTIVE' },
      { onConflict: 'student_id,class_id' }
    )
  }

  revalidatePath('/admin/students')
  revalidatePath(`/admin/students/${studentId}`)
  return { error: null }
}

// ─── change password ────────────────────────────────────────────────────────

export async function changeStudentPassword(
  profileId: string,
  password: string,
): Promise<{ error: string | null }> {
  if (password.length < 6) return { error: 'Senha deve ter pelo menos 6 caracteres.' }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.updateUserById(profileId, { password })
  if (error) return { error: error.message }
  return { error: null }
}

// ─── delete ─────────────────────────────────────────────────────────────────

export async function deleteStudent(
  studentId: string,
  profileId: string,
): Promise<{ error: string | null }> {
  const admin = createAdminClient()

  const { error: e1 } = await admin.from('attendance').delete().eq('student_id', studentId)
  if (e1) return { error: `attendance: ${e1.message}` }

  const { error: e2 } = await admin.from('payments').delete().eq('student_id', studentId)
  if (e2) return { error: `payments: ${e2.message}` }

  const { error: e3 } = await admin.from('enrollments').delete().eq('student_id', studentId)
  if (e3) return { error: `enrollments: ${e3.message}` }

  const { error: e4 } = await admin.from('students').delete().eq('id', studentId)
  if (e4) return { error: `students: ${e4.message}` }

  const { error: e5 } = await admin.from('profiles').delete().eq('id', profileId)
  if (e5) return { error: `profiles: ${e5.message}` }

  const { error: e6 } = await admin.auth.admin.deleteUser(profileId)
  if (e6) return { error: `auth: ${e6.message}` }

  revalidatePath('/admin/students')
  revalidatePath('/admin/finance')
  return { error: null }
}
