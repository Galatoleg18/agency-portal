import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate, statusBadgeClass, statusLabel } from '@/lib/utils'
import { Users, FolderKanban, FileText, DollarSign, ArrowRight, AlertTriangle, Clock, Zap, Plus, Calendar, Building2, CheckCircle2 } from 'lucide-react'
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
      .select(`id, name, status, due_date, created_at, clients(name), phases(completion_pct, tasks(is_complete, due_date))`)
      .not('status', 'in', '(archived,cancelled)')
      .order('created_at', { ascending: false }),
    supabase.from('invoices').select('amount, status, due_date'),
    supabase.from('activity_log')
      .select('id, action, subject, actor_name, actor_email, created_at, project_id, projects(name)')
      .order('created_at', { ascending: false }).limit(15),
    // Only tasks WITH a due_date that is in the past
    supabase.from('tasks')
      .select('id, title, due_date, phases(project_id, projects(id, name))')
      .eq('is_complete', false)
      .not('due_date', 'is', null)
      .lt('due_date', new Date().toISOString().split('T')[0])
      .limit(8),
  ])

  const activeProjects = projects?.filter(p => p.status === 'active') ?? []
  const onHoldProjects = projects?.filter(p => p.status === 'on_hold') ?? []
  const recentProjects = projects?.slice(0, 6) ?? []

  const pendingInvoices = invoices?.filter(i => i.status === 'unpaid' || i.status === 'overdue').length ?? 0
  const overdueInvoices = invoices?.filter(i => i.status === 'overdue').length ?? 0
  const totalRevenue = invoices?.filter(i => i.status === 'paid').reduce((s, i) => s + (i.amount ?? 0), 0) ?? 0

  const now = new Date()

  // Overdue projects (has due_date in the past, not completed)
  const overdueProjects = projects?.filter(p => {
    if (!p.due_date) return false
    return new Date(p.due_date) < now && p.status !== 'completed'
  }) ?? []

  const stats = [
    { label: 'Clients', value: totalClients ?? 0, icon: Users, color: 'text-violet-500', bg: 'bg-violet-50', href: '/clients' },
    { label: 'Active Projects', value: activeProjects.length, icon: FolderKanban, color: 'text-sky-500', bg: 'bg-sky-50', href: '/projects' },
    { label: 'Pending Invoices', value: pendingInvoices, icon: FileText, color: overdueInvoices > 0 ? 'text-red-500' : 'text-amber-500', bg: overdueInvoices > 0 ? 'bg-red-50' : 'bg-amber-50', href: '/invoices' },
    { label: 'Revenue', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'text-[#6366F1]', bg: 'bg-[#6366F1]/10', href: '/invoices' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-400 mt-0.5">Here's what needs your attention.</p>
        </div>
        <Link href="/projects/new"
          className="inline-flex items-center gap-2 bg-[#6366F1] hover:bg-[#4f46e5] text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm">
          <Plus size={15} /> New Project
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
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

      {/* ⚠️ Alerts section */}
      {(overdueInvoices > 0 || overdueProjects.length > 0 || (overdueTasks && overdueTasks.length > 0)) && (
        <div className="mb-5 space-y-3">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle size={13} className="text-red-400" /> Needs Attention
          </h2>

          {overdueInvoices > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <AlertTriangle size={15} className="text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700 font-medium">{overdueInvoices} overdue invoice{overdueInvoices > 1 ? 's' : ''}</p>
              </div>
              <Link href="/invoices" className="text-xs font-bold text-red-600 hover:text-red-700 whitespace-nowrap">Review →</Link>
            </div>
          )}

          {overdueProjects.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={14} className="text-red-500" />
                <p className="text-sm font-semibold text-red-700">{overdueProjects.length} overdue project{overdueProjects.length > 1 ? 's' : ''}</p>
              </div>
              <div className="space-y-1">
                {overdueProjects.map((p: any) => {
                  const daysOver = Math.round((now.getTime() - new Date(p.due_date).getTime()) / 86400000)
                  return (
                    <div key={p.id} className="flex items-center justify-between text-xs text-red-700">
                      <span className="truncate font-medium">{p.name}</span>
                      <Link href={`/projects/${p.id}`} className="text-red-500 hover:underline ml-2 flex-shrink-0 flex items-center gap-1">
                        {daysOver}d over <ArrowRight size={10} />
                      </Link>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {overdueTasks && overdueTasks.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={14} className="text-amber-500" />
                <p className="text-sm font-semibold text-amber-700">{overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''} (with deadlines)</p>
              </div>
              <div className="space-y-1">
                {overdueTasks.map((task: any) => {
                  const proj = task.phases?.[0]?.projects
                  const daysOver = task.due_date ? Math.round((now.getTime() - new Date(task.due_date).getTime()) / 86400000) : 0
                  return (
                    <div key={task.id} className="flex items-center justify-between text-xs text-amber-700">
                      <span className="truncate">{task.title}</span>
                      {proj && (
                        <Link href={`/projects/${proj.id}`} className="text-amber-500 hover:underline ml-2 flex-shrink-0">
                          {proj.name} · {daysOver}d →
                        </Link>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 mb-5">

        {/* Recent / Active Projects — takes 2 cols */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-gray-900">Projects</h2>
              <p className="text-xs text-gray-400 mt-0.5">{activeProjects.length} active · {onHoldProjects.length} on hold</p>
            </div>
            <Link href="/projects" className="text-xs font-semibold text-[#6366F1] hover:text-[#4f46e5] flex items-center gap-1">
              All <ArrowRight size={12} />
            </Link>
          </div>

          {!recentProjects.length ? (
            <div className="px-5 py-12 text-center">
              <FolderKanban size={28} className="mx-auto text-gray-200 mb-3" />
              <p className="text-sm text-gray-400 mb-4">No projects yet.</p>
              <Link href="/projects/new"
                className="inline-flex items-center gap-1.5 bg-[#6366F1] text-white text-xs font-bold px-4 py-2 rounded-xl">
                <Plus size={13} /> Create First Project
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentProjects.map((project: any) => {
                const phases = (project.phases as { completion_pct: number; tasks: { is_complete: boolean; due_date: string | null }[] }[]) ?? []
                const progress = phases.length ? Math.round(phases.reduce((s: number, p: any) => s + p.completion_pct, 0) / phases.length) : 0
                const client = (project.clients as { name: string }[] | null)?.[0] ?? null
                const due = project.due_date ? new Date(project.due_date) : null
                const daysLeft = due ? Math.round((due.getTime() - now.getTime()) / 86400000) : null
                const isOverdue = daysLeft !== null && daysLeft < 0
                const isUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 5
                const health = isOverdue ? 'red' : isUrgent ? 'amber' : 'green'

                // Count tasks — only "overdue" if they have due_date
                const allTasks = phases.flatMap((p: any) => p.tasks ?? [])
                const tasksDue = allTasks.filter((t: any) => !t.is_complete && t.due_date && new Date(t.due_date) < now).length

                return (
                  <Link key={project.id} href={`/projects/${project.id}`}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/50 transition-colors group">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${health === 'red' ? 'bg-red-400' : health === 'amber' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-medium text-gray-900 text-sm truncate">{project.name}</p>
                        {tasksDue > 0 && (
                          <span className="flex-shrink-0 text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-semibold">
                            {tasksDue} task{tasksDue > 1 ? 's' : ''} due
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {client && <p className="text-xs text-gray-400 flex items-center gap-0.5 flex-shrink-0"><Building2 size={10} /> {client.name}</p>}
                        {client && project.due_date && <span className="text-gray-200 text-xs">·</span>}
                        {project.due_date && (
                          <p className={`text-xs flex items-center gap-0.5 flex-shrink-0 ${isOverdue ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                            <Calendar size={10} />
                            {isOverdue ? `${Math.abs(daysLeft!)}d overdue` : `Due ${formatDate(project.due_date)}`}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="hidden sm:flex items-center gap-1.5">
                        <div className="w-20 bg-gray-100 rounded-full h-1.5">
                          <div className="bg-[#6366F1] h-1.5 rounded-full" style={{ width: `${progress}%` }} />
                        </div>
                        <span className="text-xs text-gray-400 tabular-nums w-8">{progress}%</span>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full hidden sm:inline ${statusBadgeClass(project.status)}`}>
                        {statusLabel(project.status)}
                      </span>
                      <ArrowRight size={13} className="text-gray-300 group-hover:text-[#6366F1] transition-colors" />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Activity feed */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
            <Zap size={14} className="text-[#6366F1]" />
            <h2 className="font-semibold text-gray-900">Recent Activity</h2>
          </div>
          <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
            {!activity?.length ? (
              <p className="px-5 py-8 text-center text-sm text-gray-400">No activity yet.</p>
            ) : activity.map((item: any) => (
              <div key={item.id} className="px-4 py-3 flex items-start gap-2.5">
                <span className="text-sm flex-shrink-0 mt-0.5">{actionIcon(item.action)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-700 leading-snug">{item.subject}</p>
                  {item.projects?.name && (
                    <Link href={`/projects/${item.project_id}`} className="text-xs text-[#6366F1] hover:underline truncate block mt-0.5">{item.projects.name}</Link>
                  )}
                  <p className="text-xs text-gray-300 mt-0.5">{formatDate(item.created_at)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
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
