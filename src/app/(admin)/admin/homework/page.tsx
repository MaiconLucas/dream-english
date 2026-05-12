import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, ClipboardList } from 'lucide-react'
import { formatDate } from '@/lib/utils'

type HWRow = {
  id: string
  title: string
  status: string
  due_date: string | null
  classes: { name: string } | { name: string }[] | null
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Rascunho', PUBLISHED: 'Publicado', CLOSED: 'Encerrado',
}
const STATUS_CLS: Record<string, string> = {
  DRAFT: 'bg-[#f1f5f9] text-[#64748b]',
  PUBLISHED: 'bg-[#ecfdf5] text-[#10b981]',
  CLOSED: 'bg-[#f1f5f9] text-[#94a3b8]',
}

export default async function HomeworkPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data: myProfile } = await admin
    .from('profiles').select('school_id').eq('id', user.id).single()
  if (!myProfile) return null

  const { data: rawHW } = await admin
    .from('homework')
    .select('id, title, status, due_date, classes!class_id(name)')
    .eq('school_id', myProfile.school_id)
    .order('created_at', { ascending: false })

  const hws = (rawHW ?? []) as unknown as HWRow[]

  const hwIds = hws.map((h) => h.id)
  const { data: submissions } = hwIds.length
    ? await admin.from('hw_submissions').select('homework_id').in('homework_id', hwIds)
    : { data: [] }

  const subCount: Record<string, number> = {}
  for (const s of submissions ?? []) {
    subCount[s.homework_id] = (subCount[s.homework_id] ?? 0) + 1
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Homework
          </h1>
          <p className="text-sm text-[#64748b] mt-1">{hws.length} atividade{hws.length !== 1 ? 's' : ''}</p>
        </div>
        <Link href="/admin/homework/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#1a56db] text-white text-sm font-medium rounded-lg hover:bg-[#1648c0] transition">
          <Plus size={16} />
          Novo Homework
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        {hws.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ClipboardList size={40} className="text-[#e2e8f0] mb-3" />
            <p className="text-sm text-[#64748b]">Nenhum homework cadastrado ainda.</p>
            <p className="text-xs text-[#94a3b8] mt-1">Clique em &quot;Novo Homework&quot; para começar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                  {['Título', 'Turma', 'Prazo', 'Submissões', 'Status'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[#64748b] uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {hws.map((hw) => {
                  const cls = Array.isArray(hw.classes) ? hw.classes[0] : hw.classes
                  const count = subCount[hw.id] ?? 0
                  const statusCls = STATUS_CLS[hw.status] ?? STATUS_CLS.DRAFT
                  return (
                    <tr key={hw.id} className="border-b border-[#f1f5f9] last:border-0 hover:bg-[#f8fafc] transition">
                      <td className="px-4 py-3 font-medium text-[#0f172a]">{hw.title}</td>
                      <td className="px-4 py-3 text-[#64748b]">{cls?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-[#64748b] whitespace-nowrap">
                        {hw.due_date ? formatDate(hw.due_date) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-sm font-medium text-[#0f172a]">
                          {count}
                          <span className="text-[#94a3b8] font-normal text-xs">submissão{count !== 1 ? 'ões' : ''}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusCls}`}>
                          {STATUS_LABEL[hw.status] ?? hw.status}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
