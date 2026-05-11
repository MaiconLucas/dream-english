import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import NewStudentForm from './NewStudentForm'

export default async function NewStudentPage() {
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

  const [{ data: plans }, { data: classes }] = await Promise.all([
    admin
      .from('plans')
      .select('id, name')
      .eq('school_id', myProfile.school_id)
      .order('name'),
    admin
      .from('classes')
      .select('id, name')
      .eq('school_id', myProfile.school_id)
      .order('name'),
  ])

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/students"
          className="inline-flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#1a56db] transition mb-4"
        >
          <ChevronLeft size={15} />
          Voltar para Alunos
        </Link>
        <h1
          className="text-2xl font-bold text-[#0f172a]"
          style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          Novo Aluno
        </h1>
        <p className="text-sm text-[#64748b] mt-1">Preencha os dados para cadastrar um novo aluno.</p>
      </div>

      <NewStudentForm
        plans={plans ?? []}
        classes={classes ?? []}
        schoolId={myProfile.school_id}
      />
    </div>
  )
}
