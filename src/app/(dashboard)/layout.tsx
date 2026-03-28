import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SidebarClient from '@/components/SidebarClient'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="flex h-screen bg-[#F5F6FA] overflow-hidden">
      <SidebarClient userEmail={user.email ?? ''} userId={user.id} />
      <main className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="lg:hidden h-[54px]" />
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl">{children}</div>
      </main>
    </div>
  )
}
