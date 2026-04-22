'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function addPayment(formData: FormData) {
  const studentId = formData.get('studentId') as string
  const amountCents = Math.round(parseFloat(formData.get('amount') as string) * 100)
  const dueDate = formData.get('dueDate') as string
  const referenceMonth = formData.get('referenceMonth') as string
  const status = (formData.get('status') as string) || 'PENDING'
  const schoolId = formData.get('schoolId') as string

  if (!studentId) return { error: 'Selecione um aluno.' }
  if (!dueDate) return { error: 'Informe o vencimento.' }
  if (isNaN(amountCents) || amountCents <= 0) return { error: 'Valor inválido.' }

  const admin = createAdminClient()

  const { error } = await admin.from('payments').insert({
    school_id: schoolId,
    student_id: studentId,
    amount_cents: amountCents,
    due_date: dueDate,
    reference_month: referenceMonth || null,
    status,
    paid_at: status === 'PAID' ? new Date().toISOString() : null,
  })

  if (error) return { error: error.message }

  revalidatePath('/admin/finance')
  return { success: true }
}
