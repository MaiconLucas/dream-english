export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT'
export type EnrollmentStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
export type PaymentStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED'
export type HomeworkStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED'
export type SubmissionStatus = 'PENDING' | 'SUBMITTED' | 'CORRECTED'
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'JUSTIFIED'

export interface School {
  id: string
  name: string
  slug: string
  email: string | null
  phone: string | null
  address: string | null
  logo_url: string | null
  settings: Record<string, unknown>
  active: boolean
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  school_id: string
  role: UserRole
  full_name: string
  email: string
  avatar_url: string | null
  phone: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface Teacher {
  id: string
  profile_id: string
  school_id: string
  specialties: string[]
  bio: string | null
  created_at: string
  updated_at: string
}

export interface Plan {
  id: string
  school_id: string
  name: string
  description: string | null
  price_cents: number
  billing_cycle: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface Student {
  id: string
  profile_id: string
  school_id: string
  enrollment_number: string | null
  level: string | null
  notes: string | null
  monthly_fee_cents: number
  discount_percent: number
  due_day: number
  created_at: string
  updated_at: string
}

export interface Class {
  id: string
  school_id: string
  teacher_id: string | null
  name: string
  level: string | null
  schedule: unknown[]
  max_students: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface Enrollment {
  id: string
  school_id: string
  student_id: string
  class_id: string
  status: EnrollmentStatus
  enrolled_at: string
  created_at: string
  updated_at: string
}

export interface Lesson {
  id: string
  school_id: string
  class_id: string
  teacher_id: string | null
  title: string
  description: string | null
  scheduled_at: string
  duration_minutes: number
  completed: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Attendance {
  id: string
  school_id: string
  lesson_id: string
  student_id: string
  status: AttendanceStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Module {
  id: string
  school_id: string
  title: string
  description: string | null
  level: string
  order_index: number
  content: Record<string, unknown>
  active: boolean
  created_at: string
  updated_at: string
}

export interface Homework {
  id: string
  school_id: string
  class_id: string
  lesson_id: string | null
  teacher_id: string | null
  title: string
  description: string | null
  instructions: string | null
  due_date: string | null
  status: HomeworkStatus
  created_at: string
  updated_at: string
}

export interface HwSubmission {
  id: string
  school_id: string
  homework_id: string
  student_id: string
  content: string | null
  status: SubmissionStatus
  grade: number | null
  feedback: string | null
  ai_feedback: string | null
  submitted_at: string | null
  corrected_at: string | null
  created_at: string
  updated_at: string
}

export interface Payment {
  id: string
  school_id: string
  student_id: string
  plan_id: string | null
  amount_cents: number
  status: PaymentStatus
  due_date: string
  paid_at: string | null
  reference_month: string | null
  notes: string | null
  reminder_sent_at: string | null
  created_at: string
  updated_at: string
}

export interface AdminDashboardKPIs {
  revenue_month: number
  overdue_count: number
  overdue_amount: number
  active_students: number
  lessons_this_week: number
  attendance_rate: number
  pending_homework: number
}

export interface AuditLog {
  id: string
  school_id: string
  user_id: string | null
  action: string
  table_name: string | null
  record_id: string | null
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
}
