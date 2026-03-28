'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewProjectPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])

  const [form, setForm] = useState({
    name: '',
    client_id: '',
    description: '',
    status: 'active',
    start_date: '',
    due_date: '',
  })

  useEffect(() => {
    supabase.from('clients').select('id, name').order('name').then(({ data }) => {
      setClients(data ?? [])
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error: err } = await supabase.from('projects').insert({
      name: form.name,
      client_id: form.client_id || null,
      description: form.description || null,
      status: form.status,
      start_date: form.start_date || null,
      due_date: form.due_date || null,
    }).select().single()

    if (err) { setError(err.message); setLoading(false); return }
    router.push(`/projects/${data.id}`)
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/projects" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Project</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Project Name *</label>
          <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent"
            placeholder="e.g. Brand Website Redesign" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Client</label>
          <select value={form.client_id} onChange={e => setForm({...form, client_id: e.target.value})}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A96E] bg-white">
            <option value="">— Select client —</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
          <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})}
            rows={3} placeholder="Brief project description..."
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A96E] resize-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
          <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A96E] bg-white">
            <option value="active">Active</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
            <input type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A96E]" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Due Date</label>
            <input type="date" value={form.due_date} onChange={e => setForm({...form, due_date: e.target.value})}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A96E]" />
          </div>
        </div>

        {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="flex-1 bg-[#C9A96E] hover:bg-[#b8924d] text-white font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Project'}
          </button>
          <Link href="/projects"
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
