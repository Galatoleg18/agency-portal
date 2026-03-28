'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function PhaseProgress({ phaseId, currentPct }: { phaseId: string; currentPct: number }) {
  const router = useRouter()
  const [pct, setPct] = useState(currentPct)
  const [saving, setSaving] = useState(false)

  async function handleChange(val: number) {
    setPct(val)
    setSaving(true)
    const supabase = createClient()
    const status = val === 100 ? 'completed' : val > 0 ? 'in_progress' : 'pending'
    await supabase.from('phases').update({ completion_pct: val, status }).eq('id', phaseId)
    setSaving(false)
    router.refresh()
  }

  return (
    <div className="flex items-center gap-3 mb-4">
      <input type="range" min={0} max={100} step={5} value={pct}
        onChange={e => handleChange(parseInt(e.target.value))}
        className="flex-1 accent-[#C9A96E]" />
      <span className="text-sm font-semibold text-gray-700 w-10 text-right">
        {saving ? '...' : `${pct}%`}
      </span>
    </div>
  )
}
