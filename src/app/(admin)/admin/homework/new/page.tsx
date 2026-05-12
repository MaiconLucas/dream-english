import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import NewHomeworkForm from './NewHomeworkForm'

export default async function NewHomeworkPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data: myProfile } = await admin
    .from('profiles').select('school_id').eq('id', user.id).single()
  if (!myProfile) return null

  const [{ data: rawClasses }, { data: rawModules }] = await Promise.all([
    admin.from('classes').select('id, name').eq('school_id', myProfile.school_id).eq('active', true).order('name'),
    admin.from('modules').select('id, title, level').eq('school_id', myProfile.school_id).eq('active', true).order('level').order('order_index'),
  ])

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/homework" className="inline-flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#1a56db] transition mb-4">
          <ChevronLeft size={15} />
          Voltar para Homework
        </Link>
        <h1 className="text-2xl font-bold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Novo Homework
        </h1>
        <p className="text-sm text-[#64748b] mt-1">Crie uma nova atividade para os alunos.</p>
      </div>
      <NewHomeworkForm
        schoolId={myProfile.school_id}
        classes={(rawClasses ?? []) as { id: string; name: string }[]}
        modules={(rawModules ?? []) as { id: string; title: string; level: string }[]}
      />
    </div>
  )
}
