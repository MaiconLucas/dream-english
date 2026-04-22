import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DollarSign } from 'lucide-react'
import AddPaymentModal from './AddPaymentModal'

type PaymentRow = {
  id: string
  amount_cents: number
  status: string
  due_date: string
  paid_at: string | null
  reference_month: string | null
  student: {
    id: string
    profile: { full_name: string } | null
  } | null
}

const statusStyles: Record<string, string> = {
  PAID: 'bg-emerald-50 text-emerald-700',
  PENDING: 'bg-amber-50 text-amber-700',
  OVERDUE: 'bg-red-50 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
}

const statusLabels: Record<string, string> = {
  PAID: 'Pago',
  PENDING: 'Pendente',
  OVERDUE: 'Em atraso',
  CANCELLED: 'Cancelado',
}

export default async function FinancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('school_id').eq('id', user.id).single()
  if (!profile?.school_id) redirect('/login')

  const [{ data: payments }, { data: students }] = await Promise.all([
    supabase
      .from('payments')
      .select('id, amount_cents, status, due_date, paid_at, reference_month, student:students(id, profile:profiles(full_name))')
      .eq('school_id', profile.school_id)
      .order('due_date', { ascending: false }),
    supabase
      .from('students')
      .select('id, profile:profiles(full_name)')
      .eq('school_id', profile.school_id),
  ])

  const rows = (payments ?? []) as unknown as PaymentRow[]
  const studentOptions = (students ?? []).map((s: unknown) => {
    const student = s as { id: string; profile: { full_name: string } | null }
    return { id: student.id, name: student.profile?.full_name ?? 'Sem nome' }
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Financeiro</h1>
          <p className="text-sm text-text-muted mt-1">{rows.length} pagamento(s) registrado(s)</p>
        </div>
        <AddPaymentModal schoolId={profile.school_id} students={studentOptions} />
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-card overflow-hidden">
        {rows.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg">
                {['Aluno', 'Valor', 'Vencimento', 'Referência', 'Status', 'Pago em'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(p => (
                <tr key={p.id} className="border-b border-border last:border-0 hover:bg-bg/50 transition">
                  <td className="px-4 py-3 font-medium text-text">{p.student?.profile?.full_name ?? '—'}</td>
                  <td className="px-4 py-3 text-text font-medium">{formatCurrency(p.amount_cents / 100)}</td>
                  <td className="px-4 py-3 text-text-muted">{formatDate(p.due_date)}</td>
                  <td className="px-4 py-3 text-text-muted">{p.reference_month ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusStyles[p.status] ?? 'bg-gray-100 text-gray-500'}`}>
                      {statusLabels[p.status] ?? p.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{p.paid_at ? formatDate(p.paid_at) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <DollarSign size={40} className="text-text-muted/40 mb-3" />
            <p className="text-sm text-text-muted">Nenhum pagamento registrado ainda.</p>
            <p className="text-xs text-text-muted/60 mt-1">Clique em &quot;Adicionar Pagamento&quot; para começar.</p>
          </div>
        )}
      </div>
    </div>
  )
}
