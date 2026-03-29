'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { statusBadgeClass, statusLabel } from '@/lib/utils'

type Table = 'projects' | 'phases' | 'invoices'

const optionsByTable: Record<Table, string[]> = {
  projects: ['active', 'on_hold', 'completed', 'cancelled'],
  phases: ['pending', 'in_progress', 'completed'],
  invoices: ['unpaid', 'paid', 'overdue', 'cancelled'],
}

export default function StatusSelect({ table, id, currentStatus }: { table: Table; id: string; currentStatus: string }) {
  const router = useRouter()
  const [status, setStatus] = useState(currentStatus)
  const [loading, setLoading] = useState(false)

  async function handleChange(val: string) {
    setLoading(true)
    setStatus(val)
    const supabase = createClient()
    const update: Record<string, string> = { status: val }
    if (table === 'invoices' && val === 'paid') {
      update.paid_date = new Date().toISOString().split('T')[0]
    }
    await supabase.from(table).update(update).eq('id', id)
    setLoading(false)
    router.refresh()
  }

  return (
    <select
      value={status}
      onChange={e => handleChange(e.target.value)}
      disabled={loading}
      className={`rounded-full px-3 py-1 text-xs font-semibold border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#6366F1] transition-opacity ${statusBadgeClass(status)} ${loading ? 'opacity-50' : ''}`}
    >
      {optionsByTable[table].map(s => (
        <option key={s} value={s}>{statusLabel(s)}</option>
      ))}
    </select>
  )
}
