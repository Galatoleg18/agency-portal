import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PortalLogoutButton from '@/components/PortalLogoutButton'
import Link from 'next/link'

export default async function ClientPortalLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-[#F5F6FA]">
      <header className="bg-[#0D1F3C] sticky top-0 z-30 shadow-lg">
        <div className="max-w-4xl mx-auto px-5 py-4 flex items-center justify-between">
          <Link href="/portal">
            <div>
              <span className="text-xl font-black text-white tracking-tight">DOT IT</span>
              <div className="w-5 h-0.5 bg-[#C9A96E] mt-0.5 rounded-full" />
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/40 hidden sm:block truncate max-w-[200px]">{user.email}</span>
            <PortalLogoutButton />
          </div>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-7">{children}</main>
    </div>
  )
}
