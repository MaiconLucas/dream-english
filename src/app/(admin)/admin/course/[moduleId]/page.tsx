import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ChevronLeft, Plus, Pencil, Clock, BookOpen, Sparkles } from 'lucide-react'
import { CEFR_COLORS } from '../constants'
import { DeleteModuleButton, DeleteLessonButton } from '../DeleteButtons'

type Lesson = {
  id: string
  title: string
  grammar_focus: string | null
  duration_min: number
  cefr_level: string
  status: string
  order_index: number
}

export default async function CourseModulePage({ params }: { params: { moduleId: string } }) {
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

  const { data: lessons } = await admin
    .from('course_lessons')
    .select('id, title, grammar_focus, duration_min, cefr_level, status, order_index')
    .eq('module_id', params.moduleId)
    .order('order_index')

  return (
    <div>
      <Link href="/admin/course" className="inline-flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#1a56db] transition mb-6">
        <ChevronLeft size={15} />
        Conteúdo do Curso
      </Link>

      {/* Module header */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CEFR_COLORS[mod.cefr_level] ?? 'bg-gray-100 text-gray-600'}`}>
                {mod.cefr_level}
              </span>
              <span className="text-[10px] text-[#94a3b8]">Módulo {mod.order_index + 1}</span>
              {mod.is_published ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#ecfdf5] text-[#10b981]">Publicado</span>
              ) : (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f8fafc] text-[#94a3b8]">Rascunho</span>
              )}
            </div>
            <h1 className="text-xl font-bold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              {mod.title}
            </h1>
            {mod.description && <p className="text-sm text-[#64748b] mt-1">{mod.description}</p>}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href={`/admin/course/${mod.id}/edit`}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#64748b] border border-[#e2e8f0] rounded-lg hover:bg-[#f1f5f9] transition"
            >
              <Pencil size={12} />
              Editar
            </Link>
            <DeleteModuleButton moduleId={mod.id} />
          </div>
        </div>
      </div>

      {/* Lessons */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-[#0f172a]">
          Aulas <span className="text-[#94a3b8] font-normal">({(lessons ?? []).length})</span>
        </h2>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/course/${mod.id}/lessons/import`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#1a56db] border border-[#1a56db] rounded-lg hover:bg-[#ebf3ff] transition"
          >
            <Sparkles size={13} />
            Importar Aula
          </Link>
          <Link
            href={`/admin/course/${mod.id}/lessons/new`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1a56db] text-white text-xs font-medium rounded-lg hover:bg-[#1648c0] transition"
          >
            <Plus size={13} />
            Nova Aula
          </Link>
        </div>
      </div>

      {(!lessons || lessons.length === 0) ? (
        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-8 text-center">
          <BookOpen size={28} className="mx-auto text-[#94a3b8] mb-2" />
          <p className="text-sm text-[#64748b]">Nenhuma aula criada ainda</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
          <div className="divide-y divide-[#f1f5f9]">
            {(lessons as Lesson[]).map(lesson => (
                <div key={lesson.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-7 h-7 rounded-full bg-[#f1f5f9] flex items-center justify-center flex-shrink-0 text-xs font-semibold text-[#64748b]">
                    {lesson.order_index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-[#0f172a]">{lesson.title}</p>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${CEFR_COLORS[lesson.cefr_level] ?? 'bg-gray-100 text-gray-600'}`}>
                        {lesson.cefr_level}
                      </span>
                      {lesson.status === 'PUBLISHED' ? (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#ecfdf5] text-[#10b981]">Publicado</span>
                      ) : (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-[#f8fafc] text-[#94a3b8]">Rascunho</span>
                      )}
                    </div>
                    {lesson.grammar_focus && (
                      <p className="text-xs text-[#64748b] mt-0.5">{lesson.grammar_focus}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[#94a3b8] flex-shrink-0">
                    <Clock size={11} />
                    {lesson.duration_min} min
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      href={`/admin/course/${mod.id}/lessons/${lesson.id}`}
                      className="px-2.5 py-1 text-xs font-medium text-[#1a56db] bg-[#ebf3ff] rounded-lg hover:bg-[#dbeafe] transition"
                    >
                      Ver
                    </Link>
                    <Link
                      href={`/admin/course/${mod.id}/lessons/${lesson.id}/edit`}
                      className="px-2.5 py-1 text-xs font-medium text-[#64748b] border border-[#e2e8f0] rounded-lg hover:bg-[#f1f5f9] transition"
                    >
                      Editar
                    </Link>
                    <DeleteLessonButton lessonId={lesson.id} moduleId={mod.id} />
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
