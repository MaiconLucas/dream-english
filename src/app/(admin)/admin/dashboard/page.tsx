import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatPercent } from '@/lib/utils'
import type { AdminDashboardKPIs } from '@/types/database'
import {
  Users,
  TrendingUp,
  AlertCircle,
  BookOpen,
  CalendarCheck,
  ClipboardList,
} from 'lucide-react'

async function getKPIs(schoolId: string): Promise<AdminDashboardKPIs> {
  const supabase = await createClient()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString()

  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)

  const [payments, overduePayments, students, lessons, attendance, homework] =
    await Promise.all([
      supabase
        .from('payments')
        .select('amount_cents')
        .eq('school_id', schoolId)
        .eq('status', 'PAID')
        .gte('paid_at', startOfMonth)
        .lte('paid_at', endOfMonth),

      supabase
        .from('payments')
        .select('amount_cents')
        .eq('school_id', schoolId)
        .eq('status', 'OVERDUE'),

      supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('role', 'STUDENT')
        .eq('active', true),

      supabase
        .from('lessons')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .gte('scheduled_at', startOfWeek.toISOString())
        .lte('scheduled_at', endOfWeek.toISOString()),

      supabase
        .from('attendance')
        .select('status')
        .eq('school_id', schoolId),

      supabase
        .from('hw_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('school_id', schoolId)
        .eq('status', 'PENDING'),
    ])

  const revenue_month =
    (payments.data ?? []).reduce((sum, p) => sum + p.amount_cents, 0) / 100

  const overdue_amount =
    (overduePayments.data ?? []).reduce((sum, p) => sum + p.amount_cents, 0) / 100

  const attendanceRecords = attendance.data ?? []
  const attended = attendanceRecords.filter(
    (a) => a.status === 'PRESENT' || a.status === 'LATE'
  ).length
  const attendance_rate =
    attendanceRecords.length > 0
      ? (attended / attendanceRecords.length) * 100
      : 0

  return {
    revenue_month,
    overdue_count: overduePayments.data?.length ?? 0,
    overdue_amount,
    active_students: students.count ?? 0,
    lessons_this_week: lessons.count ?? 0,
    attendance_rate,
    pending_homework: homework.count ?? 0,
  }
}

async function getSchoolId(): Promise<string | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('profiles')
    .select('school_id')
    .eq('id', user.id)
    .single()

  return data?.school_id ?? null
}

interface KPICardProps {
  title: string
  value: string
  subtitle?: string
  icon: React.ReactNode
  variant?: 'default' | 'danger' | 'warning'
}

function KPICard({ title, value, subtitle, icon, variant = 'default' }: KPICardProps) {
  const variantStyles = {
    default: 'text-primary',
    danger: 'text-danger',
    warning: 'text-warning',
  }

  const bgStyles = {
    default: 'bg-primary-light',
    danger: 'bg-red-50',
    warning: 'bg-amber-50',
  }

  return (
    <div className="bg-surface rounded-xl border border-border p-5 shadow-card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wide">{title}</p>
          <p className="mt-2 text-2xl font-bold text-text">{value}</p>
          {subtitle && (
            <p className="mt-1 text-xs text-text-muted">{subtitle}</p>
          )}
        </div>
        <div className={`p-2.5 rounded-lg ${bgStyles[variant]}`}>
          <span className={variantStyles[variant]}>{icon}</span>
        </div>
      </div>
    </div>
  )
}

export default async function AdminDashboardPage() {
  const schoolId = await getSchoolId()
  if (!schoolId) return null

  const kpis = await getKPIs(schoolId)

  return (
    <div>
      <div className="mb-8">
        <h1
          className="text-2xl font-bold text-text"
          style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          Dashboard
        </h1>
        <p className="text-sm text-text-muted mt-1">Visão geral da escola</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard
          title="Receita do mês"
          value={formatCurrency(kpis.revenue_month)}
          icon={<TrendingUp size={18} />}
        />
        <KPICard
          title="Alunos ativos"
          value={String(kpis.active_students)}
          icon={<Users size={18} />}
        />
        <KPICard
          title="Aulas esta semana"
          value={String(kpis.lessons_this_week)}
          icon={<CalendarCheck size={18} />}
        />
        <KPICard
          title="Taxa de presença"
          value={formatPercent(kpis.attendance_rate)}
          subtitle="Baseado em todos os registros"
          icon={<BookOpen size={18} />}
        />
        <KPICard
          title="Tarefas pendentes"
          value={String(kpis.pending_homework)}
          subtitle="Aguardando correção"
          icon={<ClipboardList size={18} />}
          variant="warning"
        />
        <KPICard
          title="Pagamentos em atraso"
          value={String(kpis.overdue_count)}
          subtitle={formatCurrency(kpis.overdue_amount)}
          icon={<AlertCircle size={18} />}
          variant="danger"
        />
      </div>
    </div>
  )
}
