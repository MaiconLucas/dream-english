import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Lock, CheckCircle, Circle, ChevronRight } from 'lucide-react'

type ModuleRow = {
  id: string
  title: string
  description: string | null
  level: string
  order_index: number
  active: boolean
}

export default async function TrailPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()

  // Get student level
  const { data: student } = await admin
    .from('students')
    .select('id, level')
    .eq('profile_id', user.id)
    .single()

  if (!student?.level) {
    return (
      <div className="text-center py-16">
        <p className="text-[#64748b] text-sm">Seu cadastro ainda não possui um nível definido.</p>
        <p className="text-[#94a3b8] text-xs mt-1">Fale com seu professor.</p>
      </div>
    )
  }

  const { data: myProfile } = await admin
    .from('profiles').select('school_id').eq('id', user.id).single()
  if (!myProfile) return null

  const { data: rawModules } = await admin
    .from('modules')
    .select('id, title, description, level, order_index, active')
    .eq('school_id', myProfile.school_id)
    .eq('level', student.level)
    .eq('active', true)
    .order('order_index')

  const modules = (rawModules ?? []) as ModuleRow[]

  if (modules.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-[#64748b] text-sm">Nenhum módulo disponível para o nível <strong>{student.level}</strong> ainda.</p>
      </div>
    )
  }

  // Get student's completed module IDs (has CORRECTED submission for any homework of that module)
  // Simplified: a module is "done" if there's any SUBMITTED or CORRECTED submission for homeworks of that module
  // We check via hw_submissions → homework → module_id (requires migration)
  // Fallback: use submitted_at to mark as done
  const { data: submissions } = await admin
    .from('hw_submissions')
    .select('homework_id, status')
    .eq('student_id', student.id)
    .in('status', ['SUBMITTED', 'CORRECTED'])

  const submittedHomeworkIds = new Set((submissions ?? []).map((s) => s.homework_id))

  // Get homework per module (using module_id if available, else no link)
  const moduleIds = modules.map((m) => m.id)
  const { data: hwData } = moduleIds.length
    ? await admin
        .from('homework')
        .select('id, module_id')
        .in('module_id', moduleIds)
        .eq('school_id', myProfile.school_id)
    : { data: [] }

  const hwByModule: Record<string, string[]> = {}
  for (const hw of hwData ?? []) {
    if (hw.module_id) {
      if (!hwByModule[hw.module_id]) hwByModule[hw.module_id] = []
      hwByModule[hw.module_id].push(hw.id)
    }
  }

  function isModuleDone(moduleId: string): boolean {
    const hwIds = hwByModule[moduleId] ?? []
    if (hwIds.length === 0) return false
    return hwIds.every((id) => submittedHomeworkIds.has(id))
  }

  function isModuleUnlocked(index: number): boolean {
    if (index === 0) return true
    const prev = modules[index - 1]
    if (!prev) return false
    return isModuleDone(prev.id)
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Minha Trilha
        </h1>
        <p className="text-sm text-[#64748b] mt-1">
          Nível: <span className="font-medium text-[#1a56db]">{student.level}</span> · {modules.length} módulo{modules.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="space-y-3">
        {modules.map((mod, index) => {
          const done = isModuleDone(mod.id)
          const unlocked = isModuleUnlocked(index)

          return (
            <div key={mod.id} className={`relative bg-white rounded-xl border shadow-sm overflow-hidden transition ${
              !unlocked ? 'opacity-60 cursor-not-allowed border-[#e2e8f0]' :
              done ? 'border-[#bbf7d0]' : 'border-[#e2e8f0] hover:border-[#1a56db]'
            }`}>
              <div className="flex items-center gap-4 px-5 py-4">
                {/* Icon */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  done ? 'bg-[#ecfdf5]' : unlocked ? 'bg-[#ebf3ff]' : 'bg-[#f1f5f9]'
                }`}>
                  {!unlocked ? (
                    <Lock size={16} className="text-[#94a3b8]" />
                  ) : done ? (
                    <CheckCircle size={18} className="text-[#10b981]" />
                  ) : (
                    <Circle size={18} className="text-[#1a56db]" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#94a3b8]">Módulo {index + 1}</span>
                    {done && (
                      <span className="text-xs font-medium text-[#10b981] bg-[#ecfdf5] px-2 py-0.5 rounded-full">Concluído</span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-[#0f172a] truncate mt-0.5">{mod.title}</p>
                  {mod.description && (
                    <p className="text-xs text-[#64748b] truncate mt-0.5">{mod.description}</p>
                  )}
                </div>

                {/* Arrow */}
                {unlocked && (
                  <Link href={`/trail/${mod.id}`} className="absolute inset-0" aria-label={`Abrir ${mod.title}`} />
                )}
                <ChevronRight size={16} className={unlocked ? 'text-[#94a3b8]' : 'text-[#e2e8f0]'} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
