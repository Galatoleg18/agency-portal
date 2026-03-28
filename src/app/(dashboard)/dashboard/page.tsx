import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate, statusBadgeClass, statusLabel } from '@/lib/utils'
import { Users, FolderKanban, FileText, DollarSign } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  // Fetch all data in parallel
  const [
    { count: totalClients },
    { data: projects },
    { data: invoices },
  ] = await Promise.all([
    supabase.from('clients').select('*', { count: 'exact', head: true }),
    supabase
      .from('projects')
      .select(`
        id, name, status, due_date,
        clients(name),
        phases(completion_pct)
      `)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('invoices').select('amount, status'),
  ])

  const activeProjects = projects?.filter((p) => p.status === 'active').length ?? 0
  const pendingInvoices = invoices?.filter((i) => i.status === 'unpaid' || i.status === 'overdue').length ?? 0
  const totalRevenue = invoices?.filter((i) => i.status === 'paid').reduce((sum, i) => sum + (i.amount ?? 0), 0) ?? 0

  const recentProjects = projects ?? []

  const statCards = [
    {
      label: 'Total Clients',
      value: totalClients ?? 0,
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      label: 'Active Projects',
      value: activeProjects,
      icon: FolderKanban,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Pending Invoices',
      value: pendingInvoices,
      icon: FileText,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
    },
    {
      label: 'Total Revenue',
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      color: 'text-[#C9A96E]',
      bg: 'bg-[#C9A96E]/10',
    },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4"
          >
            <div className={`${bg} rounded-xl p-3`}>
              <Icon size={22} className={color} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent projects */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">
            Recent Projects
          </h2>
        </div>
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
                  Due Date
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
              </tr>
            </thead>
            <tbody>
              {recentProjects.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-10 text-center text-gray-400"
                  >
                    No projects yet.
                  </td>
                </tr>
              ) : (
                recentProjects.map((project) => {
                  const phases = (project.phases as { completion_pct: number }[]) ?? []
                  const progress =
                    phases.length > 0
                      ? Math.round(
                          phases.reduce((s, ph) => s + ph.completion_pct, 0) /
                            phases.length
                        )
                      : 0
                  const client = (project.clients as { name: string }[] | null)?.[0] ?? null

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
                      <td className="px-6 py-4 text-gray-600">
                        {formatDate(project.due_date)}
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
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
