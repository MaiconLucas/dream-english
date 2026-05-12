import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import TeacherSidebar from './TeacherSidebar'

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'TEACHER') redirect('/login?error=unauthorized')

  const currentMetaRole = (user.app_metadata as Record<string, unknown>)?.role
  if (currentMetaRole !== profile.role) {
    await admin.auth.admin.updateUserById(user.id, { app_metadata: { role: profile.role } })
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="flex">
        <TeacherSidebar name={profile.full_name} email={user.email ?? ''} />
        <main className="ml-64 flex-1 min-h-screen p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
