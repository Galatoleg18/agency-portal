'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function archiveInvoice(id: string) {
  const supabase = await createClient()
  await supabase.from('invoices').update({ status: 'archived' }).eq('id', id)
  revalidatePath('/invoices')
}

export async function unarchiveInvoice(id: string) {
  const supabase = await createClient()
  await supabase.from('invoices').update({ status: 'unpaid' }).eq('id', id)
  revalidatePath('/invoices')
}

export async function deleteInvoice(id: string) {
  const supabase = await createClient()
  await supabase.from('invoice_items').delete().eq('invoice_id', id)
  await supabase.from('invoices').delete().eq('id', id)
  revalidatePath('/invoices')
}
