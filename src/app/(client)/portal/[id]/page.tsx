import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDate, statusBadgeClass, statusLabel } from '@/lib/utils'
import AddCommentForm from '@/components/AddCommentForm'
import DeliverableApproval from '@/components/DeliverableApproval'
import { ArrowLeft, Calendar, CheckCircle2, Circle, Clock, Download, TrendingUp } from 'lucide-react'
import Link from 'next/link'

interface PageProps { params: Promise<{ id: string }> }

export default async function ClientProjectPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project } = await supabase
    .from('projects')
    .select(`id, name, description, status, start_date, due_date,
      phases(id, name, status, completion_pct, sort_order, description,
        tasks(id, title, is_complete, sort_order, due_date),
        deliverables(id, title, status, description, file_url))`)
    .eq('id', id).single()

  if (!project) redirect('/portal')

  const { data: comments } = await supabase
    .from('comments').select('id, body, author_name, author_email, created_at')
    .eq('project_id', id).order('created_at', { ascending: true })

  const phases = ((project.phases as Array<{
    id: string; name: string; status: string; completion_pct: number; sort_order: number; description: string | null;
    tasks: Array<{ id: string; title: string; is_complete: boolean; sort_order: number; due_date: string | null }>;
    deliverables: Array<{ id: string; title: string; status: string; description: string | null; file_url: string | null }>;
  }>) ?? []).sort((a, b) => a.sort_order - b.sort_order)

  const overallProgress = phases.length
    ? Math.round(phases.reduce((s, p) => s + p.completion_pct, 0) / phases.length) : 0
  const totalTasks = phases.reduce((s, p) => s + (p.tasks?.length ?? 0), 0)
  const doneTasks = phases.reduce((s, p) => s + (p.tasks?.filter(t => t.is_complete).length ?? 0), 0)
  const pendingApprovals = phases.reduce((s, p) => s + (p.deliverables?.filter(d => d.status === 'pending').length ?? 0), 0)

  const now = new Date()
  const dueDate = project.due_date ? new Date(project.due_date) : null
  const daysLeft = dueDate ? Math.round((dueDate.getTime() - now.getTime()) / 86400000) : null
  const isOverdue = daysLeft !== null && daysLeft < 0

  return (
    <div>
      <Link href="/portal" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 transition-colors mb-5">
        <ArrowLeft size={15} /> All Projects
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 mb-5">
        <div className="flex flex-wrap items-start gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-0.5">{project.name}</h1>
            {project.description && <p className="text-gray-500 text-sm leading-relaxed">{project.description}</p>}
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold flex-shrink-0 ${statusBadgeClass(project.status)}`}>
            {statusLabel(project.status)}
          </span>
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-gray-400 mb-4">
          {project.start_date && <span className="flex items-center gap-1"><Calendar size={11} />Start: {formatDate(project.start_date)}</span>}
          {dueDate && (
            <span className={`flex items-center gap-1.5 ${isOverdue ? 'text-red-500 font-semibold' : ''}`}>
              <Clock size={11} />Due: {formatDate(project.due_date)}
              {daysLeft !== null && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${isOverdue ? 'bg-red-100 text-red-600' : daysLeft <= 7 ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'}`}>
                  {isOverdue ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                </span>
              )}
            </span>
          )}
        </div>

        {/* Overall progress */}
        <div className="flex items-center gap-3 mb-1.5">
          <div className="flex-1 bg-gray-100 rounded-full h-3">
            <div className="bg-[#C9A96E] h-3 rounded-full transition-all" style={{ width: `${overallProgress}%` }} />
          </div>
          <span className="text-sm font-bold text-gray-700 tabular-nums w-10 text-right">{overallProgress}%</span>
        </div>
        {totalTasks > 0 && (
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <CheckCircle2 size={12} className="text-green-400" />
            {doneTasks} of {totalTasks} tasks complete
          </p>
        )}

        {/* Approval alert */}
        {pendingApprovals > 0 && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between">
            <p className="text-sm text-amber-700 font-medium">
              🔔 {pendingApprovals} deliverable{pendingApprovals > 1 ? 's' : ''} waiting for your approval
            </p>
          </div>
        )}
      </div>

      {/* Phases */}
      <div className="mb-6">
        <h2 className="font-bold text-gray-900 mb-4">Project Phases</h2>
        {!phases.length ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center text-gray-400 text-sm">
            Your project manager will add phases soon.
          </div>
        ) : (
          <div className="space-y-4">
            {phases.map((phase, idx) => {
              const tasks = [...(phase.tasks ?? [])].sort((a, b) => a.sort_order - b.sort_order)
              const deliverables = phase.deliverables ?? []
              const phaseDone = tasks.filter(t => t.is_complete).length
              const hasPendingDeliverables = deliverables.some(d => d.status === 'pending')

              return (
                <div key={phase.id} className={`bg-white rounded-2xl border overflow-hidden transition-all ${hasPendingDeliverables ? 'border-amber-200 shadow-amber-100 shadow-sm' : 'border-gray-100'}`}>
                  <div className="px-5 py-4 border-b border-gray-50">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold
                          ${phase.status === 'completed' ? 'bg-green-100 text-green-600' : phase.status === 'in_progress' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                          {phase.status === 'completed' ? '✓' : idx + 1}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm">{phase.name}</h3>
                          {phase.description && <p className="text-xs text-gray-400 mt-0.5">{phase.description}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {hasPendingDeliverables && <span className="text-xs bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-semibold">Action needed</span>}
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(phase.status)}`}>
                          {statusLabel(phase.status)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div className="bg-[#C9A96E] h-1.5 rounded-full" style={{ width: `${phase.completion_pct}%` }} />
                      </div>
                      <span className="text-xs font-bold text-[#C9A96E] tabular-nums w-9 text-right">{phase.completion_pct}%</span>
                    </div>
                  </div>

                  <div className="px-5 py-4 space-y-4">
                    {/* Tasks — read only */}
                    {tasks.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                          Tasks · {phaseDone}/{tasks.length}
                        </p>
                        <div className="space-y-1.5">
                          {tasks.map(task => (
                            <div key={task.id} className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 border text-sm
                              ${task.is_complete ? 'border-green-100 bg-green-50' : 'border-gray-100'}`}>
                              {task.is_complete
                                ? <CheckCircle2 size={15} className="text-green-500 flex-shrink-0" />
                                : <Circle size={15} className="text-gray-300 flex-shrink-0" />}
                              <span className={task.is_complete ? 'line-through text-gray-400 flex-1' : 'text-gray-700 flex-1'}>{task.title}</span>
                              {task.due_date && (
                                <span className="text-xs text-gray-400 flex-shrink-0">
                                  {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Deliverables with approval */}
                    {deliverables.length > 0 && (
                      <div className={tasks.length > 0 ? 'pt-4 border-t border-gray-50' : ''}>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">Deliverables</p>
                        <div className="space-y-2">
                          {deliverables.map(d => (
                            <div key={d.id} className={`rounded-xl border p-4 ${d.status === 'pending' ? 'border-amber-200 bg-amber-50/50' : 'border-gray-100'}`}>
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-semibold text-gray-900">{d.title}</p>
                                  {d.description && <p className="text-xs text-gray-500 mt-0.5">{d.description}</p>}
                                </div>
                                {d.file_url && (
                                  <a href={d.file_url} target="_blank" rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-xs text-[#C9A96E] font-semibold hover:underline flex-shrink-0">
                                    <Download size={12} /> File
                                  </a>
                                )}
                              </div>
                              <DeliverableApproval id={d.id} status={d.status} />
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
        )}
      </div>

      {/* Messages */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
        <h2 className="font-bold text-gray-900 mb-5">
          Messages {comments?.length ? <span className="text-gray-400 font-normal text-sm">({comments.length})</span> : ''}
        </h2>
        <div className="space-y-4 mb-6">
          {!comments?.length ? (
            <div className="text-center py-6 text-sm text-gray-400">No messages yet — start the conversation below.</div>
          ) : comments.map(c => (
            <div key={c.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#0D1F3C] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5">
                {(c.author_name ?? c.author_email)?.[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 mb-1">
                  <span className="text-sm font-semibold text-gray-900">{c.author_name ?? c.author_email}</span>
                  <span className="text-xs text-gray-400">{formatDate(c.created_at)}</span>
                </div>
                <div className="bg-gray-50 rounded-xl px-4 py-3">
                  <p className="text-sm text-gray-700 leading-relaxed">{c.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <AddCommentForm projectId={id} authorEmail={user.email ?? ''} authorName={user.email ?? ''} />
      </div>
    </div>
  )
}
