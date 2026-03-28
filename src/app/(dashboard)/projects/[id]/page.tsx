import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatDate, statusBadgeClass, statusLabel, formatCurrency } from '@/lib/utils'
import { ArrowLeft, Calendar, Building2, DollarSign, CheckCircle2, Circle } from 'lucide-react'
import TaskToggle from '@/components/TaskToggle'
import AddCommentForm from '@/components/AddCommentForm'
import AddPhaseForm from '@/components/AddPhaseForm'
import AddTaskForm from '@/components/AddTaskForm'
import PhaseProgress from '@/components/PhaseProgress'

interface PageProps { params: Promise<{ id: string }> }

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: project }, { data: comments }] = await Promise.all([
    supabase.from('projects').select(`
      id, name, description, status, start_date, due_date, budget,
      clients(id, name, email, company),
      phases(id, name, status, completion_pct, sort_order, description,
        tasks(id, title, is_complete, sort_order, due_date),
        deliverables(id, title, status, description, file_url))
    `).eq('id', id).single(),
    supabase.from('comments').select('id, body, author_name, author_email, created_at')
      .eq('project_id', id).order('created_at', { ascending: true }),
  ])

  if (!project) notFound()
  const { data: { user } } = await supabase.auth.getUser()

  const client = (project.clients as { id: string; name: string; email: string; company: string | null }[] | null)?.[0] ?? null
  const phases = ((project.phases as Array<{
    id: string; name: string; status: string; completion_pct: number; sort_order: number; description: string | null;
    tasks: Array<{ id: string; title: string; is_complete: boolean; sort_order: number; due_date: string | null }>;
    deliverables: Array<{ id: string; title: string; status: string; description: string | null; file_url: string | null }>;
  }>) ?? []).sort((a, b) => a.sort_order - b.sort_order)

  const overallProgress = phases.length
    ? Math.round(phases.reduce((s, p) => s + p.completion_pct, 0) / phases.length) : 0
  const totalTasks = phases.reduce((s, p) => s + (p.tasks?.length ?? 0), 0)
  const completedTasks = phases.reduce((s, p) => s + (p.tasks?.filter(t => t.is_complete).length ?? 0), 0)

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-5">
        <Link href="/projects" className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft size={15} /> Projects
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-medium text-gray-700 truncate max-w-[200px]">{project.name}</span>
      </div>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 mb-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{project.name}</h1>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(project.status)}`}>
                {statusLabel(project.status)}
              </span>
            </div>
            {project.description && <p className="text-gray-500 text-sm mb-4 leading-relaxed">{project.description}</p>}
            <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">
              {client && (
                <span className="flex items-center gap-1.5">
                  <Building2 size={14} className="text-gray-300" />
                  {client.name}{client.company ? ` · ${client.company}` : ''}
                </span>
              )}
              {project.start_date && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-gray-300" />
                  Start: {formatDate(project.start_date)}
                </span>
              )}
              {project.due_date && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} className="text-gray-300" />
                  Due: {formatDate(project.due_date)}
                </span>
              )}
              {project.budget && (
                <span className="flex items-center gap-1.5">
                  <DollarSign size={14} className="text-gray-300" />
                  Budget: {formatCurrency(project.budget)}
                </span>
              )}
            </div>
          </div>

          {/* Overall progress */}
          <div className="sm:text-right flex-shrink-0">
            <div className="inline-flex items-center gap-3 bg-[#F5F6FA] rounded-xl px-4 py-3">
              <div className="relative w-12 h-12">
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15" fill="none" stroke="#C9A96E" strokeWidth="3"
                    strokeDasharray={`${overallProgress * 0.942} 94.2`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">{overallProgress}%</span>
              </div>
              <div>
                <p className="text-xs text-gray-400">Overall</p>
                <p className="text-sm font-bold text-gray-700">{completedTasks}/{totalTasks} tasks</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Phases */}
      <div className="mb-6">
        <h2 className="text-base font-bold text-gray-900 mb-4">Phases</h2>
        <div className="space-y-4">
          {phases.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
              <p className="text-gray-400 text-sm">No phases yet — add your first phase below.</p>
            </div>
          ) : phases.map((phase, idx) => {
            const tasks = [...(phase.tasks ?? [])].sort((a, b) => a.sort_order - b.sort_order)
            const deliverables = phase.deliverables ?? []
            const done = tasks.filter(t => t.is_complete).length

            return (
              <div key={phase.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {/* Phase header */}
                <div className="px-5 py-4 border-b border-gray-50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-[#0D1F3C]/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-[#0D1F3C]/50">{idx + 1}</span>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <h3 className="font-semibold text-gray-900">{phase.name}</h3>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusBadgeClass(phase.status)}`}>
                            {statusLabel(phase.status)}
                          </span>
                        </div>
                        {phase.description && <p className="text-xs text-gray-400">{phase.description}</p>}
                      </div>
                    </div>
                    <span className="text-sm font-bold text-[#C9A96E] flex-shrink-0">{phase.completion_pct}%</span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 ml-10">
                    <PhaseProgress phaseId={phase.id} currentPct={phase.completion_pct} />
                  </div>
                </div>

                <div className="px-5 py-4 space-y-5">
                  {/* Tasks */}
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      Tasks
                      {tasks.length > 0 && (
                        <span className="font-normal normal-case tracking-normal">
                          {done === tasks.length && tasks.length > 0
                            ? <span className="text-green-500 flex items-center gap-1"><CheckCircle2 size={12} /> All done</span>
                            : <span className="text-gray-400">{done}/{tasks.length}</span>}
                        </span>
                      )}
                    </p>
                    {tasks.length > 0 && (
                      <div className="space-y-1.5 mb-3">
                        {tasks.map(task => (
                          <TaskToggle key={task.id} taskId={task.id} title={task.title}
                            isComplete={task.is_complete} dueDate={task.due_date} />
                        ))}
                      </div>
                    )}
                    <AddTaskForm phaseId={phase.id} nextOrder={tasks.length} />
                  </div>

                  {/* Deliverables */}
                  {deliverables.length > 0 && (
                    <div className="pt-4 border-t border-gray-50">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Deliverables</p>
                      <div className="space-y-2">
                        {deliverables.map(d => (
                          <div key={d.id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-4 py-3">
                            <div>
                              <p className="text-sm font-medium text-gray-900">{d.title}</p>
                              {d.description && <p className="text-xs text-gray-400 mt-0.5">{d.description}</p>}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {d.file_url && (
                                <a href={d.file_url} target="_blank" rel="noopener noreferrer"
                                  className="text-xs text-[#C9A96E] font-semibold hover:underline">Download</a>
                              )}
                              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(d.status)}`}>
                                {statusLabel(d.status)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-3">
          <AddPhaseForm projectId={id} nextOrder={phases.length} />
        </div>
      </div>

      {/* Comments */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
        <h2 className="font-bold text-gray-900 mb-5">
          Comments {comments?.length ? <span className="text-gray-400 font-normal text-sm">({comments.length})</span> : ''}
        </h2>

        <div className="space-y-4 mb-6">
          {!comments?.length ? (
            <div className="text-center py-6">
              <Circle size={24} className="mx-auto text-gray-200 mb-2" />
              <p className="text-sm text-gray-400">No comments yet.</p>
            </div>
          ) : comments.map(comment => (
            <div key={comment.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#0D1F3C] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                {(comment.author_name ?? comment.author_email)?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mb-1">
                  <span className="text-sm font-semibold text-gray-900">{comment.author_name ?? comment.author_email}</span>
                  <span className="text-xs text-gray-400">{formatDate(comment.created_at)}</span>
                </div>
                <div className="bg-gray-50 rounded-xl px-4 py-3">
                  <p className="text-sm text-gray-700 leading-relaxed">{comment.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <AddCommentForm projectId={project.id} authorEmail={user?.email ?? ''}
          authorName={user?.user_metadata?.full_name ?? user?.email ?? ''} />
      </div>
    </div>
  )
}
