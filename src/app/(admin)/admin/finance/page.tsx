import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DollarSign } from 'lucide-react'
import { Suspense } from 'react'
import FinanceFilters from './FinanceFilters'
import MarkPaidButton from './MarkPaidButton'

type PaymentRow = {
  id: string
  amount_cents: number
  status: string
  due_date: string
  paid_at: string | null
  reference_month: string | null
  description: string | null
  student_id: string
}

const statusStyles: Record<string, string> = {
  PAID:      'bg-emerald-50 text-emerald-700',
  PENDING:   'bg-amber-50 text-amber-700',
  OVERDUE:   'bg-red-50 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
}

const statusLabels: Record<string, string> = {
  PAID:      'Pago',
  PENDING:   'Pendente',
  OVERDUE:   'Em atraso',
  CANCELLED: 'Cancelado',
}

export default async function FinancePage({
  searchParams,
}: {
  searchParams: { status?: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles').select('school_id').eq('id', user.id).single()
  if (!profile?.school_id) return null

  const statusFilter = searchParams.status ?? ''

  let query = admin
    .from('payments')
    .select('id, amount_cents, status, due_date, paid_at, reference_month, description, student_id')
    .eq('school_id', profile.school_id)
    .order('due_date', { ascending: false })

  if (statusFilter) {
    query = query.eq('status', statusFilter)
  }

  const { data: payments, error: payError } = await query
  console.log('[finance] school_id:', profile.school_id, 'count:', payments?.length, 'error:', payError?.message)
  const rows = (payments ?? []) as unknown as PaymentRow[]

  const studentIds = Array.from(new Set(rows.map(r => r.student_id)))
  const nameMap = new Map<string, string>()
  if (studentIds.length > 0) {
    const { data: students } = await admin
      .from('students')
      .select('id, profiles!profile_id(full_name)')
      .in('id', studentIds)
    for (const s of (students ?? [])) {
      const name = (s as unknown as { profiles: { full_name: string } }).profiles?.full_name
      if (name) nameMap.set(s.id, name)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Financeiro
          </h1>
          <p className="text-sm text-[#64748b] mt-1">{rows.length} pagamento{rows.length !== 1 ? 's' : ''}</p>
        </div>
        <Suspense>
          <FinanceFilters current={statusFilter} />
        </Suspense>
      </div>

      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <DollarSign size={40} className="text-[#e2e8f0] mb-3" />
            <p className="text-sm text-[#64748b]">Nenhum pagamento encontrado.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                  {['Aluno', 'Descrição', 'Referência', 'Vencimento', 'Valor', 'Status', ''].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[#64748b] uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(p => (
                  <tr key={p.id} className="border-b border-[#f1f5f9] last:border-0 hover:bg-[#f8fafc] transition">
                    <td className="px-4 py-3 font-medium text-[#0f172a] whitespace-nowrap">
                      {nameMap.get(p.student_id) ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-[#64748b]">{p.description ?? '—'}</td>
                    <td className="px-4 py-3 text-[#64748b]">{p.reference_month ?? '—'}</td>
                    <td className="px-4 py-3 text-[#64748b] whitespace-nowrap">{formatDate(p.due_date)}</td>
                    <td className="px-4 py-3 font-medium text-[#0f172a] whitespace-nowrap">
                      {formatCurrency(p.amount_cents / 100)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[p.status] ?? 'bg-gray-100 text-gray-500'}`}>
                        {statusLabels[p.status] ?? p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {(p.status === 'PENDING' || p.status === 'OVERDUE') && (
                        <MarkPaidButton paymentId={p.id} />
                      )}
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
