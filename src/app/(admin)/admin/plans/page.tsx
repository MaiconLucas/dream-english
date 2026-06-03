import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Tag } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

type Plan = {
  id: string
  name: string
  description: string | null
  price_cents: number
  due_day: number | null
  billing_cycle: string
  active: boolean
}

export default async function PlansPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('school_id')
    .eq('id', user.id)
    .single()
  if (!profile) return null

  const { data: raw } = await admin
    .from('plans')
    .select('id, name, description, price_cents, due_day, billing_cycle, active')
    .eq('school_id', profile.school_id)
    .order('name')

  const plans = (raw ?? []) as Plan[]

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Planos
          </h1>
          <p className="text-sm text-[#64748b] mt-1">
            {plans.length} plano{plans.length !== 1 ? 's' : ''} cadastrado{plans.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/admin/plans/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#1a56db] text-white text-sm font-medium rounded-lg hover:bg-[#1648c0] transition"
        >
          <Plus size={16} />
          Novo Plano
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        {plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Tag size={40} className="text-[#e2e8f0] mb-3" />
            <p className="text-sm text-[#64748b]">Nenhum plano cadastrado ainda.</p>
            <p className="text-xs text-[#94a3b8] mt-1">Clique em &quot;Novo Plano&quot; para começar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                  {['Nome', 'Descrição', 'Valor mensal', 'Vencimento', 'Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[#64748b] uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {plans.map(p => (
                  <tr key={p.id} className="border-b border-[#f1f5f9] last:border-0 hover:bg-[#f8fafc] transition">
                    <td className="px-4 py-3 font-medium text-[#0f172a]">{p.name}</td>
                    <td className="px-4 py-3 text-[#64748b]">{p.description ?? '—'}</td>
                    <td className="px-4 py-3 font-medium text-[#0f172a] whitespace-nowrap">
                      {formatCurrency(p.price_cents / 100)}
                    </td>
                    <td className="px-4 py-3 text-[#64748b] whitespace-nowrap">
                      {p.due_day ? `Dia ${p.due_day}` : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.active ? 'bg-[#ecfdf5] text-[#10b981]' : 'bg-[#f1f5f9] text-[#64748b]'
                      }`}>
                        {p.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
