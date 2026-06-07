import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, BookOpen } from 'lucide-react'
import TeacherTrailClient from './TeacherTrailClient'

export default async function TeacherClassTrailPage({ params }: { params: { classId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()

  const { data: teacher } = await admin
    .from('teachers')
    .select('id, school_id')
    .eq('profile_id', user.id)
    .single()

  if (!teacher) return null

  const { data: cls } = await admin
    .from('classes')
    .select('id, name, level, module_id')
    .eq('id', params.classId)
    .eq('teacher_id', teacher.id)
    .single()

  if (!cls) notFound()

  const moduleId = (cls as { id: string; name: string; level: string | null; module_id?: string | null }).module_id

  if (!moduleId) {
    return (
      <div>
        <Link href="/teacher/classes" className="inline-flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#1a56db] transition mb-6">
          <ChevronLeft size={15} />
          Minhas Turmas
        </Link>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            {cls.name}
          </h1>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-[#e2e8f0]">
          <BookOpen size={40} className="text-[#e2e8f0] mb-3" />
          <p className="text-sm text-[#64748b]">Esta turma não tem um módulo de curso vinculado.</p>
          <p className="text-xs text-[#94a3b8] mt-1">Peça ao administrador para vincular um módulo a esta turma.</p>
        </div>
      </div>
    )
  }

  const { data: lessons } = await admin
    .from('course_lessons')
    .select('id, title, grammar_focus, duration_min, order_index')
    .eq('module_id', moduleId)
    .eq('status', 'PUBLISHED')
    .order('order_index')

  const lessonList = lessons ?? []
  const lessonIds = lessonList.map(l => l.id)

  const { data: sessions } = lessonIds.length
    ? await admin
        .from('class_sessions')
        .select('id, lesson_id, status')
        .eq('class_id', params.classId)
        .in('lesson_id', lessonIds)
    : { data: [] }

  const sessionMap: Record<string, { id: string; status: string }> = {}
  for (const s of sessions ?? []) {
    sessionMap[s.lesson_id] = { id: s.id, status: s.status }
  }

  return (
    <div>
      <Link href="/teacher/classes" className="inline-flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#1a56db] transition mb-6">
        <ChevronLeft size={15} />
        Minhas Turmas
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          {cls.name}
        </h1>
        <p className="text-sm text-[#64748b] mt-1">{lessonList.length} aula{lessonList.length !== 1 ? 's' : ''} no módulo</p>
      </div>

      <TeacherTrailClient
        classId={params.classId}
        lessons={lessonList}
        sessionMap={sessionMap}
      />
    </div>
  )
}
