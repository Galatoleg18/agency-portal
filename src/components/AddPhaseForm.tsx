'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, X } from 'lucide-react'

export default function AddPhaseForm({ projectId, nextOrder }: { projectId: string; nextOrder: number }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleAdd() {
    if (!name.trim()) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from('phases').insert({ project_id: projectId, name: name.trim(), sort_order: nextOrder })
    setName('')
    setOpen(false)
    setLoading(false)
    router.refresh()
  }

  if (!open) return (
    <button onClick={() => setOpen(true)}
      className="inline-flex items-center gap-1.5 text-sm text-[#C9A96E] font-semibold hover:underline mt-4">
      <Plus size={15} /> Add Phase
    </button>
  )

  return (
    <div className="mt-4 flex gap-2 items-center">
      <input autoFocus value={name} onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setOpen(false) }}
        className="flex-1 px-3 py-2 border border-[#C9A96E] rounded-lg text-sm focus:outline-none"
        placeholder="Phase name, e.g. Design" />
      <button onClick={handleAdd} disabled={loading || !name.trim()}
        className="bg-[#C9A96E] hover:bg-[#b8924d] text-white px-3 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
        Add
      </button>
      <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
        <X size={18} />
      </button>
    </div>
  )
}
