'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function TaskToggle({ taskId, title, isComplete, dueDate }: {
  taskId: string; title: string; isComplete: boolean; dueDate: string | null
}) {
  const [complete, setComplete] = useState(isComplete)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.from('tasks').update({ is_complete: !complete }).eq('id', taskId)
    if (!error) setComplete(prev => !prev)
    setLoading(false)
  }

  return (
    <div className={cn(
      'flex items-center gap-3 rounded-xl px-3 py-2.5 border transition-all cursor-pointer group',
      complete ? 'border-green-100 bg-green-50' : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50/50'
    )} onClick={toggle}>
      <div className={cn(
        'w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all',
        complete ? 'bg-green-500 border-green-500' : 'border-gray-300 group-hover:border-[#6366F1]',
        loading && 'opacity-50'
      )}>
        {complete && <Check size={10} className="text-white" strokeWidth={3} />}
      </div>
      <span className={cn('text-sm flex-1 transition-colors', complete ? 'line-through text-gray-400' : 'text-gray-700')}>
        {title}
      </span>
      {dueDate && (
        <span className="text-xs text-gray-400 flex-shrink-0 tabular-nums">
          {new Date(dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
      )}
    </div>
  )
}
