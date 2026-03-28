'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/invoices', label: 'Invoices', icon: FileText },
  { href: '/settings', label: 'Settings', icon: Settings },
]

function NavContent({
  userEmail,
  pathname,
  onLogout,
  onClose,
}: {
  userEmail: string
  pathname: string
  onLogout: () => void
  onClose?: () => void
}) {
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10 flex items-center justify-between">
        <div>
          <span className="text-2xl font-black text-white tracking-tight">DOT IT</span>
          <div className="w-8 h-0.5 bg-[#C9A96E] mt-1 rounded-full" />
        </div>
        {onClose && (
          <button onClick={onClose} className="text-white/50 hover:text-white lg:hidden">
            <X size={20} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn(
                'flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[#C9A96E]/20 text-[#C9A96E]'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon size={18} className={isActive ? 'text-[#C9A96E]' : 'text-white/50'} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="mb-3 px-2">
          <p className="text-xs text-white/40 mb-0.5">Signed in as</p>
          <p className="text-xs text-white/70 truncate font-medium">{userEmail}</p>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 w-full px-3 py-2.5 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </div>
  )
}

export default function SidebarClient({
  userEmail,
}: {
  userEmail: string
  userId?: string
}) {
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
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#0D1F3C] flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div>
          <span className="text-xl font-black text-white tracking-tight">DOT IT</span>
          <div className="w-6 h-0.5 bg-[#C9A96E] mt-0.5 rounded-full" />
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="text-white/70 hover:text-white p-1"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={cn(
          'lg:hidden fixed top-0 left-0 bottom-0 z-50 w-72 bg-[#0D1F3C] transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <NavContent
          userEmail={userEmail}
          pathname={pathname}
          onLogout={handleLogout}
          onClose={() => setMobileOpen(false)}
        />
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 bg-[#0D1F3C] flex-col flex-shrink-0 h-full">
        <NavContent
          userEmail={userEmail}
          pathname={pathname}
          onLogout={handleLogout}
        />
      </aside>
    </>
  )
}
