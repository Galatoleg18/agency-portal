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
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-4xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/portal">
              <div>
                <span className="text-lg font-black text-[#0F172A] tracking-tight">DOT IT</span>
                <div className="w-5 h-0.5 bg-[#6366F1] mt-0.5 rounded-full" />
              </div>
            </Link>
            <nav className="hidden sm:flex items-center gap-5">
              <Link href="/portal" className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium">Projects</Link>
              <Link href="/portal/invoices" className="text-sm text-gray-500 hover:text-gray-900 transition-colors font-medium">Invoices</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 hidden sm:block truncate max-w-[200px]">{user.email}</span>
            <PortalLogoutButton />
          </div>
        </div>
        <div className="sm:hidden flex border-t border-gray-100">
          <Link href="/portal" className="flex-1 text-center py-2.5 text-xs text-gray-500 hover:text-gray-900 font-medium">Projects</Link>
          <Link href="/portal/invoices" className="flex-1 text-center py-2.5 text-xs text-gray-500 hover:text-gray-900 font-medium border-l border-gray-100">Invoices</Link>
        </div>
      </header>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-7">{children}</main>
    </div>
  )
}
