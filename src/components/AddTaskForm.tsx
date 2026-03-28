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
      className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-[#C9A96E] font-medium mt-1">
      <Plus size={13} /> Add task
    </button>
  )

  return (
    <div className="mt-2 flex gap-2 items-center">
      <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setOpen(false) }}
        className="flex-1 px-2.5 py-1.5 border border-[#C9A96E] rounded-lg text-xs focus:outline-none"
        placeholder="Task title..." />
      <button onClick={handleAdd} disabled={loading || !title.trim()}
        className="bg-[#C9A96E] text-white px-2.5 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50">
        Add
      </button>
      <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
        <X size={15} />
      </button>
    </div>
  )
}
