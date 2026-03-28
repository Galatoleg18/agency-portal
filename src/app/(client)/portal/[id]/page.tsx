import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AddCommentForm from '@/components/AddCommentForm'

export default async function ClientProjectPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project } = await supabase
    .from('projects')
    .select(`*, clients(*), phases(*, tasks(*), deliverables(*))`)
    .eq('id', params.id)
    .single()

  if (!project) redirect('/portal')

  const { data: comments } = await supabase
    .from('comments')
    .select('*, profiles(full_name, email)')
    .eq('project_id', params.id)
    .order('created_at', { ascending: true })

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    on_hold: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700',
  }

  const phaseStatusColors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-600',
    in_progress: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-green-100 text-green-700',
  }

  const sortedPhases = (project.phases || []).sort(
    (a: any, b: any) => a.order_index - b.order_index
  )

  async function approveDeliverable(deliverableId: string, status: string) {
    'use server'
    const supabase = await createClient()
    await supabase.from('deliverables').update({ status }).eq('id', deliverableId)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <a href="/portal" className="text-sm text-gray-500 hover:text-gray-700 mb-4 inline-flex items-center gap-1">
            ← Back to My Projects
          </a>
          <div className="flex items-start justify-between mt-2">
            <div>
              <h1 className="text-2xl font-bold text-[#0D1F3C]">{project.name}</h1>
              {project.description && (
                <p className="text-gray-500 mt-1">{project.description}</p>
              )}
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColors[project.status] || 'bg-gray-100 text-gray-600'}`}>
              {project.status?.replace('_', ' ')}
            </span>
          </div>

          {(project.start_date || project.due_date) && (
            <div className="flex gap-6 mt-3 text-sm text-gray-500">
              {project.start_date && <span>Start: <strong className="text-gray-700">{new Date(project.start_date).toLocaleDateString()}</strong></span>}
              {project.due_date && <span>Due: <strong className="text-gray-700">{new Date(project.due_date).toLocaleDateString()}</strong></span>}
            </div>
          )}
        </div>

        {/* Phases */}
        <div className="space-y-6 mb-10">
          <h2 className="text-lg font-semibold text-[#0D1F3C]">Project Phases</h2>
          {sortedPhases.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400">
              No phases yet — your project manager will add them soon.
            </div>
          )}
          {sortedPhases.map((phase: any) => (
            <div key={phase.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-[#0D1F3C]">{phase.name}</h3>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${phaseStatusColors[phase.status] || 'bg-gray-100 text-gray-600'}`}>
                  {phase.status?.replace('_', ' ')}
                </span>
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{phase.completion_pct}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-[#C9A96E] h-2 rounded-full transition-all"
                    style={{ width: `${phase.completion_pct}%` }}
                  />
                </div>
              </div>

              {/* Tasks */}
              {phase.tasks && phase.tasks.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Tasks</p>
                  <ul className="space-y-1.5">
                    {phase.tasks.map((task: any) => (
                      <li key={task.id} className="flex items-center gap-2 text-sm text-gray-600">
                        <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${task.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                          {task.completed && <svg width="10" height="10" viewBox="0 0 12 12" fill="white"><path d="M1 6l4 4 6-7"/></svg>}
                        </span>
                        <span className={task.completed ? 'line-through text-gray-400' : ''}>{task.title}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Deliverables */}
              {phase.deliverables && phase.deliverables.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Deliverables</p>
                  <div className="space-y-2">
                    {phase.deliverables.map((d: any) => (
                      <div key={d.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-gray-700">{d.title}</p>
                          {d.description && <p className="text-xs text-gray-400">{d.description}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          {d.file_url && (
                            <a href={d.file_url} target="_blank" rel="noopener noreferrer"
                              className="text-xs text-[#C9A96E] font-medium hover:underline">
                              Download
                            </a>
                          )}
                          {d.status === 'pending' && (
                            <form>
                              <input type="hidden" name="id" value={d.id} />
                              <div className="flex gap-1">
                                <button formAction={approveDeliverable.bind(null, d.id, 'approved')}
                                  className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium hover:bg-green-200">
                                  Approve
                                </button>
                                <button formAction={approveDeliverable.bind(null, d.id, 'changes_requested')}
                                  className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-medium hover:bg-red-200">
                                  Changes
                                </button>
                              </div>
                            </form>
                          )}
                          {d.status !== 'pending' && (
                            <span className={`text-xs rounded-full px-2 py-0.5 font-semibold ${d.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {d.status === 'approved' ? 'Approved' : 'Changes Requested'}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Comments */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-semibold text-[#0D1F3C] mb-4">Messages</h2>
          <div className="space-y-4 mb-6">
            {!comments || comments.length === 0 ? (
              <p className="text-gray-400 text-sm">No messages yet. Start the conversation below.</p>
            ) : (
              comments.map((c: any) => (
                <div key={c.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#0D1F3C] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {(c.profiles?.full_name || c.profiles?.email || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">
                      {c.profiles?.full_name || c.profiles?.email} · {new Date(c.created_at).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-700">{c.body}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <AddCommentForm projectId={params.id} authorEmail={user.email ?? ''} authorName={user.email ?? ''} />
        </div>

      </div>
    </div>
  )
}
