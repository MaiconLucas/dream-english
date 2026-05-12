import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Pencil, User, Phone, Mail, BookOpen, GraduationCap } from 'lucide-react'
import { formatDate } from '@/lib/utils'

type ClassRow = {
  id: string
  name: string
  level: string | null
  active: boolean
  max_students: number
}

export default async function TeacherDetailPage({ params }: { params: { id: string } }) {
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
      id, specialties, bio, created_at, profile_id,
      profiles!profile_id(full_name, email, phone, active)
    `)
    .eq('id', params.id)
    .eq('school_id', myProfile.school_id)
    .single()

  if (!teacher) notFound()

  const profile = Array.isArray(teacher.profiles) ? teacher.profiles[0] : teacher.profiles

  const { data: classes } = await admin
    .from('classes')
    .select('id, name, level, active, max_students')
    .eq('school_id', myProfile.school_id)
    .eq('teacher_id', params.id)
    .order('name')

  const classRows = (classes ?? []) as ClassRow[]

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

        <div className="flex items-start justify-between">
          <div>
            <h1
              className="text-2xl font-bold text-[#0f172a]"
              style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              {profile?.full_name ?? '—'}
            </h1>
            <p className="text-sm text-[#64748b] mt-1">
              Cadastrado em {formatDate(teacher.created_at)}
            </p>
          </div>
          <Link
            href={`/admin/teachers/${params.id}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 border border-[#e2e8f0] bg-white text-sm font-medium text-[#374151] rounded-lg hover:bg-[#f8fafc] transition"
          >
            <Pencil size={14} />
            Editar
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info card */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#ebf3ff] flex items-center justify-center flex-shrink-0">
                <GraduationCap size={20} className="text-[#1a56db]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#0f172a] truncate">{profile?.full_name ?? '—'}</p>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    profile?.active ? 'bg-[#ecfdf5] text-[#10b981]' : 'bg-[#f1f5f9] text-[#64748b]'
                  }`}
                >
                  {profile?.active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <InfoRow icon={<Mail size={14} />} value={profile?.email ?? '—'} />
              <InfoRow icon={<Phone size={14} />} value={profile?.phone ?? '—'} />
            </div>

            {(teacher.specialties ?? []).length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#f1f5f9]">
                <p className="text-xs font-medium text-[#64748b] mb-2">Especialidades</p>
                <div className="flex flex-wrap gap-1.5">
                  {(teacher.specialties ?? []).map((s: string) => (
                    <span
                      key={s}
                      className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-[#ebf3ff] text-[#1a56db]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {teacher.bio && (
              <div className="mt-4 pt-4 border-t border-[#f1f5f9]">
                <p className="text-xs font-medium text-[#64748b] mb-1">Bio</p>
                <p className="text-sm text-[#374151] leading-relaxed">{teacher.bio}</p>
              </div>
            )}
          </div>
        </div>

        {/* Classes */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#e2e8f0] flex items-center gap-2">
              <BookOpen size={15} className="text-[#1a56db]" />
              <h2
                className="text-sm font-semibold text-[#0f172a]"
                style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                Turmas vinculadas
              </h2>
              <span className="ml-auto text-xs text-[#64748b]">{classRows.length} turma{classRows.length !== 1 ? 's' : ''}</span>
            </div>

            {classRows.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <User size={32} className="mx-auto text-[#e2e8f0] mb-3" />
                <p className="text-sm text-[#64748b]">Nenhuma turma vinculada a este professor.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                      {['Turma', 'Nível', 'Alunos máx.', 'Status'].map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 text-xs font-medium text-[#64748b] uppercase tracking-wide whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {classRows.map((c) => (
                      <tr key={c.id} className="border-b border-[#f1f5f9] last:border-0 hover:bg-[#f8fafc] transition">
                        <td className="px-4 py-3 font-medium text-[#0f172a]">{c.name}</td>
                        <td className="px-4 py-3 text-[#64748b]">{c.level ?? '—'}</td>
                        <td className="px-4 py-3 text-[#64748b]">{c.max_students}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              c.active ? 'bg-[#ecfdf5] text-[#10b981]' : 'bg-[#f1f5f9] text-[#64748b]'
                            }`}
                          >
                            {c.active ? 'Ativa' : 'Inativa'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex items-center gap-2.5 text-[#64748b]">
      <span className="flex-shrink-0 text-[#94a3b8]">{icon}</span>
      <span className="truncate">{value}</span>
    </div>
  )
}
