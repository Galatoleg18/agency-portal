'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Clock, Plus, X } from 'lucide-react'

export default function TimeLogger({ projectId, phaseId, taskId, userEmail }: {
  projectId: string; phaseId?: string; taskId?: string; userEmail: string
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [hours, setHours] = useState('')
  const [minutes, setMinutes] = useState('')
  const [desc, setDesc] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLog() {
    const total = (parseFloat(hours || '0') * 60) + parseFloat(minutes || '0')
    if (!total) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from('time_entries').insert({
      project_id: projectId,
      phase_id: phaseId ?? null,
      task_id: taskId ?? null,
      logged_by_email: userEmail,
      minutes: Math.round(total),
      description: desc || null,
      logged_date: new Date().toISOString().split('T')[0],
    })
    setHours(''); setMinutes(''); setDesc('')
    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  if (!open) return (
    <button onClick={() => setOpen(true)}
      className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-[#C9A96E] font-medium transition-colors py-1">
      <Clock size={12} /> Log time
    </button>
  )

  return (
    <div className="mt-2 bg-gray-50 rounded-xl border border-gray-200 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 flex-1">
          <input type="number" min="0" max="99" value={hours} onChange={e => setHours(e.target.value)}
            placeholder="0" className="w-14 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#C9A96E]" />
          <span className="text-xs text-gray-400">h</span>
          <input type="number" min="0" max="59" value={minutes} onChange={e => setMinutes(e.target.value)}
            placeholder="0" className="w-14 px-2 py-1.5 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#C9A96E]" />
          <span className="text-xs text-gray-400">m</span>
        </div>
        <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
      </div>
      <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="What did you work on?"
        className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A96E]" />
      <button onClick={handleLog} disabled={loading || (!hours && !minutes)}
        className="w-full bg-[#C9A96E] hover:bg-[#b8924d] text-white text-xs font-bold py-2 rounded-lg disabled:opacity-50 transition-colors">
        {loading ? 'Logging…' : 'Log Time'}
      </button>
    </div>
  )
}
