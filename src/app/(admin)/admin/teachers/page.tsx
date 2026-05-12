import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { UserPlus } from 'lucide-react'
import TeacherTable from './TeacherTable'

export type TeacherListItem = {
  id: string
  specialties: string[]
  created_at: string
  profile_id: string
  profiles: { full_name: string; email: string; active: boolean } | null
  _classCount?: number
}

export default async function TeachersPage() {
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
    .from('teachers')
    .select(`
      id,
      specialties,
      created_at,
      profile_id,
      profiles!profile_id(full_name, email, active)
    `)
    .eq('school_id', myProfile.school_id)
    .order('created_at', { ascending: false })

  const { data: classCounts } = await admin
    .from('classes')
    .select('teacher_id')
    .eq('school_id', myProfile.school_id)
    .eq('active', true)

  const countMap: Record<string, number> = {}
  for (const c of classCounts ?? []) {
    if (c.teacher_id) countMap[c.teacher_id] = (countMap[c.teacher_id] ?? 0) + 1
  }

  const teachers = ((raw ?? []) as unknown as TeacherListItem[]).map((t) => ({
    ...t,
    _classCount: countMap[t.id] ?? 0,
  }))

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-2xl font-bold text-[#0f172a]"
            style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          >
            Professores
          </h1>
          <p className="text-sm text-[#64748b] mt-1">
            {teachers.length} professor{teachers.length !== 1 ? 'es' : ''} cadastrado{teachers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/admin/teachers/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#1a56db] text-white text-sm font-medium rounded-lg hover:bg-[#1648c0] transition"
        >
          <UserPlus size={16} />
          Novo Professor
        </Link>
      </div>

      <TeacherTable teachers={teachers} />
    </div>
  )
}
