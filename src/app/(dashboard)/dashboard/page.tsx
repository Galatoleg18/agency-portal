import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate, statusBadgeClass, statusLabel } from '@/lib/utils'
import { Users, FolderKanban, FileText, DollarSign, ArrowRight, AlertTriangle, Clock, Zap } from 'lucide-react'
import Link from 'next/link'
import { actionIcon } from '@/lib/activity'

export default async function DashboardPage() {
  const supabase = await createClient()

  const [
    { count: totalClients },
    { data: projects },
    { data: invoices },
    { data: activity },
    { data: overdueTasks },
  ] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase.from('projects')
      .select(`id, name, status, due_date, clients(name), phases(completion_pct)`)
      .order('created_at', { ascending: false }).limit(5),
    supabase.from('invoices').select('amount, status, due_date'),
    supabase.from('activity_log')
      .select('id, action, subject, actor_name, actor_email, created_at, project_id, projects(name)')
      .order('created_at', { ascending: false }).limit(12),
    supabase.from('tasks')
      .select('id, title, due_date, phases(project_id, projects(id, name))')
      .eq('is_complete', false)
      .lt('due_date', new Date().toISOString().split('T')[0])
      .not('due_date', 'is', null)
      .limit(5),
  ])

  const activeProjects = projects?.filter(p => p.status === 'active').length ?? 0
  const pendingInvoices = invoices?.filter(i => i.status === 'unpaid' || i.status === 'overdue').length ?? 0
  const overdueInvoices = invoices?.filter(i => i.status === 'overdue').length ?? 0
  const totalRevenue = invoices?.filter(i => i.status === 'paid').reduce((s, i) => s + (i.amount ?? 0), 0) ?? 0

  const stats = [
    { label: 'Clients', value: totalClients ?? 0, icon: Users, color: 'text-violet-500', bg: 'bg-violet-50', href: '/clients' },
    { label: 'Active Projects', value: activeProjects, icon: FolderKanban, color: 'text-sky-500', bg: 'bg-sky-50', href: '/projects' },
    { label: 'Pending Invoices', value: pendingInvoices, icon: FileText, color: overdueInvoices > 0 ? 'text-red-500' : 'text-amber-500', bg: overdueInvoices > 0 ? 'bg-red-50' : 'bg-amber-50', href: '/invoices' },
    { label: 'Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'text-[#6366F1]', bg: 'bg-[#6366F1]/10', href: '/invoices' },
  ]

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-400 mt-0.5">Here's what's happening.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
        {stats.map(({ label, value, icon: Icon, color, bg, href }) => (
          <Link key={label} href={href}
            className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 flex items-center gap-3 hover:shadow-md transition-all hover:-translate-y-0.5">
            <div className={`${bg} rounded-xl p-2.5 flex-shrink-0`}><Icon size={19} className={color} /></div>
            <div className="min-w-0">
              <p className="text-xs text-gray-400 truncate">{label}</p>
              <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Alerts */}
      {overdueInvoices > 0 && (
        <div className="mb-4 bg-red-50 border border-red-100 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 font-medium">{overdueInvoices} overdue invoice{overdueInvoices > 1 ? 's' : ''}</p>
          </div>
          <Link href="/invoices" className="text-xs font-bold text-red-600 hover:text-red-700 whitespace-nowrap">Review →</Link>
        </div>
      )}

      {overdueTasks && overdueTasks.length > 0 && (
        <div className="mb-5 bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <Clock size={14} className="text-amber-500" />
            <p className="text-sm font-semibold text-amber-700">{overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''}</p>
          </div>
          <div className="space-y-1">
            {overdueTasks.map((task: any) => {
              const proj = task.phases?.[0]?.projects
              return (
                <div key={task.id} className="flex items-center justify-between text-xs text-amber-700">
                  <span className="truncate">{task.title}</span>
                  {proj && (
                    <Link href={`/projects/${proj.id}`} className="text-amber-500 hover:underline ml-2 flex-shrink-0">{proj.name} →</Link>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Recent projects */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Projects</h2>
            <Link href="/projects" className="text-xs font-semibold text-[#6366F1] hover:text-[#4f46e5] flex items-center gap-1">
              All <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {!projects?.length ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400">No projects yet.</p>
            ) : projects.map(project => {
              const phases = (project.phases as { completion_pct: number }[]) ?? []
              const progress = phases.length ? Math.round(phases.reduce((s, p) => s + p.completion_pct, 0) / phases.length) : 0
              const client = (project.clients as { name: string }[] | null)?.[0] ?? null
              const now = new Date()
              const due = project.due_date ? new Date(project.due_date) : null
              const daysLeft = due ? Math.round((due.getTime() - now.getTime()) / 86400000) : null
              const isOverdue = daysLeft !== null && daysLeft < 0

              // Health: red if overdue + low progress, yellow if behind, green otherwise
              const health = isOverdue && progress < 80 ? 'red' : (daysLeft !== null && daysLeft < 7 && progress < 60) ? 'amber' : 'green'

              return (
                <Link key={project.id} href={`/projects/${project.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${health === 'red' ? 'bg-red-400' : health === 'amber' ? 'bg-amber-400' : 'bg-green-400'}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 text-sm truncate">{project.name}</p>
                      {client && <p className="text-xs text-gray-400 hidden sm:block truncate">· {client.name}</p>}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5 max-w-[120px]">
                        <div className="bg-[#6366F1] h-1.5 rounded-full" style={{ width: `${progress}%` }} />
                      </div>
                      <span className="text-xs text-gray-400 tabular-nums">{progress}%</span>
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusBadgeClass(project.status)}`}>
                      {statusLabel(project.status)}
                    </span>
                    {daysLeft !== null && (
                      <p className={`text-xs mt-1 ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
                        {isOverdue ? `${Math.abs(daysLeft)}d over` : `${daysLeft}d left`}
                      </p>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Activity feed */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
            <Zap size={14} className="text-[#6366F1]" />
            <h2 className="font-semibold text-gray-900">Activity</h2>
          </div>
          <div className="divide-y divide-gray-50 max-h-80 overflow-y-auto scrollbar-hide">
            {!activity?.length ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400">No activity yet.</p>
            ) : activity.map((item: any) => (
              <div key={item.id} className="px-4 py-3 flex items-start gap-2.5">
                <span className="text-base flex-shrink-0 mt-0.5">{actionIcon(item.action)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-700 leading-snug">{item.subject}</p>
                  {item.projects?.name && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">{item.projects.name}</p>
                  )}
                  <p className="text-xs text-gray-300 mt-0.5">{formatDate(item.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-5 bg-white rounded-2xl border border-gray-100 p-5">
        <h2 className="font-semibold text-gray-900 mb-4 text-sm">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'New Project', href: '/projects/new', emoji: '🚀' },
            { label: 'Add Client', href: '/clients/new', emoji: '👤' },
            { label: 'New Invoice', href: '/invoices/new', emoji: '💳' },
            { label: 'Templates', href: '/templates', emoji: '📋' },
          ].map(({ label, href, emoji }) => (
            <Link key={label} href={href}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-[#6366F1]/40 hover:bg-[#6366F1]/5 transition-all text-center">
              <span className="text-2xl">{emoji}</span>
              <span className="text-xs font-semibold text-gray-600">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
