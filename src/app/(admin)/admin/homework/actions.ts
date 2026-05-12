'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const createSchema = z.object({
  title: z.string().min(2, 'Título deve ter pelo menos 2 caracteres'),
  description: z.string().min(5, 'Enunciado deve ter pelo menos 5 caracteres'),
  classId: z.string().min(1, 'Selecione uma turma'),
  moduleId: z.string(),
  dueDate: z.string(),
  schoolId: z.string().min(1),
})

export type CreateHomeworkInput = z.infer<typeof createSchema>

export async function createHomework(
  input: CreateHomeworkInput
): Promise<{ error: string | null; homeworkId?: string }> {
  const parsed = createSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { title, description, classId, moduleId, dueDate, schoolId } = parsed.data
  const admin = createAdminClient()

  const insertData: Record<string, unknown> = {
    school_id: schoolId,
    title,
    description,
    class_id: classId,
    status: 'PUBLISHED',
    due_date: dueDate.trim() || null,
  }

  // module_id only if the column exists (added via migration)
  if (moduleId.trim()) {
    insertData.module_id = moduleId.trim()
  }

  const { data, error } = await admin
    .from('homework')
    .insert(insertData)
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/admin/homework')
  return { error: null, homeworkId: data.id as string }
}
