'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewInvoicePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState({ title: '', client_id: '', project_id: '', amount: '', status: 'unpaid', due_date: '', notes: '' })

  useEffect(() => {
    supabase.from('clients').select('id, name').order('name').then(({ data }) => setClients(data ?? []))
    supabase.from('projects').select('id, name').order('name').then(({ data }) => setProjects(data ?? []))
  }, [])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.amount || isNaN(parseFloat(form.amount))) { setError('Please enter a valid amount.'); return }
    setLoading(true)
    setError(null)
    const { error: err } = await supabase.from('invoices').insert({
      title: form.title,
      client_id: form.client_id || null,
      project_id: form.project_id || null,
      amount: parseFloat(form.amount),
      status: form.status,
      due_date: form.due_date || null,
      notes: form.notes || null,
    })
    if (err) { setError(err.message); setLoading(false); return }
    router.push('/invoices')
  }

  const inputCls = "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent transition-all bg-white"
  const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5"

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-7">
        <Link href="/invoices" className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-all">
          <ArrowLeft size={16} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Invoice</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-7 space-y-5">
        <div>
          <label className={labelCls}>Invoice Title *</label>
          <input required value={form.title} onChange={set('title')} className={inputCls} placeholder="e.g. Website Design — Phase 1" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelCls}>Client</label>
            <select value={form.client_id} onChange={set('client_id')} className={inputCls}>
              <option value="">— Select client —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelCls}>Project</label>
            <select value={form.project_id} onChange={set('project_id')} className={inputCls}>
              <option value="">— Select project —</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className={labelCls}>Amount ($) *</label>
            <input required type="number" min="0" step="0.01" value={form.amount} onChange={set('amount')} className={inputCls} placeholder="0.00" />
          </div>
          <div>
            <label className={labelCls}>Status</label>
            <select value={form.status} onChange={set('status')} className={inputCls}>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>

        <div>
          <label className={labelCls}>Due Date</label>
          <input type="date" value={form.due_date} onChange={set('due_date')} className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Notes</label>
          <textarea value={form.notes} onChange={set('notes')} rows={3}
            placeholder="Payment instructions, notes…" className={`${inputCls} resize-none`} />
        </div>

        {error && <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="flex-1 bg-[#22C55E] hover:bg-[#16a34a] text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50">
            {loading ? 'Creating…' : 'Create Invoice'}
          </button>
          <Link href="/invoices" className="px-5 py-3 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors font-medium">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
