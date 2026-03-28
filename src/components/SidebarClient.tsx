'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  FileText,
  Settings,
  LogOut,
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

export default function SidebarClient({
  userEmail,
  userId,
}: {
  userEmail: string
  userId: string
}) {
  const pathname = usePathname()
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside className="w-64 bg-[#0D1F3C] flex flex-col flex-shrink-0 h-full">
      {/* Logo */}
      <div className="px-6 py-7 border-b border-white/10">
        <span className="text-3xl font-black text-white tracking-tight">
          DOT IT
        </span>
        <div className="w-8 h-0.5 bg-[#C9A96E] mt-1 rounded-full" />
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
        {navLinks.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[#C9A96E]/20 text-[#C9A96E]'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              )}
            >
              <Icon
                size={18}
                className={isActive ? 'text-[#C9A96E]' : 'text-white/50'}
              />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="mb-3 px-2">
          <p className="text-xs text-white/40 mb-0.5">Signed in as</p>
          <p className="text-xs text-white/70 truncate font-medium">
            {userEmail}
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-white/50 hover:text-white hover:bg-white/5 transition-colors"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  )
}
