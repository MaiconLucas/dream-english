'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function markAsPaid(paymentId: string): Promise<{ error: string | null }> {
  if (!paymentId) return { error: 'ID inválido.' }

  const admin = createAdminClient()
  const { error } = await admin
    .from('payments')
    .update({ status: 'PAID', paid_at: new Date().toISOString() })
    .eq('id', paymentId)

  if (error) return { error: error.message }

  revalidatePath('/admin/finance')
  return { error: null }
}
