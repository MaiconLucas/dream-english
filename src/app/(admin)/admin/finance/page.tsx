import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { DollarSign } from 'lucide-react'
import FinanceTable from './FinanceTable'
import SendRemindersButton from './SendRemindersButton'

export type PaymentRow = {
  id: string
  amount_cents: number
  status: string
  due_date: string
  paid_at: string | null
  reference_month: string | null
  notes: string | null
  student_id: string
}

export type StudentGroup = {
  studentId: string
  studentName: string
  payments: PaymentRow[]
  oldestOpen: PaymentRow | null
}

export default async function FinancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles').select('school_id').eq('id', user.id).single()
  if (!profile?.school_id) return null

  const { data: payments } = await admin
    .from('payments')
    .select('id, amount_cents, status, due_date, paid_at, reference_month, notes, student_id')
    .eq('school_id', profile.school_id)
    .order('due_date', { ascending: true })

  const rows = (payments ?? []) as unknown as PaymentRow[]

  // Build student name map
  const studentIds = Array.from(new Set(rows.map(r => r.student_id)))
  const nameMap = new Map<string, string>()
  if (studentIds.length > 0) {
    const { data: studentRows } = await admin
      .from('students')
      .select('id, profile_id')
      .in('id', studentIds)

    const profileIds = Array.from(new Set((studentRows ?? []).map(s => s.profile_id as string).filter(Boolean)))
    const studentToProfile = new Map<string, string>();
    (studentRows ?? []).forEach(s => studentToProfile.set(s.id as string, s.profile_id as string))

    if (profileIds.length > 0) {
      const { data: profileRows } = await admin
        .from('profiles')
        .select('id, full_name')
        .in('id', profileIds)

      const profileNameMap = new Map<string, string>();
      (profileRows ?? []).forEach(p => profileNameMap.set(p.id as string, (p.full_name ?? '') as string))
      studentToProfile.forEach((pid, sid) => {
        const name = profileNameMap.get(pid)
        if (name) nameMap.set(sid, name)
      })
    }
  }

  // Group payments by student
  const groupMap: Record<string, PaymentRow[]> = {}
  rows.forEach(p => {
    if (!groupMap[p.student_id]) groupMap[p.student_id] = []
    groupMap[p.student_id].push(p)
  })

  const groups: StudentGroup[] = Object.keys(groupMap).map(sid => {
    const pmts = groupMap[sid]
    const oldestOpen = pmts.find(p => p.status === 'PENDING' || p.status === 'OVERDUE') ?? null
    return {
      studentId: sid,
      studentName: nameMap.get(sid) ?? '—',
      payments: pmts,
      oldestOpen,
    }
  })

  // Students with open payments first, then alphabetical
  groups.sort((a, b) => {
    if (a.oldestOpen && !b.oldestOpen) return -1
    if (!a.oldestOpen && b.oldestOpen) return 1
    return a.studentName.localeCompare(b.studentName)
  })

  const totalStudents = groups.length
  const totalPayments = rows.length

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
            Financeiro
          </h1>
          <p className="text-sm text-[#64748b] mt-1">
            {totalStudents} aluno{totalStudents !== 1 ? 's' : ''} · {totalPayments} pagamento{totalPayments !== 1 ? 's' : ''}
          </p>
        </div>
        <SendRemindersButton />
      </div>

      {groups.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm flex flex-col items-center justify-center py-16 text-center">
          <DollarSign size={40} className="text-[#e2e8f0] mb-3" />
          <p className="text-sm text-[#64748b]">Nenhum pagamento encontrado.</p>
        </div>
      ) : (
        <FinanceTable groups={groups} />
      )}
    </div>
  )
}
