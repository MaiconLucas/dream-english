import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import ReportsClient from './ReportsClient'

export type FinancialPayment = {
  id: string
  student_id: string
  student_name: string
  plan_name: string | null
  amount_cents: number
  status: 'PAID' | 'PENDING' | 'OVERDUE'
  due_date: string
  reference_month: string | null
}

export type AttendanceRecord = {
  student_id: string
  student_name: string
  class_id: string
  class_name: string
  lesson_id: string
  scheduled_at: string
  attendance_status: string
}

export type StudentSummary = {
  id: string
  name: string
  class_ids: string[]
  class_names: string[]
  plan_name: string | null
  financial_status: 'Em dia' | 'Pendente' | 'Inadimplente'
  last_presence: string | null
}

export type ClassOption = {
  id: string
  name: string
}

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles').select('school_id').eq('id', user.id).single()
  if (!profile?.school_id) return null

  const schoolId = profile.school_id as string

  const [
    { data: paymentsRaw },
    { data: attendanceRaw },
    { data: lessonsRaw },
    { data: classesRaw },
    { data: studentsRaw },
  ] = await Promise.all([
    admin.from('payments').select('id, student_id, plan_id, amount_cents, status, due_date, reference_month').eq('school_id', schoolId),
    admin.from('attendance').select('lesson_id, student_id, status').eq('school_id', schoolId),
    admin.from('lessons').select('id, class_id, scheduled_at').eq('school_id', schoolId),
    admin.from('classes').select('id, name').eq('school_id', schoolId).order('name'),
    admin.from('students').select('id, profile_id').eq('school_id', schoolId),
  ])

  const studentIds = (studentsRaw ?? []).map(s => s.id as string)
  const profileIds = Array.from(new Set((studentsRaw ?? []).map(s => s.profile_id as string).filter(Boolean)))
  const planIds = Array.from(new Set((paymentsRaw ?? []).map(p => p.plan_id as string).filter(Boolean)))

  const [
    { data: enrollmentsRaw },
    { data: profilesRaw },
    { data: plansRaw },
  ] = await Promise.all([
    studentIds.length > 0
      ? admin.from('enrollments').select('student_id, class_id').in('student_id', studentIds)
      : Promise.resolve({ data: [] }),
    profileIds.length > 0
      ? admin.from('profiles').select('id, full_name').in('id', profileIds)
      : Promise.resolve({ data: [] }),
    planIds.length > 0
      ? admin.from('plans').select('id, name').in('id', planIds)
      : Promise.resolve({ data: [] }),
  ])

  // Build lookup maps
  const profileNameMap = new Map<string, string>()
  ;(profilesRaw ?? []).forEach(p => profileNameMap.set(p.id as string, (p.full_name ?? '') as string))

  const studentNameMap = new Map<string, string>()
  ;(studentsRaw ?? []).forEach(s => {
    const name = profileNameMap.get(s.profile_id as string)
    if (name) studentNameMap.set(s.id as string, name)
  })

  const planNameMap = new Map<string, string>()
  ;(plansRaw ?? []).forEach(p => planNameMap.set(p.id as string, (p.name ?? '') as string))

  const lessonMap = new Map<string, { class_id: string; scheduled_at: string }>()
  ;(lessonsRaw ?? []).forEach(l =>
    lessonMap.set(l.id as string, { class_id: l.class_id as string, scheduled_at: l.scheduled_at as string })
  )

  const classNameMap = new Map<string, string>()
  ;(classesRaw ?? []).forEach(c => classNameMap.set(c.id as string, (c.name ?? '') as string))

  // student_id -> class_ids[]
  const enrollmentMap = new Map<string, string[]>()
  ;(enrollmentsRaw ?? []).forEach(e => {
    const sid = e.student_id as string
    const list = enrollmentMap.get(sid) ?? []
    list.push(e.class_id as string)
    enrollmentMap.set(sid, list)
  })

  // Build FinancialPayments
  const financialPayments: FinancialPayment[] = (paymentsRaw ?? []).map(p => ({
    id: p.id as string,
    student_id: p.student_id as string,
    student_name: studentNameMap.get(p.student_id as string) ?? '—',
    plan_name: p.plan_id ? (planNameMap.get(p.plan_id as string) ?? null) : null,
    amount_cents: p.amount_cents as number,
    status: p.status as 'PAID' | 'PENDING' | 'OVERDUE',
    due_date: p.due_date as string,
    reference_month: p.reference_month as string | null,
  }))

  // Build AttendanceRecords
  const attendanceRecords: AttendanceRecord[] = (attendanceRaw ?? []).flatMap(a => {
    const lesson = lessonMap.get(a.lesson_id as string)
    if (!lesson) return []
    return [{
      student_id: a.student_id as string,
      student_name: studentNameMap.get(a.student_id as string) ?? '—',
      class_id: lesson.class_id,
      class_name: classNameMap.get(lesson.class_id) ?? '—',
      lesson_id: a.lesson_id as string,
      scheduled_at: lesson.scheduled_at,
      attendance_status: a.status as string,
    }]
  })

  // Per-student financial status
  const studentPayStatus = new Map<string, { hasOverdue: boolean; hasPending: boolean }>()
  ;(paymentsRaw ?? []).forEach(p => {
    const sid = p.student_id as string
    const cur = studentPayStatus.get(sid) ?? { hasOverdue: false, hasPending: false }
    if (p.status === 'OVERDUE') cur.hasOverdue = true
    if (p.status === 'PENDING') cur.hasPending = true
    studentPayStatus.set(sid, cur)
  })

  // Per-student last presence (most recent PRESENT lesson scheduled_at)
  const studentLastPresence = new Map<string, string>()
  ;(attendanceRaw ?? []).forEach(a => {
    if ((a.status as string) !== 'PRESENT') return
    const lesson = lessonMap.get(a.lesson_id as string)
    if (!lesson) return
    const sid = a.student_id as string
    const cur = studentLastPresence.get(sid)
    if (!cur || lesson.scheduled_at > cur) studentLastPresence.set(sid, lesson.scheduled_at)
  })

  // Per-student plan name: from most recent payment with a plan
  const studentPlanMap = new Map<string, string>()
  ;[...(paymentsRaw ?? [])]
    .filter(p => p.plan_id)
    .sort((a, b) => ((a.due_date as string) < (b.due_date as string) ? 1 : -1))
    .forEach(p => {
      const sid = p.student_id as string
      if (!studentPlanMap.has(sid) && p.plan_id) {
        const name = planNameMap.get(p.plan_id as string)
        if (name) studentPlanMap.set(sid, name)
      }
    })

  // Build StudentSummaries
  const studentSummaries: StudentSummary[] = (studentsRaw ?? []).map(s => {
    const sid = s.id as string
    const ps = studentPayStatus.get(sid)
    const classIds = enrollmentMap.get(sid) ?? []

    let financial_status: 'Em dia' | 'Pendente' | 'Inadimplente' = 'Em dia'
    if (ps?.hasOverdue) financial_status = 'Inadimplente'
    else if (ps?.hasPending) financial_status = 'Pendente'

    return {
      id: sid,
      name: studentNameMap.get(sid) ?? '—',
      class_ids: classIds,
      class_names: classIds.map(cid => classNameMap.get(cid) ?? '—'),
      plan_name: studentPlanMap.get(sid) ?? null,
      financial_status,
      last_presence: studentLastPresence.get(sid) ?? null,
    }
  })

  const classes: ClassOption[] = (classesRaw ?? []).map(c => ({
    id: c.id as string,
    name: c.name as string,
  }))

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Relatórios
        </h1>
        <p className="text-sm text-[#64748b] mt-1">
          Visão geral financeira, de presença e de alunos
        </p>
      </div>

      <ReportsClient
        financialPayments={financialPayments}
        attendanceRecords={attendanceRecords}
        studentSummaries={studentSummaries}
        classes={classes}
      />
    </div>
  )
}
