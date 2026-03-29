'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard, Users, FolderKanban, FileText, Settings, LogOut, Menu, X, LayoutTemplate,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/templates', label: 'Templates', icon: LayoutTemplate },
  { href: '/settings', label: 'Settings', icon: Settings },
]

function NavContent({ userEmail, pathname, onLogout, onClose }: {
  userEmail: string; pathname: string; onLogout: () => void; onClose?: () => void
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5 border-b border-white/10 flex items-center justify-between">
        <div>
          <span className="text-2xl font-black text-white tracking-tight">DOT IT</span>
          <div className="w-7 h-0.5 bg-[#22C55E] mt-1 rounded-full" />
        </div>
        {onClose && (
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors lg:hidden p-1">
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto scrollbar-hide">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href} onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-[#22C55E]/15 text-[#22C55E]'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              )}>
              <Icon size={17} className={isActive ? 'text-[#22C55E]' : ''} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-7 h-7 rounded-full bg-[#22C55E]/20 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-[#22C55E]">{userEmail[0]?.toUpperCase()}</span>
          </div>
          <p className="text-xs text-white/50 truncate">{userEmail}</p>
        </div>
        <button onClick={onLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-white/40 hover:text-white hover:bg-white/5 transition-colors">
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </div>
  )
}

export default function SidebarClient({ userEmail }: { userEmail: string; userId?: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#0F2D1F] flex items-center justify-between px-4 py-3.5 border-b border-white/10 shadow-lg">
        <div>
          <span className="text-lg font-black text-white tracking-tight">DOT IT</span>
          <div className="w-5 h-0.5 bg-[#22C55E] mt-0.5 rounded-full" />
        </div>
        <button onClick={() => setMobileOpen(true)} className="text-white/60 hover:text-white p-1 transition-colors">
          <Menu size={20} />
        </button>
      </div>

      {/* Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile drawer */}
      <div className={cn(
        'lg:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-[#0F2D1F] transition-transform duration-300 ease-out shadow-2xl',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <NavContent userEmail={userEmail} pathname={pathname} onLogout={handleLogout} onClose={() => setMobileOpen(false)} />
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 bg-[#0F2D1F] flex-col flex-shrink-0 h-full">
        <NavContent userEmail={userEmail} pathname={pathname} onLogout={handleLogout} />
      </aside>
    </>
  )
}
