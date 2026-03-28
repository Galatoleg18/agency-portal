import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate, statusBadgeClass, statusLabel } from '@/lib/utils'
import { FolderKanban, Plus, ArrowRight, Calendar } from 'lucide-react'

export default async function ProjectsPage() {
  const supabase = await createClient()

  const { data: projects } = await supabase
    .from('projects')
    .select(`id, name, status, due_date, clients(name), phases(completion_pct)`)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-sm text-gray-500 mt-0.5">{projects?.length ?? 0} total</p>
        </div>
        <Link href="/projects/new"
          className="inline-flex items-center gap-2 bg-[#C9A96E] hover:bg-[#b8924d] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm">
          <Plus size={16} />
          <span className="hidden sm:inline">New Project</span>
          <span className="sm:hidden">New</span>
        </Link>
      </div>

      {!projects || projects.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <FolderKanban size={40} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-700 font-medium mb-1">No projects yet</p>
          <p className="text-gray-400 text-sm mb-5">Create your first project to start tracking progress.</p>
          <Link href="/projects/new"
            className="inline-flex items-center gap-2 bg-[#C9A96E] hover:bg-[#b8924d] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
            <Plus size={15} /> Create First Project
          </Link>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {projects.map((project) => {
              const phases = (project.phases as { completion_pct: number }[]) ?? []
              const progress = phases.length > 0
                ? Math.round(phases.reduce((s, ph) => s + ph.completion_pct, 0) / phases.length) : 0
              const client = (project.clients as { name: string }[] | null)?.[0] ?? null
              return (
                <Link key={project.id} href={`/projects/${project.id}`}
                  className="block bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="font-semibold text-gray-900 truncate">{project.name}</p>
                      <p className="text-sm text-gray-400 mt-0.5">{client?.name ?? 'No client'}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold flex-shrink-0 ${statusBadgeClass(project.status)}`}>
                      {statusLabel(project.status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div className="bg-[#C9A96E] h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <span className="text-xs font-medium text-gray-500 w-9 text-right">{progress}%</span>
                  </div>
                  {project.due_date && (
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-2">
                      <Calendar size={12} />
                      Due {formatDate(project.due_date)}
                    </div>
                  )}
                </Link>
              )
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Project', 'Client', 'Status', 'Progress', 'Due Date', ''].map((h, i) => (
                      <th key={i} className={`${i === 3 || i === 5 ? '' : 'text-left'} px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project) => {
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
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-28 bg-gray-100 rounded-full h-2">
                              <div className="bg-[#C9A96E] h-2 rounded-full" style={{ width: `${progress}%` }} />
                            </div>
                            <span className="text-xs text-gray-400 w-8">{progress}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-gray-500">{formatDate(project.due_date)}</td>
                        <td className="px-5 py-4">
                          <Link href={`/projects/${project.id}`}
                            className="text-[#C9A96E] hover:text-[#b8924d] font-medium flex items-center gap-1">
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
        </>
      )}
    </div>
  )
}
