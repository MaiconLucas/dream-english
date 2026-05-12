import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import NewTeacherForm from './NewTeacherForm'

export default async function NewTeacherPage() {
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

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/admin/teachers"
          className="inline-flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#1a56db] transition mb-4"
        >
          <ChevronLeft size={15} />
          Voltar para Professores
        </Link>
        <h1
          className="text-2xl font-bold text-[#0f172a]"
          style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          Novo Professor
        </h1>
        <p className="text-sm text-[#64748b] mt-1">Preencha os dados para cadastrar um novo professor.</p>
      </div>

      <NewTeacherForm schoolId={myProfile.school_id} />
    </div>
  )
}
