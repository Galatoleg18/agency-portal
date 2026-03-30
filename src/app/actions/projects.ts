'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function archiveProject(id: string) {
  const supabase = await createClient()
  await supabase
    .from('projects')
    .update({ status: 'archived', archived_at: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/projects')
  revalidatePath(`/projects/${id}`)
}

export async function deleteProject(id: string) {
  const supabase = await createClient()
  await supabase.from('projects').delete().eq('id', id)
  revalidatePath('/projects')
  redirect('/projects')
}
