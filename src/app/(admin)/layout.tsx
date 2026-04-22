import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="flex">
        <aside className="fixed inset-y-0 left-0 w-64 bg-white border-r border-[#e2e8f0] flex flex-col">
          <div className="h-16 flex items-center px-6 border-b border-[#e2e8f0]">
            <span className="text-lg font-bold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
              🎓 Dream English
            </span>
          </div>
          <nav className="flex-1 px-3 py-4 space-y-1">
            <a href="/admin/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[#0f172a] hover:bg-[#f1f5f9] transition">
              Dashboard
            </a>
            <a href="/admin/students" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[#64748b] hover:bg-[#f1f5f9] transition">
              Alunos
            </a>
            <a href="/admin/teachers" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[#64748b] hover:bg-[#f1f5f9] transition">
              Professores
            </a>
            <a href="/admin/classes" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[#64748b] hover:bg-[#f1f5f9] transition">
              Turmas
            </a>
            <a href="/admin/finance" className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[#64748b] hover:bg-[#f1f5f9] transition">
              Financeiro
            </a>
          </nav>
          <div className="p-4 border-t border-[#e2e8f0]">
            <p className="text-xs text-[#64748b] truncate">{user.email}</p>
          </div>
        </aside>
        <main className="ml-64 flex-1 min-h-screen p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
