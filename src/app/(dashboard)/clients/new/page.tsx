'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NewClientPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', notes: '' })

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase.from('clients').insert({
      name: form.name, email: form.email,
      phone: form.phone || null,
      company: form.company || null,
      notes: form.notes || null,
    })
    if (err) { setError(err.message); setLoading(false); return }
    router.push('/clients')
  }

  const inputCls = "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#22C55E] focus:border-transparent transition-all"
  const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5"

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-7">
        <Link href="/clients" className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-all">
          <ArrowLeft size={16} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Add Client</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-7 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelCls}>Full Name *</label>
            <input required value={form.name} onChange={set('name')} className={inputCls} placeholder="Jane Smith" />
          </div>
          <div>
            <label className={labelCls}>Company</label>
            <input value={form.company} onChange={set('company')} className={inputCls} placeholder="Acme Corp" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className={labelCls}>Email *</label>
            <input required type="email" value={form.email} onChange={set('email')} className={inputCls} placeholder="jane@example.com" />
          </div>
          <div>
            <label className={labelCls}>Phone</label>
            <input type="tel" value={form.phone} onChange={set('phone')} className={inputCls} placeholder="+1 555 000 0000" />
          </div>
        </div>
        <div>
          <label className={labelCls}>Notes</label>
          <textarea value={form.notes} onChange={set('notes')} rows={3}
            placeholder="Any notes about this client…" className={`${inputCls} resize-none`} />
        </div>

        {error && <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading}
            className="flex-1 bg-[#22C55E] hover:bg-[#16a34a] text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50">
            {loading ? 'Saving…' : 'Add Client'}
          </button>
          <Link href="/clients" className="px-5 py-3 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 transition-colors font-medium">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
