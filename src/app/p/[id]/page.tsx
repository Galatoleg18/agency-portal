import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { CheckCircle2, Circle, Clock, Calendar, TrendingUp } from 'lucide-react'

interface PageProps { params: Promise<{ id: string }> }

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  active:      { label: 'In Progress', color: '#6366F1', bg: '#EEF2FF' },
  completed:   { label: 'Completed',   color: '#059669', bg: '#D1FAE5' },
  on_hold:     { label: 'On Hold',     color: '#D97706', bg: '#FEF3C7' },
  cancelled:   { label: 'Cancelled',   color: '#DC2626', bg: '#FEE2E2' },
  in_progress: { label: 'In Progress', color: '#6366F1', bg: '#EEF2FF' },
}

const phaseStatus: Record<string, { label: string; icon: string }> = {
  completed:   { label: 'Done',        icon: '✓' },
  in_progress: { label: 'In Progress', icon: '●' },
  pending:     { label: 'Upcoming',    icon: '○' },
}

export default async function PublicProjectPage({ params }: PageProps) {
  const { id } = await params
  const cookieStore = await cookies()

  // Use anon client — RLS must allow public SELECT on projects
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: project } = await supabase
    .from('projects')
    .select(`id, name, description, status, start_date, due_date,
      clients(name, company),
      phases(id, name, status, completion_pct, sort_order, description,
        tasks(id, title, is_complete, sort_order))`)
    .eq('id', id).single()

  if (!project) notFound()

  const phases = ((project.phases as any[]) ?? []).sort((a, b) => a.sort_order - b.sort_order)
  const overallProgress = phases.length
    ? Math.round(phases.reduce((s: number, p: any) => s + p.completion_pct, 0) / phases.length) : 0
  const totalTasks = phases.reduce((s: number, p: any) => s + (p.tasks?.length ?? 0), 0)
  const doneTasks = phases.reduce((s: number, p: any) => s + (p.tasks?.filter((t: any) => t.is_complete).length ?? 0), 0)

  const now = new Date()
  const dueDate = project.due_date ? new Date(project.due_date) : null
  const daysLeft = dueDate ? Math.round((dueDate.getTime() - now.getTime()) / 86400000) : null
  const isOverdue = daysLeft !== null && daysLeft < 0

  const st = statusConfig[project.status] ?? { label: project.status, color: '#6366F1', bg: '#EEF2FF' }
  const client = (project.clients as any) ?? null

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{project.name} — Project Update</title>
        <style>{`
          *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
          html { background:#F5F6FA; }
          body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; color:#1e293b; -webkit-font-smoothing:antialiased; min-height:100vh; }

          .wrap { max-width:560px; margin:0 auto; padding:0 0 48px; }

          /* Header strip */
          .top-bar { background:#0F172A; padding:16px 20px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:10; }
          .top-brand { font-size:14px; font-weight:900; letter-spacing:2px; color:#fff; text-transform:uppercase; }
          .top-brand span { color:#6366F1; }
          .top-label { font-size:10px; color:rgba(255,255,255,.45); letter-spacing:1px; text-transform:uppercase; }

          /* Hero card */
          .hero { background:#fff; border-bottom:1px solid #f1f5f9; padding:24px 20px 20px; }
          .hero-title { font-size:20px; font-weight:800; color:#0F172A; line-height:1.25; margin-bottom:6px; }
          .hero-client { font-size:12px; color:#94a3b8; margin-bottom:16px; }
          .status-pill { display:inline-flex; align-items:center; gap:6px; padding:5px 12px; border-radius:20px; font-size:11px; font-weight:700; letter-spacing:.5px; margin-bottom:20px; }
          .status-dot { width:6px; height:6px; border-radius:50%; }

          /* Progress */
          .prog-bar-wrap { background:#f1f5f9; border-radius:99px; height:10px; margin-bottom:8px; overflow:hidden; }
          .prog-bar { height:10px; border-radius:99px; background:linear-gradient(90deg,#6366F1,#8b5cf6); transition:width .5s; }
          .prog-meta { display:flex; justify-content:space-between; align-items:center; }
          .prog-pct { font-size:22px; font-weight:900; color:#6366F1; }
          .prog-tasks { font-size:12px; color:#94a3b8; }

          /* Stats row */
          .stats { display:grid; grid-template-columns:1fr 1fr; gap:1px; background:#f1f5f9; border-top:1px solid #f1f5f9; border-bottom:1px solid #f1f5f9; }
          .stat { background:#fff; padding:14px 20px; }
          .stat-label { font-size:10px; font-weight:600; letter-spacing:1px; color:#94a3b8; text-transform:uppercase; margin-bottom:4px; }
          .stat-val { font-size:14px; font-weight:700; color:#0F172A; }
          .stat-val.warn { color:#D97706; }
          .stat-val.ok { color:#059669; }
          .stat-val.bad { color:#DC2626; }

          /* Phases */
          .section-title { font-size:11px; font-weight:700; letter-spacing:1.5px; color:#94a3b8; text-transform:uppercase; padding:20px 20px 12px; }
          .phase { background:#fff; border-top:1px solid #f1f5f9; border-bottom:1px solid #f1f5f9; margin-bottom:8px; }
          .phase-head { padding:16px 20px; }
          .phase-top { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:12px; }
          .phase-num { width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:800; flex-shrink:0; }
          .phase-num.done { background:#D1FAE5; color:#059669; }
          .phase-num.active { background:#EEF2FF; color:#6366F1; }
          .phase-num.pending { background:#F8FAFC; color:#94a3b8; }
          .phase-name { font-size:15px; font-weight:700; color:#0F172A; flex:1; line-height:1.3; }
          .phase-desc { font-size:12px; color:#64748b; margin-top:3px; line-height:1.5; }
          .phase-badge { font-size:10px; font-weight:700; padding:3px 8px; border-radius:12px; flex-shrink:0; }
          .phase-badge.done { background:#D1FAE5; color:#059669; }
          .phase-badge.active { background:#EEF2FF; color:#6366F1; }
          .phase-badge.pending { background:#F8FAFC; color:#94a3b8; }
          .phase-prog { display:flex; align-items:center; gap:10px; }
          .phase-prog-bar { flex:1; background:#f1f5f9; border-radius:99px; height:6px; overflow:hidden; }
          .phase-prog-fill { height:6px; border-radius:99px; }
          .phase-prog-fill.done { background:#10b981; }
          .phase-prog-fill.active { background:#6366F1; }
          .phase-prog-fill.pending { background:#cbd5e1; }
          .phase-pct { font-size:12px; font-weight:800; color:#0F172A; width:32px; text-align:right; }

          /* Tasks */
          .tasks { border-top:1px solid #f8fafc; }
          .task { display:flex; align-items:flex-start; gap:10px; padding:10px 20px; border-bottom:1px solid #f8fafc; }
          .task:last-child { border-bottom:none; }
          .task-icon { flex-shrink:0; margin-top:1px; }
          .task-title { font-size:13px; color:#334155; line-height:1.4; flex:1; }
          .task-title.done { color:#94a3b8; text-decoration:line-through; }

          /* Footer */
          .foot { padding:32px 20px 0; text-align:center; }
          .foot-brand { font-size:11px; color:#94a3b8; }
          .foot-brand strong { color:#6366F1; }
        `}</style>
      </head>
      <body>
        <div className="wrap">
          {/* Top bar */}
          <div className="top-bar">
            <div className="top-brand">DOT <span>IT</span></div>
            <div className="top-label">Project Update</div>
          </div>

          {/* Hero */}
          <div className="hero">
            <div className="hero-title">{project.name}</div>
            {client && <div className="hero-client">{client.company ?? client.name}</div>}

            <div className="status-pill" style={{ background: st.bg, color: st.color }}>
              <div className="status-dot" style={{ background: st.color }} />
              {st.label}
            </div>

            <div className="prog-bar-wrap">
              <div className="prog-bar" style={{ width: `${overallProgress}%` }} />
            </div>
            <div className="prog-meta">
              <div className="prog-tasks">{doneTasks} of {totalTasks} tasks complete</div>
              <div className="prog-pct">{overallProgress}%</div>
            </div>
          </div>

          {/* Stats */}
          <div className="stats">
            <div className="stat">
              <div className="stat-label">Start Date</div>
              <div className="stat-val">{project.start_date ? formatDate(project.start_date) : '—'}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Due Date</div>
              <div className={`stat-val ${isOverdue ? 'bad' : daysLeft !== null && daysLeft <= 7 ? 'warn' : ''}`}>
                {dueDate ? formatDate(project.due_date) : '—'}
                {daysLeft !== null && (
                  <span style={{ fontSize:11, fontWeight:500, marginLeft:6 }}>
                    {isOverdue ? `(${Math.abs(daysLeft)}d late)` : `(${daysLeft}d left)`}
                  </span>
                )}
              </div>
            </div>
            <div className="stat">
              <div className="stat-label">Phases</div>
              <div className="stat-val">{phases.filter((p: any) => p.status === 'completed').length} / {phases.length} done</div>
            </div>
            <div className="stat">
              <div className="stat-label">Tasks</div>
              <div className={`stat-val ${doneTasks === totalTasks && totalTasks > 0 ? 'ok' : ''}`}>{doneTasks} / {totalTasks}</div>
            </div>
          </div>

          {/* Phases */}
          {phases.length > 0 && (
            <>
              <div className="section-title">Project Phases</div>
              {phases.map((phase: any, idx: number) => {
                const tasks = [...(phase.tasks ?? [])].sort((a: any, b: any) => a.sort_order - b.sort_order)
                const isCompleted = phase.status === 'completed'
                const isActive = phase.status === 'in_progress'
                const cls = isCompleted ? 'done' : isActive ? 'active' : 'pending'
                const ph = phaseStatus[phase.status] ?? { label: phase.status, icon: String(idx + 1) }

                return (
                  <div key={phase.id} className="phase">
                    <div className="phase-head">
                      <div className="phase-top">
                        <div className={`phase-num ${cls}`}>{isCompleted ? '✓' : idx + 1}</div>
                        <div style={{ flex: 1 }}>
                          <div className="phase-name">{phase.name}</div>
                          {phase.description && <div className="phase-desc">{phase.description}</div>}
                        </div>
                        <div className={`phase-badge ${cls}`}>{ph.label}</div>
                      </div>
                      <div className="phase-prog">
                        <div className="phase-prog-bar">
                          <div className={`phase-prog-fill ${cls}`} style={{ width: `${phase.completion_pct}%` }} />
                        </div>
                        <div className="phase-pct">{phase.completion_pct}%</div>
                      </div>
                    </div>
                    {tasks.length > 0 && (
                      <div className="tasks">
                        {tasks.map((task: any) => (
                          <div key={task.id} className="task">
                            <div className="task-icon">
                              {task.is_complete
                                ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="8" fill="#D1FAE5"/><path d="M5 8l2 2 4-4" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                : <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7.5" stroke="#CBD5E1"/></svg>}
                            </div>
                            <div className={`task-title ${task.is_complete ? 'done' : ''}`}>{task.title}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </>
          )}

          {/* Footer */}
          <div className="foot">
            <div className="foot-brand">Powered by <strong>DOT IT</strong> Agency</div>
          </div>
        </div>
      </body>
    </html>
  )
}
