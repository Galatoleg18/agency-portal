'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, X } from 'lucide-react'

export default function AddTaskForm({ phaseId, nextOrder }: { phaseId: string; nextOrder: number }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleAdd() {
    if (!title.trim()) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from('tasks').insert({ phase_id: phaseId, title: title.trim(), sort_order: nextOrder })
    setTitle('')
    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  if (!open) return (
    <button onClick={() => setOpen(true)}
      className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-[#6366F1] font-medium transition-colors mt-1.5 py-1">
      <Plus size={13} /> Add task
    </button>
  )

  return (
    <div className="flex gap-2 items-center mt-2 bg-gray-50 rounded-xl border border-gray-200 px-3 py-2">
      <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setOpen(false) }}
        className="flex-1 text-sm focus:outline-none bg-transparent placeholder-gray-400"
        placeholder="Task name…" />
      <button onClick={handleAdd} disabled={loading || !title.trim()}
        className="bg-[#6366F1] text-white px-2.5 py-1 rounded-lg text-xs font-bold disabled:opacity-50 transition-colors hover:bg-[#4f46e5]">
        Add
      </button>
      <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
        <X size={14} />
      </button>
    </div>
  )
}
