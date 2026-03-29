'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard, Users, FolderKanban, FileText, Settings,
  LogOut, Menu, X, LayoutTemplate,
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
    <div className="flex flex-col h-full bg-white border-r border-gray-100">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between">
        <div>
          <span className="text-xl font-black text-[#0F172A] tracking-tight">DOT IT</span>
          <div className="w-6 h-0.5 bg-[#6366F1] mt-1 rounded-full" />
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors lg:hidden p-1">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto scrollbar-hide">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link key={href} href={href} onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-[#6366F1]/10 text-[#6366F1] font-semibold'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              )}>
              <Icon size={17} className={isActive ? 'text-[#6366F1]' : 'text-gray-400'} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-gray-100">
        <div className="flex items-center gap-2.5 px-2 mb-3">
          <div className="w-7 h-7 rounded-full bg-[#6366F1]/10 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-[#6366F1]">{userEmail[0]?.toUpperCase()}</span>
          </div>
          <p className="text-xs text-gray-400 truncate">{userEmail}</p>
        </div>
        <button onClick={onLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors">
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
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-100 flex items-center justify-between px-4 py-3.5 shadow-sm">
        <div>
          <span className="text-lg font-black text-[#0F172A] tracking-tight">DOT IT</span>
          <div className="w-5 h-0.5 bg-[#6366F1] mt-0.5 rounded-full" />
        </div>
        <button onClick={() => setMobileOpen(true)} className="text-gray-400 hover:text-gray-700 p-1 transition-colors">
          <Menu size={20} />
        </button>
      </div>

      {/* Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile drawer */}
      <div className={cn(
        'lg:hidden fixed top-0 left-0 bottom-0 z-50 w-72 shadow-2xl transition-transform duration-300 ease-out',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <NavContent userEmail={userEmail} pathname={pathname} onLogout={handleLogout} onClose={() => setMobileOpen(false)} />
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-56 flex-col flex-shrink-0 h-full">
        <NavContent userEmail={userEmail} pathname={pathname} onLogout={handleLogout} />
      </aside>
    </>
  )
}
