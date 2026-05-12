import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, BookOpen, ChevronRight } from 'lucide-react'
import { CEFR_COLORS } from './constants'

export default async function CoursePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('school_id').eq('id', user.id).single()
  if (!profile) return null

  const { data: modules } = await admin
    .from('course_modules')
    .select('id, title, description, cefr_level, order_index, is_published')
    .eq('school_id', profile.school_id)
    .order('order_index')

  const moduleIds = (modules ?? []).map(m => m.id)
  const { data: lessonRows } = moduleIds.length
    ? await admin.from('course_lessons').select('module_id').in('module_id', moduleIds)
    : { data: [] }

  const countMap: Record<string, number> = {}
  for (const row of lessonRows ?? []) {
    countMap[row.module_id] = (countMap[row.module_id] ?? 0) + 1
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Conteúdo do Curso
          </h1>
          <p className="text-sm text-[#64748b] mt-0.5">{(modules ?? []).length} módulos</p>
        </div>
        <Link
          href="/admin/course/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#1a56db] text-white text-sm font-medium rounded-lg hover:bg-[#1648c0] transition"
        >
          <Plus size={15} />
          Novo Módulo
        </Link>
      </div>

      {(!modules || modules.length === 0) ? (
        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-10 text-center">
          <BookOpen size={32} className="mx-auto text-[#94a3b8] mb-3" />
          <p className="text-sm font-medium text-[#0f172a]">Nenhum módulo criado</p>
          <p className="text-xs text-[#64748b] mt-1">Crie o primeiro módulo do curso</p>
        </div>
      ) : (
        <div className="space-y-3">
          {modules.map(mod => (
            <Link
              key={mod.id}
              href={`/admin/course/${mod.id}`}
              className="flex items-center gap-4 bg-white rounded-xl border border-[#e2e8f0] shadow-sm px-5 py-4 hover:border-[#1a56db] transition group"
            >
              <div className="w-10 h-10 rounded-lg bg-[#f1f5f9] flex items-center justify-center flex-shrink-0 font-bold text-[#64748b] text-sm">
                {mod.order_index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-[#0f172a]">{mod.title}</p>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${CEFR_COLORS[mod.cefr_level] ?? 'bg-gray-100 text-gray-600'}`}>
                    {mod.cefr_level}
                  </span>
                  {mod.is_published ? (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#ecfdf5] text-[#10b981]">Publicado</span>
                  ) : (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f8fafc] text-[#94a3b8]">Rascunho</span>
                  )}
                </div>
                {mod.description && (
                  <p className="text-xs text-[#64748b] mt-0.5 truncate">{mod.description}</p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-semibold text-[#0f172a]">{countMap[mod.id] ?? 0}</p>
                <p className="text-[10px] text-[#94a3b8]">aulas</p>
              </div>
              <ChevronRight size={16} className="text-[#94a3b8] group-hover:text-[#1a56db] transition flex-shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
