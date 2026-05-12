import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import NewClassForm from './NewClassForm'

export default async function NewClassPage() {
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

  const { data: rawTeachers } = await admin
    .from('teachers')
    .select('id, profiles!profile_id(full_name, active)')
    .eq('school_id', myProfile.school_id)
    .order('created_at', { ascending: false })

  type RawTeacher = { id: string; profiles: { full_name: string; active: boolean } | { full_name: string; active: boolean }[] | null }

  const teachers = ((rawTeachers ?? []) as unknown as RawTeacher[])
    .map((t) => {
      const p = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles
      return { id: t.id, name: p?.full_name ?? '—', active: p?.active ?? false }
    })
    .filter((t) => t.active)

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/classes"
          className="inline-flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#1a56db] transition mb-4"
        >
          <ChevronLeft size={15} />
          Voltar para Turmas
        </Link>
        <h1
          className="text-2xl font-bold text-[#0f172a]"
          style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          Nova Turma
        </h1>
        <p className="text-sm text-[#64748b] mt-1">Preencha os dados para cadastrar uma nova turma.</p>
      </div>

      <NewClassForm schoolId={myProfile.school_id} teachers={teachers} />
    </div>
  )
}
