import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate, statusBadgeClass, statusLabel } from '@/lib/utils'
import { Users, FolderKanban, FileText, DollarSign, ArrowRight, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { count: totalClients },
    { data: projects },
    { data: invoices },
  ] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase
      .from('projects')
      .select(`id, name, status, due_date, clients(name), phases(completion_pct)`)
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('invoices').select('amount, status'),
  ])

  const activeProjects = projects?.filter((p) => p.status === 'active').length ?? 0
  const pendingInvoices = invoices?.filter((i) => i.status === 'unpaid' || i.status === 'overdue').length ?? 0
  const totalRevenue = invoices?.filter((i) => i.status === 'paid').reduce((sum, i) => sum + (i.amount ?? 0), 0) ?? 0
  const overdueInvoices = invoices?.filter((i) => i.status === 'overdue').length ?? 0

  const statCards = [
    { label: 'Total Clients', value: totalClients ?? 0, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', href: '/clients' },
    { label: 'Active Projects', value: activeProjects, icon: FolderKanban, color: 'text-emerald-600', bg: 'bg-emerald-50', href: '/projects' },
    { label: 'Pending Invoices', value: pendingInvoices, icon: FileText, color: overdueInvoices > 0 ? 'text-red-500' : 'text-yellow-600', bg: overdueInvoices > 0 ? 'bg-red-50' : 'bg-yellow-50', href: '/invoices' },
    { label: 'Total Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'text-[#C9A96E]', bg: 'bg-[#C9A96E]/10', href: '/invoices' },
  ]

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-0.5">Welcome back — here's what's happening.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, bg, href }) => (
          <Link key={label} href={href}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5 flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className={`${bg} rounded-xl p-2.5 sm:p-3 flex-shrink-0`}>
              <Icon size={20} className={color} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 truncate">{label}</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 mt-0.5 truncate">{value}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Overdue alert */}
      {overdueInvoices > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp size={16} className="text-red-500" />
            <p className="text-sm text-red-700 font-medium">
              {overdueInvoices} overdue invoice{overdueInvoices > 1 ? 's' : ''} need attention
            </p>
          </div>
          <Link href="/invoices" className="text-xs font-semibold text-red-600 hover:text-red-700">
            View →
          </Link>
        </div>
      )}

      {/* Recent projects */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Recent Projects</h2>
          <Link href="/projects" className="text-sm text-[#C9A96E] hover:text-[#b8924d] font-medium flex items-center gap-1">
            All projects <ArrowRight size={14} />
          </Link>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden divide-y divide-gray-50">
          {!projects || projects.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">No projects yet.</div>
          ) : projects.map((project) => {
            const phases = (project.phases as { completion_pct: number }[]) ?? []
            const progress = phases.length > 0
              ? Math.round(phases.reduce((s, ph) => s + ph.completion_pct, 0) / phases.length) : 0
            const client = (project.clients as { name: string }[] | null)?.[0] ?? null
            return (
              <Link key={project.id} href={`/projects/${project.id}`}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{project.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{client?.name ?? 'No client'} · {formatDate(project.due_date)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                      <div className="bg-[#C9A96E] h-1.5 rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-xs text-gray-400 w-8 text-right">{progress}%</span>
                  </div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold flex-shrink-0 ${statusBadgeClass(project.status)}`}>
                  {statusLabel(project.status)}
                </span>
              </Link>
            )
          })}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Project', 'Client', 'Status', 'Due Date', 'Progress'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {!projects || projects.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400">No projects yet.</td></tr>
              ) : projects.map((project) => {
                const phases = (project.phases as { completion_pct: number }[]) ?? []
                const progress = phases.length > 0
                  ? Math.round(phases.reduce((s, ph) => s + ph.completion_pct, 0) / phases.length) : 0
                const client = (project.clients as { name: string }[] | null)?.[0] ?? null
                return (
                  <tr key={project.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-4 font-medium text-gray-900">{project.name}</td>
                    <td className="px-5 py-4 text-gray-500">{client?.name ?? '—'}</td>
                    <td className="px-5 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(project.status)}`}>
                        {statusLabel(project.status)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500">{formatDate(project.due_date)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-100 rounded-full h-1.5">
                          <div className="bg-[#C9A96E] h-1.5 rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-xs text-gray-400">{progress}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <Link href={`/projects/${project.id}`}
                        className="text-[#C9A96E] hover:text-[#b8924d] text-sm font-medium flex items-center gap-1">
                        View <ArrowRight size={13} />
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
