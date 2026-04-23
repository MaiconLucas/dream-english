import { createClient } from '@/lib/supabase/server'
import { formatDate } from '@/lib/utils'
import { GraduationCap } from 'lucide-react'
import AddTeacherModal from './AddTeacherModal'

type TeacherRow = {
  id: string
  specialties: string[] | null
  bio: string | null
  created_at: string
  profile: { full_name: string; email: string; active: boolean } | null
}

export default async function TeachersPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return null

  const { data: profile } = await supabase
    .from('profiles').select('school_id').eq('id', session.user.id).single()
  if (!profile?.school_id) return null

  const { data: teachers } = await supabase
    .from('teachers')
    .select('id, specialties, bio, created_at, profile:profiles!profile_id(full_name, email, active)')
    .eq('school_id', profile.school_id)
    .order('created_at', { ascending: false })

  const rows = (teachers ?? []) as unknown as TeacherRow[]

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>Professores</h1>
          <p className="text-sm text-text-muted mt-1">{rows.length} professor(es) cadastrado(s)</p>
        </div>
        <AddTeacherModal schoolId={profile.school_id} />
      </div>

      <div className="bg-surface rounded-xl border border-border shadow-card overflow-hidden">
        {rows.length > 0 ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-bg">
                {['Nome', 'Email', 'Especialidades', 'Status', 'Cadastro'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-text-muted uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(t => (
                <tr key={t.id} className="border-b border-border last:border-0 hover:bg-bg/50 transition">
                  <td className="px-4 py-3 font-medium text-text">{t.profile?.full_name ?? '—'}</td>
                  <td className="px-4 py-3 text-text-muted">{t.profile?.email ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(t.specialties ?? []).map(s => (
                        <span key={s} className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-primary-light text-primary">{s}</span>
                      ))}
                      {(!t.specialties || t.specialties.length === 0) && <span className="text-text-muted">—</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${t.profile?.active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                      {t.profile?.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{formatDate(t.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <GraduationCap size={40} className="text-text-muted/40 mb-3" />
            <p className="text-sm text-text-muted">Nenhum professor cadastrado ainda.</p>
            <p className="text-xs text-text-muted/60 mt-1">Clique em &quot;Adicionar Professor&quot; para começar.</p>
          </div>
        )}
      </div>
    </div>
  )
}
