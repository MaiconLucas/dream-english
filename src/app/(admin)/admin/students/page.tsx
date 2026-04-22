import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { Users } from 'lucide-react'
import AddStudentModal from './AddStudentModal'

type StudentRow = {
  id: string
  level: string | null
  created_at: string
  profile: { full_name: string; email: string; active: boolean } | null
  plan: { name: string } | null
}

export default async function StudentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('school_id').eq('id', user.id).single()
  if (!profile?.school_id) redirect('/login')

  const [{ data: students }, { data: plans }] = await Promise.all([
    supabase
      .from('students')
      .select('id, level, created_at, profile:profiles(full_name, email, active), plan:plans(name)')
      .eq('school_id', profile.school_id)
      .order('created_at', { ascending: false }),
    supabase
      .from('plans')
      .select('id, name')
      .eq('school_id', profile.school_id)
      .eq('active', true),
  ])

  const rows = (students ?? []) as unknown as StudentRow[]

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Alunos</h1>
          <p className="text-sm text-text-muted mt-1">{rows.length} aluno(s) cadastrado(s)</p>
        </div>
        <AddStudentModal schoolId={profile.school_id} plans={plans ?? []} />
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-card overflow-hidden">
        {rows.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg">
                {['Nome', 'Email', 'Nível', 'Plano', 'Status', 'Cadastro'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(s => (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-bg/50 transition">
                  <td className="px-4 py-3 font-medium text-text">{s.profile?.full_name ?? '—'}</td>
                  <td className="px-4 py-3 text-text-muted">{s.profile?.email ?? '—'}</td>
                  <td className="px-4 py-3 text-text-muted">{s.level ?? '—'}</td>
                  <td className="px-4 py-3 text-text-muted">{s.plan?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${s.profile?.active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {s.profile?.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{formatDate(s.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users size={40} className="text-text-muted/40 mb-3" />
            <p className="text-sm text-text-muted">Nenhum aluno cadastrado ainda.</p>
            <p className="text-xs text-text-muted/60 mt-1">Clique em &quot;Adicionar Aluno&quot; para começar.</p>
          </div>
        )}
      </div>
    </div>
  )
}
