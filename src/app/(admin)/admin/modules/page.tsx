import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, BookOpen, ChevronRight } from 'lucide-react'

const LEVELS = ['Beginner', 'Elementary', 'Pre-Intermediate', 'Intermediate', 'Upper-Intermediate', 'Advanced']

const LEVEL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Beginner':          { bg: 'bg-emerald-50',  text: 'text-emerald-700', border: 'border-emerald-200' },
  'Elementary':        { bg: 'bg-sky-50',       text: 'text-sky-700',     border: 'border-sky-200' },
  'Pre-Intermediate':  { bg: 'bg-violet-50',    text: 'text-violet-700',  border: 'border-violet-200' },
  'Intermediate':      { bg: 'bg-amber-50',     text: 'text-amber-700',   border: 'border-amber-200' },
  'Upper-Intermediate':{ bg: 'bg-orange-50',    text: 'text-orange-700',  border: 'border-orange-200' },
  'Advanced':          { bg: 'bg-red-50',       text: 'text-red-700',     border: 'border-red-200' },
}

type ModuleRow = {
  id: string
  title: string
  level: string
  order_index: number
  active: boolean
}

export default async function ModulesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data: myProfile } = await admin
    .from('profiles').select('school_id').eq('id', user.id).single()
  if (!myProfile) return null

  const { data: raw } = await admin
    .from('modules')
    .select('id, title, level, order_index, active')
    .eq('school_id', myProfile.school_id)
    .order('level')
    .order('order_index')

  const modules = (raw ?? []) as ModuleRow[]

  const grouped = LEVELS.reduce<Record<string, ModuleRow[]>>((acc, lvl) => {
    acc[lvl] = modules.filter((m) => m.level === lvl)
    return acc
  }, {})

  const total = modules.length

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Módulos
          </h1>
          <p className="text-sm text-[#64748b] mt-1">{total} módulo{total !== 1 ? 's' : ''} cadastrado{total !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/admin/modules/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#1a56db] text-white text-sm font-medium rounded-lg hover:bg-[#1648c0] transition"
        >
          <Plus size={16} />
          Novo Módulo
        </Link>
      </div>

      {total === 0 ? (
        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm flex flex-col items-center justify-center py-20 text-center">
          <BookOpen size={40} className="text-[#e2e8f0] mb-3" />
          <p className="text-sm text-[#64748b]">Nenhum módulo cadastrado ainda.</p>
          <p className="text-xs text-[#94a3b8] mt-1">Clique em &quot;Novo Módulo&quot; para começar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {LEVELS.map((level) => {
            const items = grouped[level] ?? []
            const colors = LEVEL_COLORS[level]!
            const activeCount = items.filter((m) => m.active).length

            return (
              <div key={level} className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
                <div className={`px-5 py-4 border-b ${colors.border} ${colors.bg}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-semibold ${colors.text}`}>{level}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} border ${colors.border}`}>
                      {items.length} módulo{items.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {items.length > 0 && (
                    <p className="text-xs text-[#64748b] mt-1">{activeCount} ativo{activeCount !== 1 ? 's' : ''}</p>
                  )}
                </div>

                <div className="divide-y divide-[#f1f5f9]">
                  {items.length === 0 ? (
                    <p className="px-5 py-4 text-xs text-[#94a3b8]">Nenhum módulo neste nível.</p>
                  ) : (
                    items.map((m) => (
                      <div key={m.id} className="flex items-center justify-between px-5 py-3 hover:bg-[#f8fafc] transition">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs text-[#94a3b8] w-5 flex-shrink-0">#{m.order_index + 1}</span>
                          <span className="text-sm text-[#0f172a] truncate">{m.title}</span>
                          {!m.active && (
                            <span className="flex-shrink-0 text-xs text-[#94a3b8] bg-[#f1f5f9] px-1.5 py-0.5 rounded">Inativo</span>
                          )}
                        </div>
                        <Link
                          href={`/admin/modules/${m.id}/edit`}
                          className="flex-shrink-0 text-xs text-[#64748b] hover:text-[#1a56db] flex items-center gap-0.5 transition ml-2"
                        >
                          Editar <ChevronRight size={12} />
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
