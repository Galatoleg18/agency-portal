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
      <header className="bg-[#0F2D1F] sticky top-0 z-30 shadow-lg">
        <div className="max-w-4xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/portal">
              <div>
                <span className="text-xl font-black text-white tracking-tight">DOT IT</span>
                <div className="w-5 h-0.5 bg-[#22C55E] mt-0.5 rounded-full" />
              </div>
            </Link>
            <nav className="hidden sm:flex items-center gap-4">
              <Link href="/portal" className="text-sm text-white/60 hover:text-white transition-colors font-medium">Projects</Link>
              <Link href="/portal/invoices" className="text-sm text-white/60 hover:text-white transition-colors font-medium">Invoices</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/40 hidden sm:block truncate max-w-[200px]">{user.email}</span>
            <PortalLogoutButton />
          </div>
        </div>
        {/* Mobile nav */}
        <div className="sm:hidden flex border-t border-white/10">
          <Link href="/portal" className="flex-1 text-center py-2.5 text-xs text-white/60 hover:text-white font-medium">Projects</Link>
          <Link href="/portal/invoices" className="flex-1 text-center py-2.5 text-xs text-white/60 hover:text-white font-medium border-l border-white/10">Invoices</Link>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-7">{children}</main>
    </div>
  )
}
