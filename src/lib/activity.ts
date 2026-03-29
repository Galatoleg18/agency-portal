import { createClient } from '@/lib/supabase/server'

export async function logActivity({
  projectId,
  actorEmail,
  actorName,
  action,
  subject,
  metadata,
}: {
  projectId: string
  actorEmail: string
  actorName?: string
  action: string
  subject: string
  metadata?: Record<string, unknown>
}) {
  try {
    const supabase = await createClient()
    await supabase.from('activity_log').insert({
      project_id: projectId,
      actor_email: actorEmail,
      actor_name: actorName ?? actorEmail,
      action,
      subject,
      metadata,
    })
  } catch {
    // Non-critical — don't break the main flow
  }
}

export function actionIcon(action: string): string {
  const map: Record<string, string> = {
    comment_added: '💬',
    deliverable_approved: '✅',
    deliverable_rejected: '❌',
    deliverable_revision: '🔄',
    invoice_paid: '💰',
    phase_completed: '🎉',
    task_completed: '☑️',
    project_status_changed: '📋',
    phase_added: '➕',
    task_added: '➕',
    time_logged: '⏱️',
  }
  return map[action] ?? '📌'
}
