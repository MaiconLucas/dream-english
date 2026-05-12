import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Link from 'next/link'
import { BookOpen, LogOut } from 'lucide-react'
import { logout } from '@/app/actions/auth'

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role, full_name, school_id')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'STUDENT') redirect('/login?error=unauthorized')

  // Sync role to app_metadata for middleware JWT check
  const currentMetaRole = (user.app_metadata as Record<string, unknown>)?.role
  if (currentMetaRole !== profile.role) {
    await admin.auth.admin.updateUserById(user.id, { app_metadata: { role: profile.role } })
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="fixed top-0 inset-x-0 z-40 h-14 bg-white border-b border-[#e2e8f0] flex items-center px-6 gap-4">
        <span className="text-base font-bold text-[#0f172a]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
          🎓 Dream English
        </span>
        <nav className="flex items-center gap-1 ml-4">
          <Link href="/trail"
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-[#64748b] hover:bg-[#f1f5f9] hover:text-[#0f172a] transition flex items-center gap-1.5">
            <BookOpen size={14} />
            Minha Trilha
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-sm text-[#64748b] hidden sm:block">{profile.full_name}</span>
          <form action={logout}>
            <button type="submit"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-[#64748b] hover:bg-red-50 hover:text-red-600 transition">
              <LogOut size={14} />
              Sair
            </button>
          </form>
        </div>
      </header>
      <main className="pt-14 min-h-screen">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {children}
        </div>
      </main>
    </div>
  )
}
