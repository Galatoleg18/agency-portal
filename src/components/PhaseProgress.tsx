'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function PhaseProgress({ phaseId, currentPct }: { phaseId: string; currentPct: number }) {
  const router = useRouter()
  const [pct, setPct] = useState(currentPct)
  const [saving, setSaving] = useState(false)

  async function save(val: number) {
    setSaving(true)
    const supabase = createClient()
    const newStatus = val === 100 ? 'completed' : val > 0 ? 'in_progress' : 'pending'
    await supabase.from('phases').update({ completion_pct: val, status: newStatus }).eq('id', phaseId)
    setSaving(false)
    router.refresh()
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-3">
        <input
          type="range" min={0} max={100} step={5} value={pct}
          onChange={e => setPct(Number(e.target.value))}
          onMouseUp={() => save(pct)}
          onTouchEnd={() => save(pct)}
          className="flex-1 accent-[#C9A96E] cursor-pointer h-1.5"
        />
        <div className="flex items-center gap-1 w-16">
          <input
            type="number" min={0} max={100} value={pct}
            onChange={e => setPct(Math.min(100, Math.max(0, Number(e.target.value))))}
            onBlur={() => save(pct)}
            className="w-12 text-xs font-bold text-[#C9A96E] text-center bg-transparent border-0 focus:outline-none"
          />
          <span className="text-xs text-gray-400">%</span>
        </div>
        {saving && <span className="text-xs text-gray-400 animate-pulse">saving…</span>}
      </div>
      <div className="w-full bg-gray-100 rounded-full h-1.5">
        <div className="bg-[#C9A96E] h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
