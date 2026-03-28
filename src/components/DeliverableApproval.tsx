'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, XCircle, RotateCcw } from 'lucide-react'
import { statusBadgeClass, statusLabel } from '@/lib/utils'

export default function DeliverableApproval({ id, status }: { id: string; status: string }) {
  const router = useRouter()
  const [current, setCurrent] = useState(status)
  const [loading, setLoading] = useState(false)

  async function update(newStatus: string) {
    setLoading(true)
    setCurrent(newStatus)
    const supabase = createClient()
    await supabase.from('deliverables').update({
      status: newStatus,
      reviewed_at: new Date().toISOString(),
    }).eq('id', id)
    setLoading(false)
    router.refresh()
  }

  if (current === 'pending') {
    return (
      <div className="flex items-center gap-1.5">
        <button onClick={() => update('approved')} disabled={loading}
          className="flex items-center gap-1 text-xs font-semibold bg-green-100 hover:bg-green-200 text-green-700 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50">
          <CheckCircle2 size={13} /> Approve
        </button>
        <button onClick={() => update('revision_requested')} disabled={loading}
          className="flex items-center gap-1 text-xs font-semibold bg-orange-100 hover:bg-orange-200 text-orange-700 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50">
          <RotateCcw size={13} /> Revise
        </button>
        <button onClick={() => update('rejected')} disabled={loading}
          className="flex items-center gap-1 text-xs font-semibold bg-red-100 hover:bg-red-200 text-red-700 px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50">
          <XCircle size={13} /> Reject
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusBadgeClass(current)}`}>
        {statusLabel(current)}
      </span>
      {current !== 'pending' && (
        <button onClick={() => update('pending')} disabled={loading}
          className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors">
          undo
        </button>
      )}
    </div>
  )
}
