'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TaskToggleProps {
  taskId: string
  title: string
  isComplete: boolean
  dueDate: string | null
}

export default function TaskToggle({
  taskId,
  title,
  isComplete,
  dueDate,
}: TaskToggleProps) {
  const [complete, setComplete] = useState(isComplete)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('tasks')
      .update({ is_complete: !complete })
      .eq('id', taskId)

    if (!error) {
      setComplete((prev) => !prev)
    }
    setLoading(false)
  }

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 border transition-colors',
        complete
          ? 'border-green-100 bg-green-50'
          : 'border-gray-100 hover:border-gray-200'
      )}
    >
      <button
        onClick={toggle}
        disabled={loading}
        className={cn(
          'w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
          complete
            ? 'bg-green-500 border-green-500'
            : 'border-gray-300 hover:border-[#C9A96E]',
          loading && 'opacity-50 cursor-not-allowed'
        )}
        aria-label={complete ? 'Mark incomplete' : 'Mark complete'}
      >
        {complete && <Check size={11} className="text-white" strokeWidth={3} />}
      </button>

      <span
        className={cn(
          'text-sm flex-1',
          complete ? 'line-through text-gray-400' : 'text-gray-700'
        )}
      >
        {title}
      </span>

      {dueDate && (
        <span className="text-xs text-gray-400 flex-shrink-0">
          {new Date(dueDate).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
        </span>
      )}
    </div>
  )
}
