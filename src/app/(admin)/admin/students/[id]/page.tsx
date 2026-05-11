import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Pencil, User, Phone, Mail, BookOpen, CreditCard, Calendar } from 'lucide-react'
import { formatDate, formatCurrency } from '@/lib/utils'

type Payment = {
  id: string
  amount_cents: number
  status: string
  due_date: string
  paid_at: string | null
  description: string | null
}

type Lesson = {
  id: string
  title: string
  scheduled_at: string
  completed: boolean
  classes: { name: string } | null
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  PAID: { label: 'Pago', className: 'bg-[#ecfdf5] text-[#10b981]' },
  PENDING: { label: 'Pendente', className: 'bg-amber-50 text-[#f59e0b]' },
  OVERDUE: { label: 'Vencido', className: 'bg-red-50 text-[#ef4444]' },
}

export default async function StudentDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()

  const { data: myProfile } = await admin
    .from('profiles')
    .select('school_id')
    .eq('id', user.id)
    .single()
  if (!myProfile) return null

  const { data: student } = await admin
    .from('students')
    .select(`
      id, level, created_at, profile_id, plan_id,
      profiles!profile_id(full_name, email, phone, active),
      plans!plan_id(name),
      enrollments!student_id(status, classes!class_id(name))
    `)
    .eq('id', params.id)
    .eq('school_id', myProfile.school_id)
    .single()

  if (!student) notFound()

  const profile = Array.isArray(student.profiles) ? student.profiles[0] : student.profiles
  const plan = Array.isArray(student.plans) ? student.plans[0] : student.plans
  const enrollments = (student.enrollments ?? []) as Array<{ status: string; classes: { name: string } | { name: string }[] | null }>
  const activeEnrollment = enrollments.find((e) => e.status === 'ACTIVE') ?? enrollments[0]
  const activeClass = activeEnrollment
    ? (Array.isArray(activeEnrollment.classes) ? activeEnrollment.classes[0] : activeEnrollment.classes)
    : null

  const [paymentsRes, lessonsRes] = await Promise.all([
    admin
      .from('payments')
      .select('id, amount_cents, status, due_date, paid_at, description')
      .eq('student_id', params.id)
      .order('due_date', { ascending: false })
      .limit(20),
    admin
      .from('lessons')
      .select('id, title, scheduled_at, completed, classes!class_id(name)')
      .eq('school_id', myProfile.school_id)
      .contains('student_ids', [params.id])
      .order('scheduled_at', { ascending: false })
      .limit(20),
  ])

  const payments = (paymentsRes.data ?? []) as Payment[]
  const rawLessons = (lessonsRes.data ?? []) as unknown as Array<{
    id: string; title: string; scheduled_at: string; completed: boolean
    classes: { name: string } | { name: string }[] | null
  }>
  const lessons: Lesson[] = rawLessons.map((l) => ({
    ...l,
    classes: Array.isArray(l.classes) ? l.classes[0] ?? null : l.classes,
  }))

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/students"
          className="inline-flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#1a56db] transition mb-4"
        >
          <ChevronLeft size={15} />
          Voltar para Alunos
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1
              className="text-2xl font-bold text-[#0f172a]"
              style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              {profile?.full_name ?? '—'}
            </h1>
            <p className="text-sm text-[#64748b] mt-1">
              Cadastrado em {formatDate(student.created_at)}
            </p>
          </div>
          <Link
            href={`/admin/students/${params.id}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 border border-[#e2e8f0] bg-white text-sm font-medium text-[#374151] rounded-lg hover:bg-[#f8fafc] transition"
          >
            <Pencil size={14} />
            Editar
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#ebf3ff] flex items-center justify-center flex-shrink-0">
                <User size={20} className="text-[#1a56db]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#0f172a] truncate">{profile?.full_name ?? '—'}</p>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    profile?.active ? 'bg-[#ecfdf5] text-[#10b981]' : 'bg-[#f1f5f9] text-[#64748b]'
                  }`}
                >
                  {profile?.active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <InfoRow icon={<Mail size={14} />} value={profile?.email ?? '—'} />
              <InfoRow icon={<Phone size={14} />} value={profile?.phone ?? '—'} />
              <InfoRow icon={<BookOpen size={14} />} value={`Nível: ${student.level ?? '—'}`} />
              <InfoRow icon={<Calendar size={14} />} value={`Turma: ${activeClass?.name ?? '—'}`} />
              <InfoRow icon={<CreditCard size={14} />} value={`Plano: ${plan?.name ?? '—'}`} />
            </div>
          </div>
        </div>

        {/* Right column: payments + lessons */}
        <div className="lg:col-span-2 space-y-6">
          {/* Payments */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#e2e8f0]">
              <h2 className="text-sm font-semibold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                Pagamentos
              </h2>
            </div>
            {payments.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-[#64748b]">Nenhum pagamento registrado.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                      {['Descrição', 'Vencimento', 'Valor', 'Status'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[#64748b] uppercase tracking-wide whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => {
                      const s = STATUS_LABELS[p.status] ?? { label: p.status, className: 'bg-[#f1f5f9] text-[#64748b]' }
                      return (
                        <tr key={p.id} className="border-b border-[#f1f5f9] last:border-0 hover:bg-[#f8fafc] transition">
                          <td className="px-4 py-3 text-[#0f172a]">{p.description ?? '—'}</td>
                          <td className="px-4 py-3 text-[#64748b] whitespace-nowrap">{formatDate(p.due_date)}</td>
                          <td className="px-4 py-3 text-[#0f172a] whitespace-nowrap font-medium">{formatCurrency(p.amount_cents / 100)}</td>
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

          {/* Lessons */}
          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#e2e8f0]">
              <h2 className="text-sm font-semibold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
                Aulas
              </h2>
            </div>
            {lessons.length === 0 ? (
              <div className="px-5 py-10 text-center text-sm text-[#64748b]">Nenhuma aula registrada.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                      {['Aula', 'Turma', 'Data', 'Status'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-xs font-medium text-[#64748b] uppercase tracking-wide whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {lessons.map((l) => (
                      <tr key={l.id} className="border-b border-[#f1f5f9] last:border-0 hover:bg-[#f8fafc] transition">
                        <td className="px-4 py-3 font-medium text-[#0f172a]">{l.title}</td>
                        <td className="px-4 py-3 text-[#64748b]">{l.classes?.name ?? '—'}</td>
                        <td className="px-4 py-3 text-[#64748b] whitespace-nowrap">{formatDate(l.scheduled_at)}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            l.completed ? 'bg-[#ecfdf5] text-[#10b981]' : 'bg-amber-50 text-[#f59e0b]'
                          }`}>
                            {l.completed ? 'Realizada' : 'Pendente'}
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
      </div>
    </div>
  )
}

function InfoRow({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-2.5 text-[#64748b]">
      <span className="flex-shrink-0 text-[#94a3b8]">{icon}</span>
      <span className="truncate">{value}</span>
    </div>
  )
}
