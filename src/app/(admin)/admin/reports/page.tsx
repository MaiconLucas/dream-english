import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import ReportsClient from './ReportsClient'
import type { RevenueMonth, DefaulterRecord, ClassAttendanceSummary, AtRiskStudent } from '@/lib/reports'

// ── Revenue: last 6 months ────────────────────────────────────────────────────
async function getRevenueData(schoolId: string): Promise<RevenueMonth[]> {
  const admin = createAdminClient()
  const cutoff = new Date()
  cutoff.setMonth(cutoff.getMonth() - 5)
  cutoff.setDate(1)

  const { data: payments } = await admin
    .from('payments')
    .select('amount_cents, status, due_date, reference_month')
    .eq('school_id', schoolId)
    .gte('due_date', cutoff.toISOString().slice(0, 10))

  // Pre-generate last 6 months
  const months = new Map<string, { received: number; expected: number }>()
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    months.set(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      { received: 0, expected: 0 },
    )
  }

  ;(payments ?? []).forEach(p => {
    const month = (p.reference_month ?? (p.due_date as string)?.slice(0, 7)) as string
    if (!months.has(month)) return
    const e = months.get(month)!
    e.expected += p.amount_cents as number
    if (p.status === 'PAID') e.received += p.amount_cents as number
  })

  return Array.from(months.entries()).map(([month, v]) => ({
    month,
    label: new Intl.DateTimeFormat('pt-BR', { month: 'short', year: '2-digit' }).format(
      new Date(month + '-02'), // +2 days to avoid timezone edge
    ),
    received: v.received,
    expected: v.expected,
  }))
}

// ── Defaulters: pending/overdue with past due_date ────────────────────────────
async function getDefaultersData(schoolId: string): Promise<DefaulterRecord[]> {
  const admin = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)

  const { data: payments } = await admin
    .from('payments')
    .select('id, student_id, amount_cents, status, due_date')
    .eq('school_id', schoolId)
    .in('status', ['PENDING', 'OVERDUE'])
    .lte('due_date', today)
    .order('due_date', { ascending: true })

  if (!payments || payments.length === 0) return []

  const studentIds = Array.from(new Set(payments.map(p => p.student_id as string)))

  const [{ data: students }, { data: enrollments }] = await Promise.all([
    admin.from('students').select('id, profile_id').in('id', studentIds),
    admin.from('enrollments').select('student_id, class_id').in('student_id', studentIds),
  ])

  const profileIds = Array.from(new Set((students ?? []).map(s => s.profile_id as string).filter(Boolean)))
  const classIds = Array.from(new Set((enrollments ?? []).map(e => e.class_id as string).filter(Boolean)))

  const [{ data: profiles }, { data: classes }] = await Promise.all([
    profileIds.length > 0
      ? admin.from('profiles').select('id, full_name').in('id', profileIds)
      : Promise.resolve({ data: [] }),
    classIds.length > 0
      ? admin.from('classes').select('id, name').in('id', classIds)
      : Promise.resolve({ data: [] }),
  ])

  const profileNameMap = new Map((profiles ?? []).map(p => [p.id as string, p.full_name as string]))
  const studentProfileMap = new Map((students ?? []).map(s => [s.id as string, s.profile_id as string]))
  const enrollClassMap = new Map((enrollments ?? []).map(e => [e.student_id as string, e.class_id as string]))
  const classNameMap = new Map((classes ?? []).map(c => [c.id as string, c.name as string]))

  const todayMs = new Date(today).getTime()

  return payments.map(p => {
    const profileId = studentProfileMap.get(p.student_id as string)
    const studentName = profileId ? (profileNameMap.get(profileId) ?? '—') : '—'
    const classId = enrollClassMap.get(p.student_id as string)
    const daysOverdue = Math.max(0, Math.floor((todayMs - new Date(p.due_date as string).getTime()) / 86_400_000))
    return {
      paymentId: p.id as string,
      studentId: p.student_id as string,
      studentName,
      className: classId ? (classNameMap.get(classId) ?? null) : null,
      amountCents: p.amount_cents as number,
      dueDate: p.due_date as string,
      daysOverdue,
    }
  })
}

