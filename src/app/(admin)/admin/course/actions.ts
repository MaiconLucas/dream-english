'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
// redirect is used only by deleteCourseModule and deleteCourseLesson

const CEFR = ['A1', 'A1/A2', 'A2', 'A2/B1', 'B1', 'B1/B2', 'B2', 'C1'] as const

async function getContext() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('school_id').eq('id', user.id).single()
  if (!profile?.school_id) throw new Error('Escola não encontrada')
  return { admin, schoolId: profile.school_id as string }
}

// ── MODULES ──────────────────────────────────────────────────

const moduleSchema = z.object({
  title: z.string().min(2, 'Título muito curto'),
  description: z.string().optional(),
  cefr_level: z.enum(CEFR, { error: 'Nível CEFR inválido' }),
  order_index: z.number().int().min(0, 'Ordem deve ser ≥ 0'),
  is_published: z.boolean(),
})

export async function createCourseModule(_: unknown, formData: FormData) {
  try {
    const { admin, schoolId } = await getContext()
    const parsed = moduleSchema.safeParse({
      title: formData.get('title'),
      description: (formData.get('description') as string) || undefined,
      cefr_level: formData.get('cefr_level'),
      order_index: Number(formData.get('order_index') ?? 0),
      is_published: formData.get('is_published') === 'true',
    })
    if (!parsed.success) return { error: parsed.error.issues[0].message }
    const { error } = await admin.from('course_modules').insert({ ...parsed.data, school_id: schoolId })
    if (error) return { error: error.message }
    revalidatePath('/admin/course')
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function updateCourseModule(_: unknown, formData: FormData) {
  const id = formData.get('id') as string
  try {
    const { admin } = await getContext()
    const parsed = moduleSchema.safeParse({
      title: formData.get('title'),
      description: (formData.get('description') as string) || undefined,
      cefr_level: formData.get('cefr_level'),
      order_index: Number(formData.get('order_index') ?? 0),
      is_published: formData.get('is_published') === 'true',
    })
    if (!parsed.success) return { error: parsed.error.issues[0].message }
    const { error } = await admin.from('course_modules').update(parsed.data).eq('id', id)
    if (error) return { error: error.message }
    revalidatePath('/admin/course')
    return {}
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function deleteCourseModule(moduleId: string) {
  try {
    const { admin } = await getContext()
    const { error } = await admin.from('course_modules').delete().eq('id', moduleId)
    if (error) return { error: error.message }
  } catch (e) {
    return { error: (e as Error).message }
  }
  revalidatePath('/admin/course')
  redirect('/admin/course')
}

// ── LESSONS ──────────────────────────────────────────────────

export type LessonPayload = {
  title: string
  grammar_focus?: string
  duration_min: number
  cefr_level: string
  status: 'DRAFT' | 'PUBLISHED'
  objectives: string[]
  theory: {
    explanation: string
    tip?: string
    headers?: string[]
    rows: { col1: string; col2: string; col3?: string }[]
  }
  activity: {
    type: 'game' | 'song'
    title: string
    duration_min: number
    instructions: string
    examples: string[]
  }
  song_exercise: {
    song_title: string
    artist: string
    verses: { text: string; blank_word: string }[]
    discussion_questions: string[]
  }
  homework_text?: string
  questions: Array<{ emoji?: string; question: string; follow_up?: string }>
}

export async function createCourseLesson(moduleId: string, payload: LessonPayload) {
  try {
    const { admin, schoolId } = await getContext()
    const { questions, ...lessonData } = payload
    const { count } = await admin
      .from('course_lessons')
      .select('id', { count: 'exact', head: true })
      .eq('module_id', moduleId)
    const nextIndex = (count ?? 0) + 1
    const { data: lesson, error } = await admin
      .from('course_lessons')
      .insert({ ...lessonData, module_id: moduleId, school_id: schoolId, order_index: nextIndex })
      .select('id')
      .single()
    if (error || !lesson) return { error: error?.message ?? 'Erro ao criar lição' }
    if (questions.length > 0) {
      const rows = questions.map((q, i) => ({ ...q, lesson_id: lesson.id, school_id: schoolId, order_index: i }))
      const { error: qErr } = await admin.from('lesson_questions').insert(rows)
      if (qErr) return { error: qErr.message }
    }
    revalidatePath(`/admin/course/${moduleId}`)
    return { id: lesson.id as string }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function updateCourseLesson(lessonId: string, moduleId: string, payload: LessonPayload) {
  try {
    const { admin, schoolId } = await getContext()
    const { questions, ...lessonData } = payload
    const { error } = await admin.from('course_lessons').update({
      ...lessonData,
      review_status: 'PENDING_REVIEW',
      review_note: null,
      reviewed_by: null,
      reviewed_at: null,
    }).eq('id', lessonId)
    if (error) return { error: error.message }
    await admin.from('lesson_questions').delete().eq('lesson_id', lessonId)
    if (questions.length > 0) {
      const rows = questions.map((q, i) => ({ ...q, lesson_id: lessonId, school_id: schoolId, order_index: i }))
      const { error: qErr } = await admin.from('lesson_questions').insert(rows)
      if (qErr) return { error: qErr.message }
    }
    revalidatePath(`/admin/course/${moduleId}`)
    revalidatePath(`/admin/course/${moduleId}/lessons/${lessonId}`)
    return { ok: true }
  } catch (e) {
    return { error: (e as Error).message }
  }
}

export async function deleteCourseLesson(lessonId: string, moduleId: string) {
  try {
    const { admin } = await getContext()
    const { error } = await admin.from('course_lessons').delete().eq('id', lessonId)
    if (error) return { error: error.message }
  } catch (e) {
    return { error: (e as Error).message }
  }
  revalidatePath(`/admin/course/${moduleId}`)
  redirect(`/admin/course/${moduleId}`)
}
