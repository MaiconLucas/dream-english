import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, ClipboardList, CheckCircle, Clock } from 'lucide-react'
import { formatDate } from '@/lib/utils'

type HWRow = {
  id: string
  title: string
  description: string | null
  due_date: string | null
}

export default async function ModuleDetailPage({ params }: { params: { moduleId: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()

  const { data: myProfile } = await admin
    .from('profiles').select('school_id').eq('id', user.id).single()
  if (!myProfile) return null

  const { data: student } = await admin
    .from('students').select('id').eq('profile_id', user.id).single()

  const { data: mod } = await admin
    .from('modules')
    .select('id, title, description, level, order_index, content')
    .eq('id', params.moduleId)
    .eq('school_id', myProfile.school_id)
    .single()

  if (!mod) notFound()

  const body = (mod.content as { body?: string } | null)?.body ?? ''

  // Homeworks linked to this module
  const { data: rawHW } = await admin
    .from('homework')
    .select('id, title, description, due_date')
    .eq('school_id', myProfile.school_id)
    .eq('module_id', params.moduleId)
    .eq('status', 'PUBLISHED')

  const homeworks = (rawHW ?? []) as HWRow[]

  // Which homeworks student already submitted
  const hwIds = homeworks.map((h) => h.id)
  const { data: submissions } = hwIds.length && student
    ? await admin
        .from('hw_submissions')
        .select('homework_id, status')
        .eq('student_id', student.id)
        .in('homework_id', hwIds)
    : { data: [] }

  const submittedMap: Record<string, string> = {}
  for (const s of submissions ?? []) {
    submittedMap[s.homework_id] = s.status
  }

  return (
    <div>
      <Link href="/trail" className="inline-flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#1a56db] transition mb-6">
        <ChevronLeft size={15} />
        Voltar para Trilha
      </Link>

      <div className="mb-6">
        <span className="text-xs font-medium text-[#1a56db] bg-[#ebf3ff] px-2 py-0.5 rounded-full">
          {mod.level} · Módulo {mod.order_index + 1}
        </span>
        <h1 className="text-2xl font-bold text-[#0f172a] mt-2" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          {mod.title}
        </h1>
        {mod.description && <p className="text-sm text-[#64748b] mt-1">{mod.description}</p>}
      </div>

      {/* Module content */}
      {body && (
        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-6 mb-6">
          <h2 className="text-sm font-semibold text-[#0f172a] mb-4">Conteúdo da aula</h2>
          <div className="prose prose-sm max-w-none text-[#374151] whitespace-pre-wrap text-sm leading-relaxed">
            {body}
          </div>
        </div>
      )}

      {/* Homeworks */}
      {homeworks.length > 0 && (
        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-[#e2e8f0] flex items-center gap-2">
            <ClipboardList size={15} className="text-[#1a56db]" />
            <h2 className="text-sm font-semibold text-[#0f172a]">Atividades deste módulo</h2>
          </div>
          <div className="divide-y divide-[#f1f5f9]">
            {homeworks.map((hw) => {
              const status = submittedMap[hw.id]
              const submitted = !!status
              const corrected = status === 'CORRECTED'

              return (
                <div key={hw.id} className="flex items-center gap-4 px-5 py-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    corrected ? 'bg-[#ecfdf5]' : submitted ? 'bg-amber-50' : 'bg-[#f1f5f9]'
                  }`}>
                    {corrected ? (
                      <CheckCircle size={16} className="text-[#10b981]" />
                    ) : submitted ? (
                      <Clock size={16} className="text-[#f59e0b]" />
                    ) : (
                      <ClipboardList size={16} className="text-[#94a3b8]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#0f172a]">{hw.title}</p>
                    {hw.due_date && (
                      <p className="text-xs text-[#94a3b8] mt-0.5">Prazo: {formatDate(hw.due_date)}</p>
                    )}
                  </div>

                  {corrected ? (
                    <Link href={`/homework/${hw.id}`}
                      className="text-xs font-medium text-[#10b981] bg-[#ecfdf5] px-3 py-1.5 rounded-lg hover:bg-[#d1fae5] transition">
                      Ver feedback
                    </Link>
                  ) : submitted ? (
                    <span className="text-xs font-medium text-[#f59e0b] bg-amber-50 px-3 py-1.5 rounded-lg">
                      Aguardando correção
                    </span>
                  ) : (
                    <Link href={`/homework/${hw.id}`}
                      className="text-xs font-medium text-[#1a56db] bg-[#ebf3ff] px-3 py-1.5 rounded-lg hover:bg-[#dbeafe] transition">
                      Responder
                    </Link>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {homeworks.length === 0 && !body && (
        <div className="text-center py-8 text-sm text-[#64748b]">
          Nenhuma atividade disponível para este módulo ainda.
        </div>
      )}
    </div>
  )
}
