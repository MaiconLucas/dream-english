import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import EditTeacherForm from './EditTeacherForm'

export default async function EditTeacherPage({ params }: { params: { id: string } }) {
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

  const { data: teacher } = await admin
    .from('teachers')
    .select(`
      id, specialties, bio, profile_id,
      profiles!profile_id(full_name, email, phone, active)
    `)
    .eq('id', params.id)
    .eq('school_id', myProfile.school_id)
    .single()

  if (!teacher) notFound()

  const profile = Array.isArray(teacher.profiles) ? teacher.profiles[0] : teacher.profiles

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/admin/teachers/${params.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-[#64748b] hover:text-[#1a56db] transition mb-4"
        >
          <ChevronLeft size={15} />
          Voltar para detalhes
        </Link>
        <h1
          className="text-2xl font-bold text-[#0f172a]"
          style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
        >
          Editar Professor
        </h1>
        <p className="text-sm text-[#64748b] mt-1">{profile?.full_name ?? '—'}</p>
      </div>

      <EditTeacherForm
        teacherId={params.id}
        profileId={teacher.profile_id}
        defaults={{
          fullName: profile?.full_name ?? '',
          phone: profile?.phone ?? '',
          specialties: teacher.specialties ?? [],
          bio: teacher.bio ?? '',
          active: profile?.active ?? true,
        }}
      />
    </div>
  )
}
