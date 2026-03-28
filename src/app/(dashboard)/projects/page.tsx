import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate, statusBadgeClass, statusLabel } from '@/lib/utils'
import { FolderKanban, ArrowRight } from 'lucide-react'

export default async function ProjectsPage() {
  const supabase = await createClient()

  const { data: projects } = await supabase
    .from('projects')
    .select(`
      id, name, status, due_date,
      clients(name),
      phases(completion_pct)
    `)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {!projects || projects.length === 0 ? (
          <div className="p-12 text-center">
            <FolderKanban size={40} className="mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No projects found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Progress
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => {
                  const phases =
                    (project.phases as { completion_pct: number }[]) ?? []
                  const progress =
                    phases.length > 0
                      ? Math.round(
                          phases.reduce(
                            (s, ph) => s + ph.completion_pct,
                            0
                          ) / phases.length
                        )
                      : 0
                  const client = project.clients as { name: string } | null

                  return (
                    <tr
                      key={project.id}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {project.name}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {client?.name ?? '—'}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(
                            project.status
                          )}`}
                        >
                          {statusLabel(project.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-gray-100 rounded-full h-2 min-w-[80px]">
                            <div
                              className="bg-[#C9A96E] h-2 rounded-full transition-all"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-9 text-right">
                            {progress}%
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {formatDate(project.due_date)}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/projects/${project.id}`}
                          className="flex items-center gap-1 text-[#C9A96E] hover:text-[#b8924d] text-sm font-medium transition-colors"
                        >
                          View <ArrowRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
