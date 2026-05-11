import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { UserPlus } from 'lucide-react'
import StudentTable from './StudentTable'

export type StudentListItem = {
  id: string
  level: string | null
  created_at: string
  profile_id: string
  profiles: { full_name: string; email: string; active: boolean } | null
  plans: { name: string } | null
  enrollments: Array<{ status: string; classes: { name: string } | null }> | null
}

export default async function StudentsPage() {
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
    .from('students')
    .select(`
      id,
      level,
      created_at,
      profile_id,
      profiles!profile_id(full_name, email, active),
      plans!plan_id(name),
      enrollments!student_id(status, classes!class_id(name))
    `)
    .eq('school_id', myProfile.school_id)
    .order('created_at', { ascending: false })

  const students = (raw ?? []) as unknown as StudentListItem[]

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1
            className="text-2xl font-bold text-[#0f172a]"
            style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
          >
            Alunos
          </h1>
          <p className="text-sm text-[#64748b] mt-1">
            {students.length} aluno{students.length !== 1 ? 's' : ''} cadastrado{students.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/admin/students/new"
          className="flex items-center gap-2 px-4 py-2 bg-[#1a56db] text-white text-sm font-medium rounded-lg hover:bg-[#1648c0] transition"
        >
          <UserPlus size={16} />
          Novo Aluno
        </Link>
      </div>

      <StudentTable students={students} />
    </div>
  )
}
