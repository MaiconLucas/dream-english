import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import {
  Users,
  TrendingUp,
  AlertTriangle,
  CalendarCheck,
  Clock,
  BookOpen,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react'

// ─── helpers ────────────────────────────────────────────────────────────────

function pctChange(current: number, prev: number): number | null {
  if (prev === 0) return null
  return ((current - prev) / prev) * 100
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function bounds() {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const d = now.getDate()
  return {
    monthStart: new Date(y, m, 1).toISOString(),
    monthEnd: new Date(y, m + 1, 0, 23, 59, 59, 999).toISOString(),
    prevStart: new Date(y, m - 1, 1).toISOString(),
    prevEnd: new Date(y, m, 0, 23, 59, 59, 999).toISOString(),
    todayStart: new Date(y, m, d).toISOString(),
    todayEnd: new Date(y, m, d, 23, 59, 59, 999).toISOString(),
    todayStr: `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    now,
  }
}

// ─── data ───────────────────────────────────────────────────────────────────

async function getDashboardData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('school_id')
    .eq('id', user.id)
    .single()

  if (!profile) return null
  const sid = profile.school_id
  const b = bounds()

  const [
    students,
    payments,
    prevPayments,
    overdue,
    lessons,
    prevLessons,
    todayLessonsRes,
  ] = await Promise.all([
    supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('school_id', sid)
      .eq('role', 'STUDENT')
      .eq('active', true),

    supabase
      .from('payments')
      .select('amount_cents')
      .eq('school_id', sid)
      .eq('status', 'PAID')
      .gte('paid_at', b.monthStart)
      .lte('paid_at', b.monthEnd),

    supabase
      .from('payments')
      .select('amount_cents')
      .eq('school_id', sid)
      .eq('status', 'PAID')
      .gte('paid_at', b.prevStart)
      .lte('paid_at', b.prevEnd),

    supabase
      .from('payments')
      .select('amount_cents')
      .eq('school_id', sid)
      .eq('status', 'PENDING')
      .lt('due_date', b.todayStr),

    supabase
      .from('lessons')
      .select('id', { count: 'exact', head: true })
      .eq('school_id', sid)
      .eq('completed', true)
      .gte('scheduled_at', b.monthStart)
      .lte('scheduled_at', b.monthEnd),

    supabase
      .from('lessons')
      .select('id', { count: 'exact', head: true })
      .eq('school_id', sid)
      .eq('completed', true)
      .gte('scheduled_at', b.prevStart)
      .lte('scheduled_at', b.prevEnd),

    supabase
      .from('lessons')
      .select('id, title, scheduled_at, duration_minutes, classes(name)')
      .eq('school_id', sid)
      .gte('scheduled_at', b.todayStart)
      .lte('scheduled_at', b.todayEnd)
      .order('scheduled_at', { ascending: true })
      .limit(10),
  ])

  const revenueMonth = (payments.data ?? []).reduce((s, p) => s + p.amount_cents, 0) / 100
  const prevRevenue  = (prevPayments.data ?? []).reduce((s, p) => s + p.amount_cents, 0) / 100
  const overdueAmt   = (overdue.data ?? []).reduce((s, p) => s + p.amount_cents, 0) / 100

  type LessonRow = {
    id: string
    title: string
    scheduled_at: string
    duration_minutes: number
    classes: { name: string }[] | { name: string } | null
  }

  const todayLessons = ((todayLessonsRes.data ?? []) as unknown as LessonRow[]).map((row) => {
    const cls = Array.isArray(row.classes) ? row.classes[0] : row.classes
    return {
      id: row.id,
      title: row.title,
      scheduledAt: row.scheduled_at,
      durationMinutes: row.duration_minutes,
      className: cls?.name ?? '—',
    }
  })

  return {
    kpis: {
      activeStudents: students.count ?? 0,
      revenueMonth,
      prevRevenue,
      overdueCount: overdue.data?.length ?? 0,
      overdueAmt,
      lessonsMonth:  lessons.count ?? 0,
      prevLessons:   prevLessons.count ?? 0,
    },
    todayLessons,
    now: b.now,
  }
}

// ─── skeleton ───────────────────────────────────────────────────────────────

function Bone({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-[#e2e8f0] rounded-lg ${className}`} />
}

function DashboardSkeleton() {
  return (
    <div>
      <div className="mb-8">
        <Bone className="h-8 w-44 mb-2" />
        <Bone className="h-4 w-28" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-[#e2e8f0] p-5">
            <div className="flex justify-between mb-4">
              <Bone className="h-3 w-20" />
              <Bone className="h-9 w-9 rounded-lg" />
            </div>
            <Bone className="h-8 w-24 mb-2" />
            <Bone className="h-3 w-16" />
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
        <Bone className="h-5 w-36 mb-1" />
        <Bone className="h-3 w-24 mb-5" />
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex items-center gap-4 py-3.5 border-t border-[#f1f5f9] first:border-0">
            <Bone className="h-10 w-10 rounded-lg flex-shrink-0" />
            <div className="flex-1">
              <Bone className="h-4 w-40 mb-2" />
              <Bone className="h-3 w-24" />
            </div>
            <Bone className="h-5 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── variation badge ─────────────────────────────────────────────────────────

function VariationBadge({ pct, inverse = false }: { pct: number | null; inverse?: boolean }) {
  if (pct === null) return <span className="text-xs text-[#94a3b8]">sem histórico</span>
  const abs = Math.abs(Math.round(pct))
  const isGood = inverse ? pct <= 0 : pct >= 0
  const color = abs === 0 ? 'text-[#64748b]' : isGood ? 'text-[#10b981]' : 'text-[#ef4444]'
  const Icon = abs === 0 ? Minus : pct > 0 ? ArrowUp : ArrowDown
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${color}`}>
      <Icon size={11} />
      {abs}%
    </span>
  )
}

// ─── KPI card ────────────────────────────────────────────────────────────────

type Variant = 'blue' | 'green' | 'red' | 'amber'

const iconColors: Record<Variant, string> = {
  blue:  'bg-[#ebf3ff] text-[#1a56db]',
  green: 'bg-[#ecfdf5] text-[#10b981]',
  red:   'bg-red-50   text-[#ef4444]',
  amber: 'bg-amber-50  text-[#f59e0b]',
}

function KPICard({
  label,
  value,
  sub,
  icon,
  variation,
  inverse = false,
  variant = 'blue',
}: {
  label: string
  value: string
  sub?: string
  icon: React.ReactNode
  variation: number | null
  inverse?: boolean
  variant?: Variant
}) {
  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] p-5 shadow-sm flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <p className="text-xs font-medium text-[#64748b] uppercase tracking-wide leading-tight">{label}</p>
        <div className={`p-2 rounded-lg flex-shrink-0 ${iconColors[variant]}`}>{icon}</div>
      </div>
      <div>
        <p
          className="text-2xl font-bold text-[#0f172a] leading-none"
          style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          {value}
        </p>
        {sub && <p className="mt-1 text-xs text-[#64748b]">{sub}</p>}
      </div>
      <div className="flex items-center gap-1.5">
        <VariationBadge pct={variation} inverse={inverse} />
        {variation !== null && (
          <span className="text-[11px] text-[#94a3b8]">vs mês anterior</span>
        )}
      </div>
    </div>
  )
}

// ─── today's lessons ─────────────────────────────────────────────────────────

function TodayLessons({
  lessons,
  now,
}: {
  lessons: { id: string; title: string; scheduledAt: string; durationMinutes: number; className: string }[]
  now: Date
}) {
  const dateLabel = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-[#e2e8f0] flex items-center justify-between">
        <div>
          <h2
            className="text-sm font-semibold text-[#0f172a]"
            style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          >
            Aulas de hoje
          </h2>
          <p className="text-xs text-[#64748b] mt-0.5 capitalize">{dateLabel}</p>
        </div>
        <CalendarCheck size={16} className="text-[#1a56db]" />
      </div>

      {lessons.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <BookOpen size={36} className="mx-auto text-[#e2e8f0] mb-3" />
          <p className="text-sm text-[#64748b]">Nenhuma aula agendada para hoje</p>
        </div>
      ) : (
        <ul>
          {lessons.map((lesson, i) => {
            const start = new Date(lesson.scheduledAt)
            const end   = new Date(start.getTime() + lesson.durationMinutes * 60_000)
            const isNow = start <= now && end >= now
            const isPast = end < now

            return (
              <li
                key={lesson.id}
                className={`flex items-center gap-4 px-5 py-3.5 transition ${
                  i > 0 ? 'border-t border-[#f1f5f9]' : ''
                } ${isNow ? 'bg-[#f0f7ff]' : ''}`}
              >
                <div className="w-11 text-center flex-shrink-0">
                  <p className="text-sm font-bold text-[#0f172a] leading-none">
                    {fmtTime(lesson.scheduledAt).split(':')[0]}
                  </p>
                  <p className="text-xs text-[#64748b] leading-none mt-0.5">
                    :{fmtTime(lesson.scheduledAt).split(':')[1]}
                  </p>
                </div>

                <div className="w-px h-8 bg-[#e2e8f0] flex-shrink-0" />

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#0f172a] truncate">{lesson.title}</p>
                  <p className="text-xs text-[#64748b] truncate mt-0.5">
                    {lesson.className} · {lesson.durationMinutes} min
                  </p>
                </div>

                <span
                  className={`flex-shrink-0 inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full ${
                    isNow
                      ? 'bg-[#ebf3ff] text-[#1a56db]'
                      : isPast
                      ? 'bg-[#f1f5f9] text-[#94a3b8]'
                      : 'bg-[#ecfdf5] text-[#10b981]'
                  }`}
                >
                  <Clock size={9} />
                  {isNow ? 'Em andamento' : isPast ? 'Encerrada' : 'Próxima'}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// ─── main async content ──────────────────────────────────────────────────────

async function DashboardContent() {
  const data = await getDashboardData()

  if (!data) {
    return (
      <div className="rounded-xl border border-[#fecaca] bg-red-50 px-5 py-4 text-sm text-[#ef4444]">
        Não foi possível carregar os dados do dashboard.
      </div>
    )
  }

  const { kpis, todayLessons, now } = data
  const monthName = now.toLocaleString('pt-BR', { month: 'long' })

  return (
    <>
      <div className="mb-8">
        <h1
          className="text-2xl font-bold text-[#0f172a]"
          style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          Dashboard
        </h1>
        <p className="text-sm text-[#64748b] mt-1 capitalize">Visão geral · {monthName}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPICard
          label="Alunos ativos"
          value={String(kpis.activeStudents)}
          sub="Matrículas ativas"
          icon={<Users size={16} />}
          variation={null}
          variant="blue"
        />
        <KPICard
          label="Receita do mês"
          value={formatCurrency(kpis.revenueMonth)}
          icon={<TrendingUp size={16} />}
          variation={pctChange(kpis.revenueMonth, kpis.prevRevenue)}
          variant="green"
        />
        <KPICard
          label="Inadimplentes"
          value={String(kpis.overdueCount)}
          sub={kpis.overdueCount > 0 ? `${formatCurrency(kpis.overdueAmt)} em aberto` : undefined}
          icon={<AlertTriangle size={16} />}
          variation={null}
          inverse
          variant="red"
        />
        <KPICard
          label="Aulas realizadas"
          value={String(kpis.lessonsMonth)}
          sub="No mês atual"
          icon={<CalendarCheck size={16} />}
          variation={pctChange(kpis.lessonsMonth, kpis.prevLessons)}
          variant="blue"
        />
      </div>

      <TodayLessons lessons={todayLessons} now={now} />
    </>
  )
}

// ─── page ────────────────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  )
}
