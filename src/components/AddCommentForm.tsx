'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Send } from 'lucide-react'

interface AddCommentFormProps {
  projectId: string
  authorEmail: string
  authorName: string
}

export default function AddCommentForm({
  projectId,
  authorEmail,
  authorName,
}: AddCommentFormProps) {
  const router = useRouter()
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!body.trim()) return
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: insertError } = await supabase.from('comments').insert({
      project_id: projectId,
      author_email: authorEmail,
      author_name: authorName,
      body: body.trim(),
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    setBody('')
    setLoading(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-100 pt-5">
      <p className="text-sm font-medium text-gray-700 mb-2">Add a comment</p>
      <div className="relative">
        <textarea
          rows={3}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent resize-none pr-12"
          placeholder="Write your comment…"
        />
        <button
          type="submit"
          disabled={loading || !body.trim()}
          className="absolute right-3 bottom-3 p-1.5 bg-[#C9A96E] hover:bg-[#b8924d] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={14} />
        </button>
      </div>
      {error && (
        <p className="mt-2 text-xs text-red-500">{error}</p>
      )}
    </form>
  )
}
