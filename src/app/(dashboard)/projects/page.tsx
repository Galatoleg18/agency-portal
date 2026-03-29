import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate, statusBadgeClass, statusLabel } from '@/lib/utils'
import { FolderKanban, Plus, ArrowRight, Calendar, Building2 } from 'lucide-react'

export default async function ProjectsPage() {
  const supabase = await createClient()
  const { data: projects } = await supabase
    .from('projects')
    .select(`id, name, status, due_date, description, clients(name), phases(completion_pct)`)
    .order('created_at', { ascending: false })

  const grouped = {
    active: projects?.filter(p => p.status === 'active') ?? [],
    on_hold: projects?.filter(p => p.status === 'on_hold') ?? [],
    completed: projects?.filter(p => p.status === 'completed') ?? [],
    cancelled: projects?.filter(p => p.status === 'cancelled') ?? [],
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-400 mt-0.5">{projects?.length ?? 0} total · {grouped.active.length} active</p>
        </div>
        <Link href="/projects/new"
          className="inline-flex items-center gap-2 bg-[#6366F1] hover:bg-[#4f46e5] text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md">
          <Plus size={16} />
          <span className="hidden sm:inline">New Project</span>
          <span className="sm:hidden">New</span>
        </Link>
      </div>

      {!projects?.length ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FolderKanban size={28} className="text-gray-300" />
          </div>
          <p className="font-semibold text-gray-700 mb-1">No projects yet</p>
          <p className="text-gray-400 text-sm mb-6">Create your first project to start tracking.</p>
          <Link href="/projects/new"
            className="inline-flex items-center gap-2 bg-[#6366F1] hover:bg-[#4f46e5] text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all">
            <Plus size={15} /> Create Project
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {(Object.entries(grouped) as [string, typeof projects][]).map(([groupStatus, items]) => {
            if (!items.length) return null
            return (
              <div key={groupStatus}>
                <div className="flex items-center gap-2.5 mb-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(groupStatus)}`}>
                    {statusLabel(groupStatus)}
                  </span>
                  <span className="text-xs text-gray-400">{items.length}</span>
                </div>

                {/* Mobile cards */}
                <div className="sm:hidden space-y-3">
                  {items.map(project => {
                    const phases = (project.phases as { completion_pct: number }[]) ?? []
                    const progress = phases.length ? Math.round(phases.reduce((s, p) => s + p.completion_pct, 0) / phases.length) : 0
                    const client = (project.clients as { name: string }[] | null)?.[0] ?? null
                    return (
                      <Link key={project.id} href={`/projects/${project.id}`}
                        className="block bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-all">
                        <p className="font-semibold text-gray-900 mb-0.5">{project.name}</p>
                        {client && <p className="text-xs text-gray-400 flex items-center gap-1 mb-3"><Building2 size={11} />{client.name}</p>}
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                            <div className="bg-[#6366F1] h-1.5 rounded-full" style={{ width: `${progress}%` }} />
                          </div>
                          <span className="text-xs font-medium text-gray-500 tabular-nums w-8 text-right">{progress}%</span>
                        </div>
                        {project.due_date && (
                          <p className="text-xs text-gray-400 flex items-center gap-1"><Calendar size={11} />Due {formatDate(project.due_date)}</p>
                        )}
                      </Link>
                    )
                  })}
                </div>

                {/* Desktop table */}
                <div className="hidden sm:block bg-white rounded-2xl border border-gray-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <tbody>
                      {items.map(project => {
                        const phases = (project.phases as { completion_pct: number }[]) ?? []
                        const progress = phases.length ? Math.round(phases.reduce((s, p) => s + p.completion_pct, 0) / phases.length) : 0
                        const client = (project.clients as { name: string }[] | null)?.[0] ?? null
                        return (
                          <tr key={project.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                            <td className="px-5 py-4">
                              <p className="font-medium text-gray-900">{project.name}</p>
                              {client && <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1"><Building2 size={11} />{client.name}</p>}
                            </td>
                            <td className="px-5 py-4 w-48">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                                  <div className="bg-[#6366F1] h-1.5 rounded-full" style={{ width: `${progress}%` }} />
                                </div>
                                <span className="text-xs text-gray-400 tabular-nums w-8">{progress}%</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 text-xs text-gray-400 w-32">
                              {project.due_date ? <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(project.due_date)}</span> : '—'}
                            </td>
                            <td className="px-5 py-4 w-16 text-right">
                              <Link href={`/projects/${project.id}`}
                                className="inline-flex items-center gap-1 text-[#6366F1] hover:text-[#4f46e5] font-semibold text-xs transition-colors">
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
            )
          })}
        </div>
      )}
    </div>
  )
}
