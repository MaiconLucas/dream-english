import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import EditModuleForm from './EditModuleForm'

export default async function EditModulePage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const admin = createAdminClient()
  const { data: myProfile } = await admin
    .from('profiles').select('school_id').eq('id', user.id).single()
  if (!myProfile) return null

  const { data: mod } = await admin
    .from('modules')
    .select('id, title, description, level, order_index, content, active')
    .eq('id', params.id)
    .eq('school_id', myProfile.school_id)
    .single()

  if (!mod) notFound()

  const body = (mod.content as { body?: string } | null)?.body ?? ''

  return (
    <div>
      <div className="mb-6">
        <Link href="/admin/modules" className="inline-flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#1a56db] transition mb-4">
          <ChevronLeft size={15} />
          Voltar para Módulos
        </Link>
        <h1 className="text-2xl font-bold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          Editar Módulo
        </h1>
        <p className="text-sm text-[#64748b] mt-1">{mod.title}</p>
      </div>
      <EditModuleForm
        moduleId={params.id}
        defaults={{
          title: mod.title,
          description: mod.description ?? '',
          level: mod.level as 'Beginner' | 'Elementary' | 'Pre-Intermediate' | 'Intermediate' | 'Upper-Intermediate' | 'Advanced',
          orderIndex: mod.order_index,
          content: body,
          active: mod.active,
        }}
      />
    </div>
  )
}
