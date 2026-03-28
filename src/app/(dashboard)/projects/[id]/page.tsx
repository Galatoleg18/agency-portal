import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate, statusBadgeClass, statusLabel } from '@/lib/utils'
import { ArrowLeft, Calendar, Building2 } from 'lucide-react'
import TaskToggle from '@/components/TaskToggle'
import AddCommentForm from '@/components/AddCommentForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: project }, { data: comments }] = await Promise.all([
    supabase
      .from('projects')
      .select(`
        id, name, description, status, start_date, due_date, budget,
        clients(id, name, email, company),
        phases(
          id, name, status, completion_pct, sort_order, description,
          tasks(id, title, is_complete, sort_order, due_date),
          deliverables(id, title, status, description, file_url)
        )
      `)
      .eq('id', id)
      .single(),
    supabase
      .from('comments')
      .select('id, body, author_name, author_email, created_at, phase_id')
      .eq('project_id', id)
      .order('created_at', { ascending: true }),
  ])

  if (!project) notFound()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const client = project.clients as {
    id: string
    name: string
    email: string
    company: string | null
  } | null

  const phases = (
    (project.phases as Array<{
      id: string
      name: string
      status: string
      completion_pct: number
      sort_order: number
      description: string | null
      tasks: Array<{
        id: string
        title: string
        is_complete: boolean
        sort_order: number
        due_date: string | null
      }>
      deliverables: Array<{
        id: string
        title: string
        status: string
        description: string | null
        file_url: string | null
      }>
    }>) ?? []
  ).sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div>
      {/* Back */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/projects"
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={16} />
          Projects
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-medium text-gray-900">{project.name}</span>
      </div>

      {/* Project header card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-gray-900">
                {project.name}
              </h1>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(
                  project.status
                )}`}
              >
                {statusLabel(project.status)}
              </span>
            </div>
            {project.description && (
              <p className="text-gray-600 text-sm mb-4">{project.description}</p>
            )}
            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              {client && (
                <div className="flex items-center gap-1.5">
                  <Building2 size={14} className="text-gray-400" />
                  <span>
                    {client.name}
                    {client.company ? ` — ${client.company}` : ''}
                  </span>
                </div>
              )}
              {project.start_date && (
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-gray-400" />
                  <span>Start: {formatDate(project.start_date)}</span>
                </div>
              )}
              {project.due_date && (
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-gray-400" />
                  <span>Due: {formatDate(project.due_date)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Phases */}
      <div className="space-y-5 mb-8">
        <h2 className="text-lg font-semibold text-gray-900">Phases</h2>

        {phases.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-400">
            No phases defined for this project yet.
          </div>
        ) : (
          phases.map((phase) => {
            const tasks = [...(phase.tasks ?? [])].sort(
              (a, b) => a.sort_order - b.sort_order
            )
            const deliverables = phase.deliverables ?? []
            const completedTasks = tasks.filter((t) => t.is_complete).length

            return (
              <div
                key={phase.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
              >
                {/* Phase header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div>
                    <div className="flex items-center gap-2.5 mb-1">
                      <h3 className="font-semibold text-gray-900">
                        {phase.name}
                      </h3>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(
                          phase.status
                        )}`}
                      >
                        {statusLabel(phase.status)}
                      </span>
                    </div>
                    {phase.description && (
                      <p className="text-sm text-gray-500">{phase.description}</p>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-[#C9A96E] whitespace-nowrap">
                    {phase.completion_pct}% complete
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-100 rounded-full h-2 mb-5">
                  <div
                    className="bg-[#C9A96E] h-2 rounded-full transition-all"
                    style={{ width: `${phase.completion_pct}%` }}
                  />
                </div>

                {/* Tasks */}
                {tasks.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                      Tasks ({completedTasks}/{tasks.length})
                    </p>
                    <div className="space-y-2">
                      {tasks.map((task) => (
                        <TaskToggle
                          key={task.id}
                          taskId={task.id}
                          title={task.title}
                          isComplete={task.is_complete}
                          dueDate={task.due_date}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Deliverables */}
                {deliverables.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                      Deliverables
                    </p>
                    <div className="space-y-2">
                      {deliverables.map((d) => (
                        <div
                          key={d.id}
                          className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-4 py-3"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {d.title}
                            </p>
                            {d.description && (
                              <p className="text-xs text-gray-500 mt-0.5">
                                {d.description}
                              </p>
                            )}
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${statusBadgeClass(
                              d.status
                            )}`}
                          >
                            {statusLabel(d.status)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Comments */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-5">Comments</h2>

        <div className="space-y-4 mb-6">
          {!comments || comments.length === 0 ? (
            <p className="text-sm text-gray-400">
              No comments yet. Be the first to comment.
            </p>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="flex gap-3"
              >
                <div className="w-8 h-8 rounded-full bg-[#0D1F3C] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                  {(comment.author_name ?? comment.author_email)?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-900">
                      {comment.author_name ?? comment.author_email}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {comment.body}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add comment */}
        <AddCommentForm
          projectId={project.id}
          authorEmail={user?.email ?? ''}
          authorName={user?.user_metadata?.full_name ?? user?.email ?? ''}
        />
      </div>
    </div>
  )
}
