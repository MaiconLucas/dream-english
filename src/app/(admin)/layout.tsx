import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import Sidebar from './Sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single()

  // Logs de diagnóstico — visíveis nos Function Logs da Vercel
  console.log('[AdminLayout] user.id         :', user.id)
  console.log('[AdminLayout] user.email       :', user.email)
  console.log('[AdminLayout] app_metadata.role:', (user.app_metadata as Record<string, unknown>)?.role ?? 'não definido')
  console.log('[AdminLayout] profile          :', profile ? { role: profile.role, full_name: profile.full_name } : null)
  console.log('[AdminLayout] profile error    :', profileError?.message ?? null)

  if (!profile || profile.role !== 'ADMIN') {
    console.log('[AdminLayout] Acesso negado — sem perfil ADMIN para este user.id')
    redirect('/login?error=unauthorized')
  }

  // Sincroniza o role para app_metadata para que o middleware possa ler do JWT sem DB call
  const currentMetaRole = (user.app_metadata as Record<string, unknown>)?.role
  if (currentMetaRole !== profile.role) {
    console.log('[AdminLayout] Sincronizando role para app_metadata:', profile.role)
    await admin.auth.admin.updateUserById(user.id, {
      app_metadata: { role: profile.role },
    })
  }

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="flex">
        <Sidebar name={profile.full_name} email={user.email ?? ''} />
        <main className="md:ml-64 flex-1 min-w-0 min-h-screen p-4 pt-[4.5rem] md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
