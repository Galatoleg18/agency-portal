import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SidebarClient from '@/components/SidebarClient'
import GlobalSearch from '@/components/GlobalSearch'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="flex h-screen bg-[#F5F6FA] overflow-hidden max-w-[100vw]">
      <SidebarClient userEmail={user.email ?? ''} userId={user.id} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar with search */}
        <header className="hidden lg:flex items-center justify-end px-8 py-4 bg-[#F5F6FA] border-b border-gray-100 flex-shrink-0">
          <GlobalSearch />
        </header>
        <main className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide">
          <div className="lg:hidden h-[54px]" />
          <div className="p-4 sm:p-6 lg:p-8 max-w-6xl w-full">{children}</div>
        </main>
      </div>
    </div>
  )
}
