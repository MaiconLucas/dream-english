'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const createSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  description: z.string(),
  priceCents: z.number().int().min(1, 'Valor inválido'),
  dueDay: z.number().int().min(1).max(28, 'Dia deve ser entre 1 e 28'),
  schoolId: z.string().min(1),
})

export type CreatePlanInput = z.infer<typeof createSchema>

export async function createPlan(input: CreatePlanInput): Promise<{ error: string | null }> {
  const parsed = createSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { name, description, priceCents, dueDay, schoolId } = parsed.data
  const admin = createAdminClient()

  const { error } = await admin.from('plans').insert({
    school_id: schoolId,
    name,
    description: description.trim() || null,
    price_cents: priceCents,
    billing_cycle: 'monthly',
    due_day: dueDay,
    active: true,
  })

  if (error) return { error: error.message }

  revalidatePath('/admin/plans')
  return { error: null }
}