// ── Attendance by class (last 30 days) ────────────────────────────────────────
async function getAttendanceByClass(schoolId: string): Promise<ClassAttendanceSummary[]> {
  const admin = createAdminClient()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)

  const { data: lessons } = await admin
    .from('lessons')
    .select('id, class_id')
    .eq('school_id', schoolId)
    .gte('scheduled_at', cutoff.toISOString())

  if (!lessons || lessons.length === 0) return []

  const lessonIds = lessons.map(l => l.id as string)
  const classIds = Array.from(new Set(lessons.map(l => l.class_id as string)))

  const [{ data: attendance }, { data: classes }] = await Promise.all([
    admin.from('attendance').select('lesson_id, status').in('lesson_id', lessonIds),
    classIds.length > 0
      ? admin.from('classes').select('id, name').in('id', classIds)
      : Promise.resolve({ data: [] }),
  ])

  const classNameMap = new Map((classes ?? []).map(c => [c.id as string, c.name as string]))
  const lessonClassMap = new Map(lessons.map(l => [l.id as string, l.class_id as string]))

  const byClass = new Map<string, { total: number; present: number }>()
  classIds.forEach(cid => byClass.set(cid, { total: 0, present: 0 }))

  ;(attendance ?? []).forEach(a => {
    const cid = lessonClassMap.get(a.lesson_id as string)
    if (!cid) return
    const e = byClass.get(cid) ?? { total: 0, present: 0 }
    e.total += 1
    if (a.status === 'PRESENT') e.present += 1
    byClass.set(cid, e)
  })

  return Array.from(byClass.entries())
    .map(([classId, v]) => ({
      classId,
      className: classNameMap.get(classId) ?? '—',
      total: v.total,
      present: v.present,
      rate: v.total > 0 ? Math.round((v.present / v.total) * 100) : 0,
    }))
    .sort((a, b) => a.rate - b.rate)
}

// ── At-risk students (last 30 days, < 75% presence) ──────────────────────────
async function getAtRiskStudents(schoolId: string): Promise<AtRiskStudent[]> {
  const admin = createAdminClient()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 30)

  const { data: lessons } = await admin
    .from('lessons')
    .select('id, class_id')
    .eq('school_id', schoolId)
    .gte('scheduled_at', cutoff.toISOString())

  if (!lessons || lessons.length === 0) return []

  const lessonIds = lessons.map(l => l.id as string)

  const { data: attendance } = await admin
    .from('attendance')
    .select('lesson_id, student_id, status')
    .in('lesson_id', lessonIds)

  const lessonClassMap = new Map(lessons.map(l => [l.id as string, l.class_id as string]))

  const byStudent = new Map<string, { total: number; present: number; classId: string | null }>()
  ;(attendance ?? []).forEach(a => {
    const sid = a.student_id as string
    const cur = byStudent.get(sid) ?? { total: 0, present: 0, classId: lessonClassMap.get(a.lesson_id as string) ?? null }
    cur.total += 1
    if (a.status === 'PRESENT') cur.present += 1
    byStudent.set(sid, cur)
  })

  const atRisk = Array.from(byStudent.entries()).filter(
    ([, v]) => v.total > 0 && v.present / v.total < 0.75,
  )
  if (atRisk.length === 0) return []

  const studentIds = atRisk.map(([sid]) => sid)
  const classIds = Array.from(new Set(atRisk.map(([, v]) => v.classId).filter((c): c is string => !!c)))

  const [{ data: students }, { data: classes }] = await Promise.all([
    admin.from('students').select('id, profile_id').in('id', studentIds),
    classIds.length > 0
      ? admin.from('classes').select('id, name').in('id', classIds)
      : Promise.resolve({ data: [] }),
  ])

  const profileIds = Array.from(new Set((students ?? []).map(s => s.profile_id as string).filter(Boolean)))
  const { data: profiles } = profileIds.length > 0
    ? await admin.from('profiles').select('id, full_name').in('id', profileIds)
    : { data: [] }

  const profileNameMap = new Map((profiles ?? []).map(p => [p.id as string, p.full_name as string]))
  const studentProfileMap = new Map((students ?? []).map(s => [s.id as string, s.profile_id as string]))
  const classNameMap = new Map((classes ?? []).map(c => [c.id as string, c.name as string]))

  return atRisk
    .map(([sid, v]) => {
      const profileId = studentProfileMap.get(sid)
      return {
        studentId: sid,
        studentName: profileId ? (profileNameMap.get(profileId) ?? '—') : '—',
        className: v.classId ? (classNameMap.get(v.classId) ?? null) : null,
        attended: v.present,
        total: v.total,
        rate: Math.round((v.present / v.total) * 100),
      }
    })
    .sort((a, b) => a.rate - b.rate)
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles').select('school_id').eq('id', user.id).single()
  if (!profile?.school_id) return null

  const schoolId = profile.school_id as string

  const [revenueData, defaultersData, attendanceData, atRiskData] = await Promise.all([
    getRevenueData(schoolId),
    getDefaultersData(schoolId),
    getAttendanceByClass(schoolId),
    getAtRiskStudents(schoolId),
  ])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Relatórios
        </h1>
        <p className="text-sm text-[#64748b] mt-1">
          Análise de receita, inadimplência, presença e risco
        </p>
      </div>

      <ReportsClient
        revenueData={revenueData}
        defaultersData={defaultersData}
        attendanceData={attendanceData}
        atRiskData={atRiskData}
      />
    </div>
  )
}
