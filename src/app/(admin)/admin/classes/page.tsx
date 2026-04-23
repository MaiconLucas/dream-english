import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { BookOpen } from 'lucide-react'
import AddClassModal from './AddClassModal'

type ClassRow = {
  id: string
  name: string
  level: string | null
  max_students: number
  active: boolean
  created_at: string
  teacher: { id: string; profile: { full_name: string } | null } | null
}

export default async function ClassesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('school_id').eq('id', user.id).single()
  if (!profile?.school_id) redirect('/login')

  const [{ data: classes }, { data: teachers }] = await Promise.all([
    supabase
      .from('classes')
      .select('id, name, level, max_students, active, created_at, teacher:teachers!teacher_id(id, profile:profiles!profile_id(full_name))')
      .eq('school_id', profile.school_id)
      .order('created_at', { ascending: false }),
    supabase
      .from('teachers')
      .select('id, profile:profiles(full_name)')
      .eq('school_id', profile.school_id),
  ])

  const rows = (classes ?? []) as unknown as ClassRow[]
  const teacherOptions = (teachers ?? []).map((t: unknown) => {
    const teacher = t as { id: string; profile: { full_name: string } | null }
    return { id: teacher.id, name: teacher.profile?.full_name ?? 'Sem nome' }
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Turmas</h1>
          <p className="text-sm text-text-muted mt-1">{rows.length} turma(s) cadastrada(s)</p>
        </div>
        <AddClassModal schoolId={profile.school_id} teachers={teacherOptions} />
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-card overflow-hidden">
        {rows.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg">
                {['Nome', 'Nível', 'Professor', 'Máx. Alunos', 'Status', 'Criada em'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(c => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-bg/50 transition">
                  <td className="px-4 py-3 font-medium text-text">{c.name}</td>
                  <td className="px-4 py-3 text-text-muted">{c.level ?? '—'}</td>
                  <td className="px-4 py-3 text-text-muted">{c.teacher?.profile?.full_name ?? '—'}</td>
                  <td className="px-4 py-3 text-text-muted">{c.max_students}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${c.active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {c.active ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{formatDate(c.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen size={40} className="text-text-muted/40 mb-3" />
            <p className="text-sm text-text-muted">Nenhuma turma cadastrada ainda.</p>
            <p className="text-xs text-text-muted/60 mt-1">Clique em &quot;Adicionar Turma&quot; para começar.</p>
          </div>
        )}
      </div>
    </div>
  )
}
