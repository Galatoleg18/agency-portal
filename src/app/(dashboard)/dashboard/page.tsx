import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate, statusBadgeClass, statusLabel } from '@/lib/utils'
import { Users, FolderKanban, FileText, DollarSign, ArrowRight, AlertTriangle, Clock } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { count: totalClients },
    { data: projects },
    { data: invoices },
  ] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('projects')
      .select(`id, name, status, due_date, clients(name), phases(completion_pct)`)
      .order('created_at', { ascending: false }).limit(5),
    supabase.from('invoices').select('amount, status, due_date'),
  ])

  const activeProjects = projects?.filter(p => p.status === 'active').length ?? 0
  const pendingInvoices = invoices?.filter(i => i.status === 'unpaid' || i.status === 'overdue').length ?? 0
  const overdueInvoices = invoices?.filter(i => i.status === 'overdue').length ?? 0
  const totalRevenue = invoices?.filter(i => i.status === 'paid').reduce((s, i) => s + (i.amount ?? 0), 0) ?? 0

  const stats = [
    { label: 'Clients', value: totalClients ?? 0, icon: Users, color: 'text-violet-500', bg: 'bg-violet-50', href: '/clients' },
    { label: 'Active Projects', value: activeProjects, icon: FolderKanban, color: 'text-sky-500', bg: 'bg-sky-50', href: '/projects' },
    { label: 'Pending Invoices', value: pendingInvoices, icon: FileText, color: overdueInvoices > 0 ? 'text-red-500' : 'text-amber-500', bg: overdueInvoices > 0 ? 'bg-red-50' : 'bg-amber-50', href: '/invoices' },
    { label: 'Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'text-[#C9A96E]', bg: 'bg-[#C9A96E]/10', href: '/invoices' },
  ]

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">Here's what's happening today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {stats.map(({ label, value, icon: Icon, color, bg, href }) => (
          <Link key={label} href={href}
            className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 flex items-center gap-3 hover:shadow-md transition-all hover:-translate-y-0.5">
            <div className={`${bg} rounded-xl p-2.5 flex-shrink-0`}>
              <Icon size={19} className={color} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400 truncate">{label}</p>
              <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Overdue alert */}
      {overdueInvoices > 0 && (
        <div className="mb-5 bg-red-50 border border-red-100 rounded-2xl px-4 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 font-medium">
              {overdueInvoices} overdue invoice{overdueInvoices > 1 ? 's' : ''} require attention
            </p>
          </div>
          <Link href="/invoices" className="text-xs font-bold text-red-600 hover:text-red-700 whitespace-nowrap">
            Review →
          </Link>
        </div>
      )}

      {/* Recent projects */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent Projects</h2>
          <Link href="/projects" className="text-xs font-semibold text-[#C9A96E] hover:text-[#b8924d] flex items-center gap-1 transition-colors">
            View all <ArrowRight size={13} />
          </Link>
        </div>

        {/* Mobile */}
        <div className="sm:hidden divide-y divide-gray-50">
          {!projects?.length ? (
            <p className="px-5 py-8 text-center text-sm text-gray-400">No projects yet.</p>
          ) : projects.map(project => {
            const phases = (project.phases as { completion_pct: number }[]) ?? []
            const progress = phases.length ? Math.round(phases.reduce((s, p) => s + p.completion_pct, 0) / phases.length) : 0
            const client = (project.clients as { name: string }[] | null)?.[0] ?? null
            return (
              <Link key={project.id} href={`/projects/${project.id}`}
                className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm truncate">{project.name}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 bg-gray-100 rounded-full h-1.5 max-w-[100px]">
                      <div className="bg-[#C9A96E] h-1.5 rounded-full" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-xs text-gray-400">{progress}%</span>
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(project.status)}`}>
                  {statusLabel(project.status)}
                </span>
              </Link>
            )
          })}
        </div>

        {/* Desktop */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-50 bg-gray-50/50">
                {['Project', 'Client', 'Status', 'Progress', 'Due'].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {!projects?.length ? (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400 text-sm">No projects yet.</td></tr>
              ) : projects.map(project => {
                const phases = (project.phases as { completion_pct: number }[]) ?? []
                const progress = phases.length ? Math.round(phases.reduce((s, p) => s + p.completion_pct, 0) / phases.length) : 0
                const client = (project.clients as { name: string }[] | null)?.[0] ?? null
                return (
                  <tr key={project.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-gray-900">{project.name}</td>
                    <td className="px-5 py-3.5 text-gray-500">{client?.name ?? '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(project.status)}`}>
                        {statusLabel(project.status)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-100 rounded-full h-1.5">
                          <div className="bg-[#C9A96E] h-1.5 rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-xs text-gray-400 tabular-nums">{progress}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs">
                      {project.due_date ? (
                        <span className="flex items-center gap-1"><Clock size={11} />{formatDate(project.due_date)}</span>
                      ) : '—'}
                    </td>
                    <td className="px-5 py-3.5">
                      <Link href={`/projects/${project.id}`} className="text-[#C9A96E] hover:text-[#b8924d] font-medium flex items-center gap-1 text-xs transition-colors">
                        Open <ArrowRight size={12} />
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
