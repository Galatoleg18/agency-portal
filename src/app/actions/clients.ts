'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function archiveClient(id: string) {
  const supabase = await createClient()
  await supabase
    .from('clients')
    .update({ archived_at: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/clients')
}

export async function unarchiveClient(id: string) {
  const supabase = await createClient()
  await supabase
    .from('clients')
    .update({ archived_at: null })
    .eq('id', id)
  revalidatePath('/clients')
}

export async function deleteClient(id: string) {
  const supabase = await createClient()
  await supabase.from('clients').delete().eq('id', id)
  revalidatePath('/clients')
}
