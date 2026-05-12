'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const LEVELS = ['Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Upper-Intermediate', 'Advanced'] as const

const baseSchema = z.object({
  title: z.string().min(2, 'Título deve ter pelo menos 2 caracteres'),
  description: z.string(),
  level: z.enum(LEVELS, { error: 'Nível inválido' }),
  orderIndex: z.number().int().min(0),
  content: z.string(),
  active: z.boolean(),
})

const createSchema = baseSchema.extend({ schoolId: z.string().min(1) })
export type CreateModuleInput = z.infer<typeof createSchema>

export async function createModule(
  input: CreateModuleInput
): Promise<{ error: string | null; moduleId?: string }> {
  const parsed = createSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { title, description, level, orderIndex, content, active, schoolId } = parsed.data
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('modules')
    .insert({
      school_id: schoolId,
      title,
      description: description.trim() || null,
      level,
      order_index: orderIndex,
      content: { body: content },
      active,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/admin/modules')
  return { error: null, moduleId: data.id as string }
}

export type UpdateModuleInput = z.infer<typeof baseSchema>

export async function updateModule(
  moduleId: string,
  input: UpdateModuleInput
): Promise<{ error: string | null }> {
  const parsed = baseSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { title, description, level, orderIndex, content, active } = parsed.data
  const admin = createAdminClient()

  const { error } = await admin
    .from('modules')
    .update({
      title,
      description: description.trim() || null,
      level,
      order_index: orderIndex,
      content: { body: content },
      active,
    })
    .eq('id', moduleId)

  if (error) return { error: error.message }
  revalidatePath('/admin/modules')
  revalidatePath(`/admin/modules/${moduleId}`)
  return { error: null }
}
