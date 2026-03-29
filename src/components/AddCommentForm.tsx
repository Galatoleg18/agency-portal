'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Send } from 'lucide-react'

export default function AddCommentForm({ projectId, authorEmail, authorName }: {
  projectId: string; authorEmail: string; authorName: string
}) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from('comments').insert({
      project_id: projectId, body: body.trim(),
      author_email: authorEmail, author_name: authorName,
    })
    setBody('')
    setLoading(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-3 items-end">
      <div className="w-8 h-8 rounded-full bg-[#0F172A] flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mb-0.5">
        {(authorName || authorEmail)?.[0]?.toUpperCase()}
      </div>
      <div className="flex-1 flex gap-2">
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e as any) } }}
          rows={2}
          placeholder="Add a comment… (Enter to send)"
          className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent resize-none transition-all"
        />
        <button type="submit" disabled={loading || !body.trim()}
          className="flex-shrink-0 w-10 h-10 bg-[#6366F1] hover:bg-[#4f46e5] disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center transition-all mb-0.5 self-end">
          <Send size={15} />
        </button>
      </div>
    </form>
  )
}
