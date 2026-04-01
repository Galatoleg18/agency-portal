'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Plus, Trash2, GripVertical } from 'lucide-react'
import Link from 'next/link'
import { generateInvoiceNumber } from '@/lib/invoice-number'

interface LineItem {
  id: string
  description: string
  quantity: string
  unit_price: string
}

function newItem(): LineItem {
  return { id: crypto.randomUUID(), description: '', quantity: '1', unit_price: '' }
}

export default function NewInvoicePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [items, setItems] = useState<LineItem[]>([newItem()])
  const [form, setForm] = useState({
    title: '',
    client_id: '',
    project_id: '',
    status: 'unpaid',
    due_date: '',
    tax_rate: '',
    discount: '',
    notes: '',
    invoice_number: generateInvoiceNumber(),
  })

  useEffect(() => {
    supabase.from('clients').select('id, name').order('name').then(({ data }) => setClients(data ?? []))
    supabase.from('projects').select('id, name').order('name').then(({ data }) => setProjects(data ?? []))
  }, [])

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }))

  const setItem = (id: string, k: keyof LineItem, v: string) =>
    setItems(items => items.map(it => it.id === id ? { ...it, [k]: v } : it))

  const addItem = () => setItems(items => [...items, newItem()])
  const removeItem = (id: string) => setItems(items => items.filter(it => it.id !== id))

  // Computed totals
  const subtotal = items.reduce((s, it) => {
    const qty = parseFloat(it.quantity) || 0
    const price = parseFloat(it.unit_price) || 0
    return s + qty * price
  }, 0)
  const taxRate = parseFloat(form.tax_rate) || 0
  const discount = parseFloat(form.discount) || 0
  const taxAmt = subtotal * (taxRate / 100)
  const total = subtotal + taxAmt - discount

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validItems = items.filter(it => it.description.trim() && it.unit_price)
    if (!validItems.length) { setError('Add at least one line item with a description and price.'); return }
    setLoading(true)
    setError(null)

    const { data: inv, error: invErr } = await supabase.from('invoices').insert({
      title: form.title || validItems[0].description,
      client_id: form.client_id || null,
      project_id: form.project_id || null,
      amount: total,
      status: form.status,
      due_date: form.due_date || null,
      tax_rate: taxRate || null,
      discount: discount || null,
      notes: form.notes || null,
      invoice_number: form.invoice_number,
    }).select('id').single()

    if (invErr || !inv) { setError(invErr?.message ?? 'Failed to create invoice'); setLoading(false); return }

    const { error: itemErr } = await supabase.from('invoice_items').insert(
      validItems.map((it, i) => ({
        invoice_id: inv.id,
        description: it.description,
        quantity: parseFloat(it.quantity) || 1,
        unit_price: parseFloat(it.unit_price) || 0,
        sort_order: i,
      }))
    )

    if (itemErr) { setError(itemErr.message); setLoading(false); return }
    router.push('/invoices')
  }

  const inputCls = "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent transition-all bg-white"
  const labelCls = "block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5"

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-3 mb-7">
        <Link href="/invoices" className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-all">
          <ArrowLeft size={16} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Invoice</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Header info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-7 space-y-5">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Invoice Details</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className={labelCls}>Invoice Title</label>
              <input value={form.title} onChange={set('title')} className={inputCls} placeholder="e.g. Website Design — Phase 1" />
            </div>
            <div>
              <label className={labelCls}>Invoice #</label>
              <div className="flex gap-2">
                <input value={form.invoice_number} readOnly className={`${inputCls} font-mono bg-gray-50 text-gray-600`} />
                <button type="button" onClick={() => setForm(f => ({ ...f, invoice_number: generateInvoiceNumber() }))}
                  title="Regenerate"
                  className="px-3 py-2 border border-gray-200 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all text-lg">↻</button>
              </div>
            </div>
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
              <label className={labelCls}>Status</label>
              <select value={form.status} onChange={set('status')} className={inputCls}>
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
            <div>
              <label className={labelCls}>Due Date</label>
              <input type="date" value={form.due_date} onChange={set('due_date')} className={inputCls} />
            </div>
          </div>
        </div>

        {/* Line items */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-7">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Line Items</h2>
          </div>

          {/* Header row */}
          <div className="hidden sm:grid grid-cols-[1fr_80px_100px_80px] gap-2 mb-2 px-1">
            {['Description', 'Qty', 'Unit Price', ''].map(h => (
              <span key={h} className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</span>
            ))}
          </div>

          <div className="space-y-2 mb-4">
            {items.map((item, idx) => (
              <div key={item.id} className="grid grid-cols-[auto_1fr] sm:grid-cols-[1fr_80px_100px_44px] gap-2 items-center">
                {/* Mobile label */}
                <span className="sm:hidden text-xs text-gray-400 pt-2">#{idx + 1}</span>

                <input
                  value={item.description}
                  onChange={e => setItem(item.id, 'description', e.target.value)}
                  placeholder="Description of service or product"
                  className="col-span-1 sm:col-span-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent bg-white"
                />
                <input
                  value={item.quantity}
                  onChange={e => setItem(item.id, 'quantity', e.target.value)}
                  type="number" min="0" step="any"
                  placeholder="1"
                  className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent bg-white text-right"
                />
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input
                    value={item.unit_price}
                    onChange={e => setItem(item.id, 'unit_price', e.target.value)}
                    type="number" min="0" step="0.01"
                    placeholder="0.00"
                    className="w-full pl-7 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent bg-white text-right"
                  />
                </div>
                <div className="flex items-center justify-between sm:justify-center gap-2">
                  {/* Line total on mobile */}
                  <span className="sm:hidden text-sm font-semibold text-gray-700">
                    {fmt((parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0))}
                  </span>
                  <button type="button" onClick={() => removeItem(item.id)} disabled={items.length === 1}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-400 hover:bg-red-50 transition-all disabled:opacity-20">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button type="button" onClick={addItem}
            className="flex items-center gap-2 text-sm text-[#6366F1] hover:text-[#4f46e5] font-semibold transition-colors py-1">
            <Plus size={15} /> Add line item
          </button>

          {/* Totals */}
          <div className="mt-6 pt-5 border-t border-gray-100 space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span className="font-medium text-gray-700">{fmt(subtotal)}</span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>Tax</span>
                <div className="relative w-20">
                  <input type="number" min="0" max="100" step="0.1" value={form.tax_rate}
                    onChange={set('tax_rate')} placeholder="0"
                    className="w-full pl-2 pr-5 py-1 border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:ring-1 focus:ring-[#6366F1]" />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">%</span>
                </div>
              </div>
              <span className="text-sm font-medium text-gray-700">{fmt(taxAmt)}</span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>Discount</span>
                <div className="relative w-24">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                  <input type="number" min="0" step="0.01" value={form.discount}
                    onChange={set('discount')} placeholder="0.00"
                    className="w-full pl-5 pr-2 py-1 border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:ring-1 focus:ring-[#6366F1]" />
                </div>
              </div>
              <span className="text-sm font-medium text-red-500">{discount > 0 ? `−${fmt(discount)}` : '—'}</span>
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-gray-200">
              <span className="font-bold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-gray-900">{fmt(total)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-7">
          <label className={labelCls}>Notes / Payment Instructions</label>
          <textarea value={form.notes} onChange={set('notes')} rows={3}
            placeholder="e.g. Payment due within 30 days. Wire transfer to account #…"
            className={`${inputCls} resize-none`} />
        </div>

        {error && <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>}

        <div className="flex gap-3 pb-8">
          <button type="submit" disabled={loading}
            className="flex-1 bg-[#6366F1] hover:bg-[#4f46e5] text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50">
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
