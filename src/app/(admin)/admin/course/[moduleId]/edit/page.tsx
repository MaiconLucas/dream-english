import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import EditCourseModuleForm from './EditCourseModuleForm'

export default async function EditCourseModulePage({ params }: { params: { moduleId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('school_id').eq('id', user.id).single()
  if (!profile) return null

  const { data: mod } = await admin
    .from('course_modules')
    .select('id, title, description, cefr_level, order_index, is_published')
    .eq('id', params.moduleId)
    .eq('school_id', profile.school_id)
    .single()

  if (!mod) notFound()

  return <EditCourseModuleForm mod={mod} />
}
