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
  const [form, setForm] = useState({ name: '', client_id: '', description: '', status: 'active', start_date: '', due_date: '', budget: '' })

  useEffect(() => {
    supabase.from('clients').select('id, name').order('name').then(({ data }) => setClients(data ?? []))
  }, [])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

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
      budget: form.budget ? parseFloat(form.budget) : null,
    }).select().single()
    if (err) { setError(err.message); setLoading(false); return }
    router.push(`/projects/${data.id}`)
  }

  const inputCls = "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent transition-all bg-white"
  const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5"

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-7">
        <Link href="/projects" className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:border-gray-300 transition-all">
          <ArrowLeft size={16} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Project</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-7 space-y-5">
        <div>
          <label className={labelCls}>Project Name *</label>
          <input required value={form.name} onChange={set('name')} className={inputCls} placeholder="e.g. Brand Website Redesign" />
        </div>

        <div>
          <label className={labelCls}>Client</label>
          <select value={form.client_id} onChange={set('client_id')} className={inputCls}>
            <option value="">— Select client —</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div>
          <label className={labelCls}>Description</label>
          <textarea value={form.description} onChange={set('description')} rows={3}
            placeholder="Brief project description…" className={`${inputCls} resize-none`} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Status</label>
            <select value={form.status} onChange={set('status')} className={inputCls}>
              <option value="active">Active</option>
              <option value="on_hold">On Hold</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Budget ($)</label>
            <input type="number" min="0" value={form.budget} onChange={set('budget')} className={inputCls} placeholder="0" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Start Date</label>
            <input type="date" value={form.start_date} onChange={set('start_date')} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Due Date</label>
            <input type="date" value={form.due_date} onChange={set('due_date')} className={inputCls} />
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="flex-1 bg-[#C9A96E] hover:bg-[#b8924d] text-white font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50 shadow-sm hover:shadow-md">
            {loading ? 'Creating…' : 'Create Project'}
          </button>
          <Link href="/projects" className="px-5 py-3 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors font-medium">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
