import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { formatDate, statusBadgeClass, statusLabel } from '@/lib/utils'
import { CheckCircle2, Circle, Clock, Calendar } from 'lucide-react'

interface PageProps { params: Promise<{ id: string }> }

// Public page — no auth required
export default async function PublicStatusPage({ params }: PageProps) {
  const { id } = await params

  // Use anon client — RLS must allow public read or we use service role
  const supabase = await createClient()

  const { data: project } = await supabase
    .from('projects')
    .select(`id, name, description, status, start_date, due_date,
      phases(id, name, status, completion_pct, sort_order, description,
        tasks(id, title, is_complete, sort_order))`)
    .eq('id', id).single()

  if (!project) notFound()

  const phases = ((project.phases as Array<{
    id: string; name: string; status: string; completion_pct: number;
    sort_order: number; description: string | null;
    tasks: Array<{ id: string; title: string; is_complete: boolean; sort_order: number }>
  }>) ?? []).sort((a, b) => a.sort_order - b.sort_order)

  const overallProgress = phases.length
    ? Math.round(phases.reduce((s, p) => s + p.completion_pct, 0) / phases.length) : 0

  const now = new Date()
  const dueDate = project.due_date ? new Date(project.due_date) : null
  const daysLeft = dueDate ? Math.round((dueDate.getTime() - now.getTime()) / 86400000) : null
  const isOverdue = daysLeft !== null && daysLeft < 0

  return (
    <html>
      <head>
        <title>{project.name} — Project Status</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex" />
      </head>
      <body style={{margin:0,fontFamily:'-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',background:'#F5F6FA',color:'#0f172a'}}>
        <div style={{maxWidth:'680px',margin:'0 auto',padding:'40px 20px'}}>

          {/* Header */}
          <div style={{background:'white',borderRadius:'16px',border:'1px solid #e2e8f0',padding:'28px',marginBottom:'20px'}}>
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:'16px',marginBottom:'20px'}}>
              <div>
                <div style={{fontSize:'11px',fontWeight:700,color:'#94a3b8',letterSpacing:'1px',textTransform:'uppercase',marginBottom:'6px'}}>
                  DOT IT Agency
                </div>
                <h1 style={{fontSize:'22px',fontWeight:800,margin:'0 0 6px',color:'#0f172a'}}>{project.name}</h1>
                {project.description && <p style={{fontSize:'14px',color:'#64748b',margin:0,lineHeight:'1.5'}}>{project.description}</p>}
              </div>
              <span style={{
                background: project.status === 'active' ? '#d1fae5' : project.status === 'completed' ? '#dbeafe' : '#f1f5f9',
                color: project.status === 'active' ? '#065f46' : project.status === 'completed' ? '#1e40af' : '#475569',
                padding:'4px 12px',borderRadius:'20px',fontSize:'12px',fontWeight:700,whiteSpace:'nowrap',flexShrink:0
              }}>
                {statusLabel(project.status)}
              </span>
            </div>

            {/* Progress */}
            <div style={{marginBottom:'16px'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'8px'}}>
                <span style={{fontSize:'13px',fontWeight:600,color:'#475569'}}>Overall Progress</span>
                <span style={{fontSize:'20px',fontWeight:800,color:'#6366F1'}}>{overallProgress}%</span>
              </div>
              <div style={{background:'#e2e8f0',borderRadius:'999px',height:'10px',overflow:'hidden'}}>
                <div style={{background:'#6366F1',height:'10px',borderRadius:'999px',width:`${overallProgress}%`,transition:'width 0.5s ease'}} />
              </div>
            </div>

            {/* Dates */}
            <div style={{display:'flex',flexWrap:'wrap',gap:'16px'}}>
              {project.start_date && (
                <div style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'13px',color:'#64748b'}}>
                  <span>📅</span> Start: <strong style={{color:'#0f172a'}}>{formatDate(project.start_date)}</strong>
                </div>
              )}
              {dueDate && (
                <div style={{display:'flex',alignItems:'center',gap:'6px',fontSize:'13px',color: isOverdue ? '#dc2626' : '#64748b'}}>
                  <span>{isOverdue ? '⚠️' : '🎯'}</span> Due: <strong>{formatDate(project.due_date)}</strong>
                  {daysLeft !== null && (
                    <span style={{
                      background: isOverdue ? '#fee2e2' : daysLeft <= 7 ? '#fef3c7' : '#f0fdf4',
                      color: isOverdue ? '#dc2626' : daysLeft <= 7 ? '#92400e' : '#166534',
                      padding:'2px 8px',borderRadius:'20px',fontSize:'11px',fontWeight:700
                    }}>
                      {isOverdue ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Phases */}
          <div style={{marginBottom:'20px'}}>
            <h2 style={{fontSize:'15px',fontWeight:700,color:'#0f172a',marginBottom:'12px'}}>Phases</h2>
            <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
              {phases.map((phase, idx) => {
                const tasks = [...(phase.tasks ?? [])].sort((a, b) => a.sort_order - b.sort_order)
                const done = tasks.filter(t => t.is_complete).length
                return (
                  <div key={phase.id} style={{background:'white',borderRadius:'16px',border:'1px solid #e2e8f0',overflow:'hidden'}}>
                    <div style={{padding:'20px',borderBottom: tasks.length ? '1px solid #f1f5f9' : 'none'}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'12px',marginBottom:'12px'}}>
                        <div style={{display:'flex',alignItems:'center',gap:'10px'}}>
                          <div style={{
                            width:'26px',height:'26px',borderRadius:'50%',display:'flex',alignItems:'center',justifyContent:'center',
                            flexShrink:0,fontSize:'11px',fontWeight:800,
                            background: phase.status === 'completed' ? '#d1fae5' : phase.status === 'in_progress' ? '#dbeafe' : '#f1f5f9',
                            color: phase.status === 'completed' ? '#065f46' : phase.status === 'in_progress' ? '#1e40af' : '#94a3b8',
                          }}>
                            {phase.status === 'completed' ? '✓' : idx + 1}
                          </div>
                          <div>
                            <div style={{fontWeight:700,fontSize:'14px',color:'#0f172a'}}>{phase.name}</div>
                            {phase.description && <div style={{fontSize:'12px',color:'#94a3b8',marginTop:'2px'}}>{phase.description}</div>}
                          </div>
                        </div>
                        <div style={{display:'flex',alignItems:'center',gap:'8px',flexShrink:0}}>
                          <span style={{fontSize:'14px',fontWeight:800,color:'#6366F1'}}>{phase.completion_pct}%</span>
                          <span style={{
                            background: phase.status === 'completed' ? '#d1fae5' : phase.status === 'in_progress' ? '#dbeafe' : '#f1f5f9',
                            color: phase.status === 'completed' ? '#065f46' : phase.status === 'in_progress' ? '#1e40af' : '#94a3b8',
                            padding:'2px 8px',borderRadius:'20px',fontSize:'11px',fontWeight:700
                          }}>
                            {statusLabel(phase.status)}
                          </span>
                        </div>
                      </div>
                      <div style={{background:'#e2e8f0',borderRadius:'999px',height:'6px',overflow:'hidden'}}>
                        <div style={{background: phase.status === 'completed' ? '#22c55e' : '#6366F1',height:'6px',borderRadius:'999px',width:`${phase.completion_pct}%`}} />
                      </div>
                    </div>

                    {tasks.length > 0 && (
                      <div style={{padding:'12px 20px',display:'flex',flexDirection:'column',gap:'8px'}}>
                        {tasks.map(task => (
                          <div key={task.id} style={{display:'flex',alignItems:'center',gap:'10px'}}>
                            <div style={{
                              width:'16px',height:'16px',borderRadius:'4px',flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',
                              background: task.is_complete ? '#22c55e' : 'transparent',
                              border: task.is_complete ? 'none' : '2px solid #cbd5e1',
                            }}>
                              {task.is_complete && <span style={{color:'white',fontSize:'10px',fontWeight:900}}>✓</span>}
                            </div>
                            <span style={{fontSize:'13px',color: task.is_complete ? '#94a3b8' : '#334155',textDecoration: task.is_complete ? 'line-through' : 'none'}}>
                              {task.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Footer */}
          <div style={{textAlign:'center',fontSize:'12px',color:'#94a3b8',padding:'20px 0'}}>
            Last updated: {new Date().toLocaleDateString('en-US', {month:'long',day:'numeric',year:'numeric'})} ·
            Powered by <strong style={{color:'#6366F1'}}>DOT IT</strong>
          </div>
        </div>
      </body>
    </html>
  )
}
