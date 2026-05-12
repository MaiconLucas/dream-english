import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft, Pencil, BookOpen, Users, Clock, GraduationCap } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Schedule } from '../actions'

const DAY_PT: Record<string, string> = {
  Monday: 'Segunda', Tuesday: 'Terça', Wednesday: 'Quarta',
  Thursday: 'Quinta', Friday: 'Sexta', Saturday: 'Sábado', Sunday: 'Domingo',
}

function scheduleLabel(schedule: Schedule | null): string {
  if (!schedule || (!schedule.days?.length && !schedule.time)) return '—'
  const days = (schedule.days ?? []).map((d) => DAY_PT[d] ?? d).join(', ')
  const time = schedule.time ? ` às ${schedule.time}` : ''
  const dur = schedule.duration ? ` · ${schedule.duration}min` : ''
  return `${days}${time}${dur}`
}

type AnyProfile = { full_name: string; email: string; active?: boolean }
type AnyStudent = { id: string; level: string | null; profiles: AnyProfile | AnyProfile[] | null }
type EnrolledStudent = {
  id: string
  status: string
  students: AnyStudent | AnyStudent[] | null
}

function resolveOne<T>(val: T | T[] | null | undefined): T | null {
  if (!val) return null
  return Array.isArray(val) ? (val[0] ?? null) : val
}

export default async function ClassDetailPage({ params }: { params: { id: string } }) {
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

  const { data: cls } = await admin
    .from('classes')
    .select(`
      id, name, level, max_students, active, created_at, schedule, teacher_id,
      teachers!teacher_id(
        id,
        profiles!profile_id(full_name, email)
      )
    `)
    .eq('id', params.id)
    .eq('school_id', myProfile.school_id)
    .single()

  if (!cls) notFound()

  const teacher = resolveOne(cls.teachers as unknown as AnyProfile | AnyProfile[])
  const teacherProfile = teacher ? resolveOne((teacher as unknown as { profiles: AnyProfile | AnyProfile[] | null }).profiles) : null

  const { data: rawEnrollments } = await admin
    .from('enrollments')
    .select(`
      id, status,
      students!student_id(
        id, level,
        profiles!profile_id(full_name, email, active)
      )
    `)
    .eq('class_id', params.id)
    .order('created_at', { ascending: false })

  const enrollments = (rawEnrollments ?? []) as unknown as EnrolledStudent[]

  const activeCount = enrollments.filter((e) => e.status === 'ACTIVE').length
  const schedule = cls.schedule as Schedule | null

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

        <div className="flex items-start justify-between">
          <div>
            <h1
              className="text-2xl font-bold text-[#0f172a]"
              style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
            >
              {cls.name}
            </h1>
            <p className="text-sm text-[#64748b] mt-1">
              Criada em {formatDate(cls.created_at)}
            </p>
          </div>
          <Link
            href={`/admin/classes/${params.id}/edit`}
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
                <BookOpen size={20} className="text-[#1a56db]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#0f172a] truncate">{cls.name}</p>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    cls.active ? 'bg-[#ecfdf5] text-[#10b981]' : 'bg-[#f1f5f9] text-[#64748b]'
                  }`}
                >
                  {cls.active ? 'Ativa' : 'Inativa'}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <InfoRow icon={<GraduationCap size={14} />} label="Nível" value={cls.level ?? '—'} />
              <InfoRow
                icon={<Users size={14} />}
                label="Alunos"
                value={`${activeCount} de ${cls.max_students} vagas`}
              />
              <InfoRow
                icon={<Clock size={14} />}
                label="Horário"
                value={scheduleLabel(schedule)}
              />
            </div>

            {teacherProfile && (
              <div className="mt-4 pt-4 border-t border-[#f1f5f9]">
                <p className="text-xs font-medium text-[#64748b] mb-2">Professor</p>
                <p className="text-sm font-medium text-[#0f172a]">{teacherProfile.full_name}</p>
                <p className="text-xs text-[#64748b]">{teacherProfile.email}</p>
              </div>
            )}

            {/* Barra de ocupação */}
            <div className="mt-4 pt-4 border-t border-[#f1f5f9]">
              <div className="flex justify-between text-xs text-[#64748b] mb-1.5">
                <span>Ocupação</span>
                <span>{Math.round((activeCount / cls.max_students) * 100)}%</span>
              </div>
              <div className="h-2 bg-[#f1f5f9] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1a56db] rounded-full transition-all"
                  style={{ width: `${Math.min((activeCount / cls.max_students) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Alunos matriculados */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#e2e8f0] flex items-center gap-2">
              <Users size={15} className="text-[#1a56db]" />
              <h2
                className="text-sm font-semibold text-[#0f172a]"
                style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}
              >
                Alunos matriculados
              </h2>
              <span className="ml-auto text-xs text-[#64748b]">
                {activeCount} ativo{activeCount !== 1 ? 's' : ''}
              </span>
            </div>

            {enrollments.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <Users size={32} className="mx-auto text-[#e2e8f0] mb-3" />
                <p className="text-sm text-[#64748b]">Nenhum aluno matriculado nesta turma.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                      {['Aluno', 'Email', 'Nível', 'Status matrícula'].map((h) => (
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
                    {enrollments.map((e) => {
                      const student = resolveOne(e.students)
                      const profile = student ? resolveOne(student.profiles) : null

                      return (
                        <tr key={e.id} className="border-b border-[#f1f5f9] last:border-0 hover:bg-[#f8fafc] transition">
                          <td className="px-4 py-3 font-medium text-[#0f172a]">
                            {student ? (
                              <Link
                                href={`/admin/students/${student.id}`}
                                className="hover:text-[#1a56db] transition"
                              >
                                {profile?.full_name ?? '—'}
                              </Link>
                            ) : '—'}
                          </td>
                          <td className="px-4 py-3 text-[#64748b]">{profile?.email ?? '—'}</td>
                          <td className="px-4 py-3 text-[#64748b]">{student?.level ?? '—'}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                e.status === 'ACTIVE'
                                  ? 'bg-[#ecfdf5] text-[#10b981]'
                                  : e.status === 'SUSPENDED'
                                  ? 'bg-amber-50 text-[#f59e0b]'
                                  : 'bg-[#f1f5f9] text-[#64748b]'
                              }`}
                            >
                              {e.status === 'ACTIVE' ? 'Ativa' : e.status === 'SUSPENDED' ? 'Suspensa' : 'Inativa'}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
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

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="flex-shrink-0 text-[#94a3b8] mt-0.5">{icon}</span>
      <div>
        <p className="text-xs text-[#94a3b8]">{label}</p>
        <p className="text-[#374151]">{value}</p>
      </div>
    </div>
  )
}
