import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate, statusBadgeClass, statusLabel } from '@/lib/utils'
import { ArrowRight, FolderKanban } from 'lucide-react'

export default async function ClientPortalPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Find client record by email
  const { data: clientRecord } = await supabase
    .from('clients')
    .select('id, name, company')
    .eq('email', user.email ?? '')
    .single()

  // If no client record, show a message
  if (!clientRecord) {
    return (
      <div className="text-center py-20">
        <FolderKanban size={48} className="mx-auto text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          No projects yet
        </h2>
        <p className="text-gray-500 text-sm">
          Your account ({user.email}) hasn&apos;t been linked to any client
          record. Please contact your DOT IT project manager.
        </p>
      </div>
    )
  }

  // Fetch projects for this client
  const { data: projects } = await supabase
    .from('projects')
    .select(`
      id, name, status, due_date,
      phases(completion_pct)
    `)
    .eq('client_id', clientRecord.id)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back{clientRecord.name ? `, ${clientRecord.name}` : ''}
        </h1>
        {clientRecord.company && (
          <p className="text-gray-500 mt-1">{clientRecord.company}</p>
        )}
      </div>

      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Your Projects
      </h2>

      {!projects || projects.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-10 text-center">
          <FolderKanban size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No projects to display yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {projects.map((project) => {
            const phases =
              (project.phases as { completion_pct: number }[]) ?? []
            const progress =
              phases.length > 0
                ? Math.round(
                    phases.reduce((s, ph) => s + ph.completion_pct, 0) /
                      phases.length
                  )
                : 0

            return (
              <div
                key={project.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2.5 mb-2">
                      <h3 className="font-semibold text-gray-900 text-lg">
                        {project.name}
                      </h3>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(
                          project.status
                        )}`}
                      >
                        {statusLabel(project.status)}
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-2 max-w-xs">
                        <div
                          className="bg-[#C9A96E] h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 font-medium">
                        {progress}% complete
                      </span>
                    </div>

                    {project.due_date && (
                      <p className="text-sm text-gray-500">
                        Due: {formatDate(project.due_date)}
                      </p>
                    )}
                  </div>

                  <Link
                    href={`/portal/${project.id}`}
                    className="flex items-center gap-1.5 text-sm text-[#C9A96E] hover:text-[#b8924d] font-semibold transition-colors whitespace-nowrap"
                  >
                    View details <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
