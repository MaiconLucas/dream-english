import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import LessonForm from '../../new/LessonForm'
import type { CourseLesson, LessonQuestion } from '@/types/course'

export default async function EditLessonPage({
  params,
}: {
  params: { moduleId: string; lessonId: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('school_id').eq('id', user.id).single()
  if (!profile) return null

  const { data: lesson } = await admin
    .from('course_lessons')
    .select('*')
    .eq('id', params.lessonId)
    .eq('school_id', profile.school_id)
    .single()

  if (!lesson) notFound()

  const { data: questions } = await admin
    .from('lesson_questions')
    .select('*')
    .eq('lesson_id', params.lessonId)
    .order('order_index')

  return (
    <LessonForm
      moduleId={params.moduleId}
      lessonId={params.lessonId}
      lesson={lesson as CourseLesson}
      questions={(questions ?? []) as LessonQuestion[]}
    />
  )
}
