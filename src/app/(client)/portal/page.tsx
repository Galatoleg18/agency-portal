import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate, statusBadgeClass, statusLabel } from '@/lib/utils'
import { ArrowRight, FolderKanban, Calendar, CheckCircle2 } from 'lucide-react'

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
          Your account hasn't been linked to any client record yet. Contact your DOT IT project manager.
        </p>
      </div>
    )
  }

  const { data: projects } = await supabase
    .from('projects')
    .select(`id, name, status, due_date, phases(completion_pct, tasks(is_complete), id)`)
    .eq('client_id', clientRecord.id)
    .order('created_at', { ascending: false })

  const activeCount = projects?.filter(p => p.status === 'active').length ?? 0

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">
          Hello{clientRecord.name ? `, ${clientRecord.name}` : ''} 👋
        </h1>
        <p className="text-gray-400 text-sm mt-0.5">
          {clientRecord.company ? clientRecord.company + ' · ' : ''}{activeCount} active project{activeCount !== 1 ? 's' : ''}
        </p>
      </div>

      {!projects?.length ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <FolderKanban size={36} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-500 text-sm">No projects to display yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map(project => {
            const phases = (project.phases as { completion_pct: number; id: string; tasks: { is_complete: boolean }[] }[]) ?? []
            const progress = phases.length ? Math.round(phases.reduce((s, p) => s + p.completion_pct, 0) / phases.length) : 0
            const totalTasks = phases.reduce((s, p) => s + (p.tasks?.length ?? 0), 0)
            const doneTasks = phases.reduce((s, p) => s + (p.tasks?.filter(t => t.is_complete).length ?? 0), 0)

            return (
              <Link key={project.id} href={`/portal/${project.id}`}
                className="block bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all hover:-translate-y-0.5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-base truncate">{project.name}</h3>
                    {project.due_date && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <Calendar size={11} /> Due {formatDate(project.due_date)}
                      </p>
                    )}
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold flex-shrink-0 ${statusBadgeClass(project.status)}`}>
                    {statusLabel(project.status)}
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="bg-[#22C55E] h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  <span className="text-sm font-bold text-gray-700 tabular-nums w-10 text-right">{progress}%</span>
                </div>

                <div className="flex items-center justify-between">
                  {totalTasks > 0 && (
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <CheckCircle2 size={12} className="text-green-400" />
                      {doneTasks}/{totalTasks} tasks complete
                    </p>
                  )}
                  <span className="text-xs font-semibold text-[#22C55E] flex items-center gap-1 ml-auto">
                    View details <ArrowRight size={12} />
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
