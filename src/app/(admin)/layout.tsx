import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from './Sidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="flex">
        <Sidebar email={user.email ?? ''} />
        <main className="ml-64 flex-1 min-h-screen p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
