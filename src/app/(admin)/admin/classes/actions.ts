'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ─── schedule type ───────────────────────────────────────────────────────────

export type Schedule = { days: string[]; time: string; duration: number }

// ─── create ─────────────────────────────────────────────────────────────────

const createSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  teacherId: z.string(),
  level: z.string(),
  maxStudents: z.number().int().min(1, 'Capacidade mínima é 1'),
  active: z.boolean(),
  schedule: z.object({
    days: z.array(z.string()),
    time: z.string(),
    duration: z.number().int().min(1),
  }),
  schoolId: z.string().min(1),
})

export type CreateClassInput = z.infer<typeof createSchema>

export async function createClass(
  input: CreateClassInput
): Promise<{ error: string | null; classId?: string }> {
  const parsed = createSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { name, teacherId, level, maxStudents, active, schedule, schoolId } = parsed.data
  const admin = createAdminClient()

  const { data, error } = await admin
    .from('classes')
    .insert({
      school_id: schoolId,
      name,
      level: level.trim() || null,
      teacher_id: teacherId.trim() || null,
      max_students: maxStudents,
      active,
      schedule,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  revalidatePath('/admin/classes')
  return { error: null, classId: data.id as string }
}

// ─── update ─────────────────────────────────────────────────────────────────

const updateSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  teacherId: z.string(),
  moduleId: z.string(),
  level: z.string(),
  maxStudents: z.number().int().min(1, 'Capacidade mínima é 1'),
  active: z.boolean(),
  schedule: z.object({
    days: z.array(z.string()),
    time: z.string(),
    duration: z.number().int().min(1),
  }),
})

export type UpdateClassInput = z.infer<typeof updateSchema>

export async function updateClass(
  classId: string,
  input: UpdateClassInput
): Promise<{ error: string | null }> {
  const parsed = updateSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

  const { name, teacherId, moduleId, level, maxStudents, active, schedule } = parsed.data
  const admin = createAdminClient()

  const { error } = await admin
    .from('classes')
    .update({
      name,
      level: level.trim() || null,
      teacher_id: teacherId.trim() || null,
      module_id: moduleId.trim() || null,
      max_students: maxStudents,
      active,
      schedule,
    })
    .eq('id', classId)

  if (error) return { error: error.message }

  revalidatePath('/admin/classes')
  revalidatePath(`/admin/classes/${classId}`)
  return { error: null }
}

// ─── toggle active ───────────────────────────────────────────────────────────

export async function toggleClassActive(
  classId: string,
  active: boolean,
): Promise<{ error: string | null }> {
  const admin = createAdminClient()
  const { error } = await admin.from('classes').update({ active }).eq('id', classId)
  if (error) return { error: error.message }
  revalidatePath('/admin/classes')
  revalidatePath(`/admin/classes/${classId}`)
  return { error: null }
}

// ─── delete ─────────────────────────────────────────────────────────────────

export async function deleteClass(
  classId: string,
): Promise<{ error: string | null }> {
  const admin = createAdminClient()

  // Delete attendance records for all lessons in this class
  const { data: lessons } = await admin
    .from('lessons')
    .select('id')
    .eq('class_id', classId)

  if (lessons && lessons.length > 0) {
    const lessonIds = lessons.map((l) => l.id)
    const { error: e1 } = await admin.from('attendance').delete().in('lesson_id', lessonIds)
    if (e1) return { error: `attendance: ${e1.message}` }
  }

  const { error: e2 } = await admin.from('lessons').delete().eq('class_id', classId)
  if (e2) return { error: `lessons: ${e2.message}` }

  const { error: e3 } = await admin.from('enrollments').delete().eq('class_id', classId)
  if (e3) return { error: `enrollments: ${e3.message}` }

  const { error: e4 } = await admin.from('classes').delete().eq('id', classId)
  if (e4) return { error: `classes: ${e4.message}` }

  revalidatePath('/admin/classes')
  return { error: null }
}

// ─── legacy (AddClassModal compat) ───────────────────────────────────────────

export async function addClass(
  formData: FormData
): Promise<{ error: string | null; success?: boolean }> {
  const result = await createClass({
    name: (formData.get('name') as string) ?? '',
    teacherId: (formData.get('teacherId') as string) ?? '',
    level: (formData.get('level') as string) ?? '',
    maxStudents: parseInt((formData.get('maxStudents') as string) ?? '10') || 10,
    active: true,
    schedule: { days: [], time: '', duration: 60 },
    schoolId: (formData.get('schoolId') as string) ?? '',
  })
  return result.error ? { error: result.error } : { error: null, success: true }
}
