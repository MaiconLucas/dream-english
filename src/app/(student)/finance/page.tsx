import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DollarSign, TrendingUp, AlertCircle, Clock } from 'lucide-react'

type PaymentRow = {
  id: string
  amount_cents: number
  status: string
  due_date: string
  paid_at: string | null
  reference_month: string | null
  notes: string | null
}

const STATUS: Record<string, { label: string; className: string }> = {
  PAID:      { label: 'Pago',       className: 'bg-[#ecfdf5] text-[#10b981]' },
  PENDING:   { label: 'Pendente',   className: 'bg-amber-50 text-[#f59e0b]' },
  OVERDUE:   { label: 'Vencido',    className: 'bg-red-50 text-red-600' },
  CANCELLED: { label: 'Cancelado',  className: 'bg-[#f1f5f9] text-[#64748b]' },
}

export default async function StudentFinancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()

  const { data: student } = await admin
    .from('students')
    .select('id')
    .eq('profile_id', user.id)
    .single()

  if (!student) return null

  const { data: raw } = await admin
    .from('payments')
    .select('id, amount_cents, status, due_date, paid_at, reference_month, notes')
    .eq('student_id', student.id)
    .order('due_date', { ascending: false })

  const payments = (raw ?? []) as PaymentRow[]

  const totalPaid    = payments.filter(p => p.status === 'PAID').reduce((s, p) => s + p.amount_cents, 0)
  const totalPending = payments.filter(p => p.status === 'PENDING').reduce((s, p) => s + p.amount_cents, 0)
  const totalOverdue = payments.filter(p => p.status === 'OVERDUE').reduce((s, p) => s + p.amount_cents, 0)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Financeiro
        </h1>
        <p className="text-sm text-[#64748b] mt-1">
          {payments.length} pagamento{payments.length !== 1 ? 's' : ''} registrado{payments.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={15} className="text-[#10b981]" />
            <span className="text-xs font-medium text-[#64748b]">Total pago</span>
          </div>
          <p className="text-lg font-bold text-[#0f172a]">{formatCurrency(totalPaid / 100)}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={15} className="text-[#f59e0b]" />
            <span className="text-xs font-medium text-[#64748b]">Pendente</span>
          </div>
          <p className="text-lg font-bold text-[#0f172a]">{formatCurrency(totalPending / 100)}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={15} className="text-red-500" />
            <span className="text-xs font-medium text-[#64748b]">Vencido</span>
          </div>
          <p className="text-lg font-bold text-[#0f172a]">{formatCurrency(totalOverdue / 100)}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        {payments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <DollarSign size={40} className="text-[#e2e8f0] mb-3" />
            <p className="text-sm text-[#64748b]">Nenhum pagamento registrado ainda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                  {['Descrição', 'Referência', 'Vencimento', 'Valor', 'Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[#64748b] uppercase tracking-wide whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map(p => {
                  const s = STATUS[p.status] ?? { label: p.status, className: 'bg-[#f1f5f9] text-[#64748b]' }
                  return (
                    <tr key={p.id} className="border-b border-[#f1f5f9] last:border-0 hover:bg-[#f8fafc] transition">
                      <td className="px-4 py-3 text-[#0f172a]">{p.notes ?? '—'}</td>
                      <td className="px-4 py-3 text-[#64748b]">{p.reference_month ?? '—'}</td>
                      <td className="px-4 py-3 text-[#64748b] whitespace-nowrap">{formatDate(p.due_date)}</td>
                      <td className="px-4 py-3 font-medium text-[#0f172a] whitespace-nowrap">{formatCurrency(p.amount_cents / 100)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${s.className}`}>
                          {s.label}
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
