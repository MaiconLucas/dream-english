import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import ClassTable from './ClassTable'
import type { Schedule } from './actions'

export type ClassListItem = {
  id: string
  name: string
  level: string | null
  max_students: number
  active: boolean
  created_at: string
  schedule: Schedule | null
  teacher_id: string | null
  teachers: {
    profiles: { full_name: string } | null
  } | null
  _enrollCount: number
}

export default async function ClassesPage() {
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

  const { data: raw } = await admin
    .from('classes')
    .select(`
      id, name, level, max_students, active, created_at, schedule, teacher_id,
      teachers!teacher_id(
        profiles!profile_id(full_name)
      )
    `)
    .eq('school_id', myProfile.school_id)
    .order('created_at', { ascending: false })

  const { data: enrollCounts } = await admin
    .from('enrollments')
    .select('class_id')
    .eq('school_id', myProfile.school_id)
    .eq('status', 'ACTIVE')

  const countMap: Record<string, number> = {}
  for (const e of enrollCounts ?? []) {
    countMap[e.class_id] = (countMap[e.class_id] ?? 0) + 1
  }

  const classes = ((raw ?? []) as unknown as ClassListItem[]).map((c) => ({
    ...c,
    _enrollCount: countMap[c.id] ?? 0,
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-2xl font-bold text-[#0f172a]"
            style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          >
            Turmas
          </h1>
          <p className="text-sm text-[#64748b] mt-1">
            {classes.length} turma{classes.length !== 1 ? 's' : ''} cadastrada{classes.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/admin/classes/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#1a56db] text-white text-sm font-medium rounded-lg hover:bg-[#1648c0] transition"
        >
          <Plus size={16} />
          Nova Turma
        </Link>
      </div>

      <ClassTable classes={classes} />
    </div>
  )
}
