'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import type { AttendanceStatus } from '@/types/database'

type Entry = { student_id: string; status: AttendanceStatus }

export async function saveAttendance({
  schoolId,
  entries,
}: {
  classId: string
  schoolId: string
  entries: Entry[]
}) {
  const admin = createAdminClient()

  const rows = entries.map(e => ({
    school_id: schoolId,
    lesson_id: null,
    student_id: e.student_id,
    status: e.status,
    notes: null,
  }))

  const { error } = await admin.from('attendance').insert(rows as never)
  if (error) return { error: error.message }
}
