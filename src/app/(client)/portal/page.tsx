import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate, statusBadgeClass, statusLabel } from '@/lib/utils'
import { ArrowRight, FolderKanban, Calendar, CheckCircle2, Circle, AlertTriangle, Clock } from 'lucide-react'

export default async function ClientPortalPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: clientRecord } = await supabase
    .from('clients').select('id, name, company').eq('email', user.email ?? '').single()

  if (!clientRecord) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FolderKanban size={28} className="text-gray-300" />
        </div>
        <h2 className="text-lg font-semibold text-gray-700 mb-2">No projects linked</h2>
        <p className="text-gray-400 text-sm max-w-sm mx-auto">
          Your account hasn't been linked to any client record yet. Contact your DOT.IT project manager.
        </p>
      </div>
    )
  }

  const { data: projects } = await supabase
    .from('projects')
    .select(`id, name, status, due_date, created_at, description,
      phases(completion_pct, id,
        tasks(id, is_complete, due_date))`)
    .eq('client_id', clientRecord.id)
    .not('status', 'in', '(archived,cancelled)')
    .order('created_at', { ascending: false })

  const now = new Date()
  const active = projects?.filter(p => p.status === 'active') ?? []
  const onHold = projects?.filter(p => p.status === 'on_hold') ?? []
  const completed = projects?.filter(p => p.status === 'completed') ?? []

  // Projects with overdue due_date (only if due_date is set)
  const overdueProjects = projects?.filter(p => p.due_date && new Date(p.due_date) < now && p.status !== 'completed') ?? []

  // Tasks overdue across all projects (only those WITH a due_date)
  const allOverdueTasks = projects?.flatMap(p => {
    const phases = (p.phases as any[]) ?? []
    return phases.flatMap(ph => (ph.tasks ?? []).filter((t: any) => !t.is_complete && t.due_date && new Date(t.due_date) < now))
  }) ?? []

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Hello{clientRecord.name ? `, ${clientRecord.name}` : ''} 👋
        </h1>
        <p className="text-gray-400 text-sm mt-0.5">
          {clientRecord.company ? clientRecord.company + ' · ' : ''}
          {active.length} active · {onHold.length} on hold · {completed.length} completed
        </p>
      </div>

      {/* Alerts */}
      {(overdueProjects.length > 0 || allOverdueTasks.length > 0) && (
        <div className="mb-5 space-y-3">
          {overdueProjects.length > 0 && (
            <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 flex items-start gap-3">
              <AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-red-700 mb-1">
                  {overdueProjects.length} project{overdueProjects.length > 1 ? 's are' : ' is'} past the deadline
                </p>
                <div className="space-y-0.5">
                  {overdueProjects.map((p: any) => {
                    const daysOver = Math.round((now.getTime() - new Date(p.due_date).getTime()) / 86400000)
                    return (
                      <Link key={p.id} href={`/portal/${p.id}`} className="flex items-center gap-2 text-xs text-red-600 hover:underline">
                        <span>{p.name}</span>
                        <span className="text-red-400">· {daysOver}d overdue</span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
          {allOverdueTasks.length > 0 && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl px-4 py-3 flex items-center gap-3">
              <Clock size={15} className="text-amber-500 flex-shrink-0" />
              <p className="text-sm text-amber-700 font-medium">
                {allOverdueTasks.length} task{allOverdueTasks.length > 1 ? 's' : ''} with missed deadlines — check your projects below
              </p>
            </div>
          )}
        </div>
      )}

      {!projects?.length ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <FolderKanban size={36} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-500 text-sm">No projects to display yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((project: any) => {
            const phases = (project.phases as { completion_pct: number; id: string; tasks: { id: string; is_complete: boolean; due_date: string | null }[] }[]) ?? []
            const progress = phases.length ? Math.round(phases.reduce((s, p) => s + p.completion_pct, 0) / phases.length) : 0
            const totalTasks = phases.reduce((s, p) => s + (p.tasks?.length ?? 0), 0)
            const doneTasks = phases.reduce((s, p) => s + (p.tasks?.filter(t => t.is_complete).length ?? 0), 0)
            const pendingTasks = totalTasks - doneTasks

            // Only count overdue if task has a due_date
            const overdueTasks = phases.reduce((s, p) => s + (p.tasks?.filter(t => !t.is_complete && t.due_date && new Date(t.due_date) < now).length ?? 0), 0)

            const due = project.due_date ? new Date(project.due_date) : null
            const daysLeft = due ? Math.round((due.getTime() - now.getTime()) / 86400000) : null
            const isOverdue = daysLeft !== null && daysLeft < 0
            const isUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 5

            const borderClass = isOverdue ? 'border-red-200' : isUrgent ? 'border-amber-200' : 'border-gray-100'

            return (
              <Link key={project.id} href={`/portal/${project.id}`}
                className={`block bg-white rounded-2xl border p-5 hover:shadow-md transition-all hover:-translate-y-0.5 ${borderClass}`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900 text-base">{project.name}</h3>
                      {isOverdue && (
                        <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                          Overdue
                        </span>
                      )}
                      {isUrgent && !isOverdue && (
                        <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                          Due soon
                        </span>
                      )}
                      {overdueTasks > 0 && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                          {overdueTasks} task{overdueTasks > 1 ? 's' : ''} overdue
                        </span>
                      )}
                    </div>
                    {project.due_date && (
                      <p className={`text-xs flex items-center gap-1 mt-1 ${isOverdue ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                        <Calendar size={11} />
                        {isOverdue
                          ? `Was due ${formatDate(project.due_date)} — ${Math.abs(daysLeft!)}d ago`
                          : `Due ${formatDate(project.due_date)}${daysLeft !== null ? ` · ${daysLeft}d left` : ''}`}
                      </p>
                    )}
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold flex-shrink-0 ${statusBadgeClass(project.status)}`}>
                    {statusLabel(project.status)}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className={`h-2 rounded-full transition-all ${progress === 100 ? 'bg-emerald-500' : 'bg-[#6366F1]'}`}
                      style={{ width: `${progress}%` }} />
                  </div>
                  <span className="text-sm font-bold text-gray-700 tabular-nums w-10 text-right">{progress}%</span>
                </div>

                {/* Task summary */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {doneTasks > 0 && (
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <CheckCircle2 size={12} className="text-emerald-400" />
                        {doneTasks} done
                      </p>
                    )}
                    {pendingTasks > 0 && (
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Circle size={12} className="text-gray-300" />
                        {pendingTasks} remaining
                      </p>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-[#6366F1] flex items-center gap-1">
                    View <ArrowRight size={12} />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
