import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate, statusBadgeClass, statusLabel } from '@/lib/utils'
import { FileText, Plus, AlertCircle, TrendingUp } from 'lucide-react'
import StatusSelect from '@/components/StatusSelect'

export default async function InvoicesPage() {
  const supabase = await createClient()
  const { data: invoices } = await supabase
    .from('invoices')
    .select(`id, title, amount, status, due_date, paid_date, notes, clients(name), projects(name)`)
    .order('created_at', { ascending: false })

  const totalAll = invoices?.reduce((s, i) => s + (i.amount ?? 0), 0) ?? 0
  const totalPaid = invoices?.filter(i => i.status === 'paid').reduce((s, i) => s + (i.amount ?? 0), 0) ?? 0
  const totalUnpaid = invoices?.filter(i => i.status === 'unpaid').reduce((s, i) => s + (i.amount ?? 0), 0) ?? 0
  const totalOverdue = invoices?.filter(i => i.status === 'overdue').reduce((s, i) => s + (i.amount ?? 0), 0) ?? 0
  const collectionRate = totalAll > 0 ? Math.round((totalPaid / totalAll) * 100) : 0

  return (
    <div>
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-400 mt-0.5">{invoices?.length ?? 0} total</p>
        </div>
        <Link href="/invoices/new"
          className="inline-flex items-center gap-2 bg-[#22C55E] hover:bg-[#16a34a] text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md">
          <Plus size={16} />
          <span className="hidden sm:inline">New Invoice</span>
          <span className="sm:hidden">New</span>
        </Link>
      </div>

      {invoices && invoices.length > 0 && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
            {[
              { label: 'Total Billed', value: formatCurrency(totalAll), color: 'text-gray-900', bg: 'bg-gray-50' },
              { label: 'Collected', value: formatCurrency(totalPaid), color: 'text-emerald-600', bg: 'bg-emerald-50' },
              { label: 'Pending', value: formatCurrency(totalUnpaid), color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: 'Overdue', value: formatCurrency(totalOverdue), color: totalOverdue > 0 ? 'text-red-600' : 'text-gray-400', bg: totalOverdue > 0 ? 'bg-red-50' : 'bg-gray-50' },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`${bg} rounded-2xl border border-gray-100 p-4`}>
                <p className="text-xs text-gray-400 mb-1">{label}</p>
                <p className={`text-lg font-bold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* Collection rate bar */}
          <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4 mb-5">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
              <span className="flex items-center gap-1"><TrendingUp size={11} />Collection rate</span>
              <span className="font-bold text-gray-700">{collectionRate}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${collectionRate}%` }} />
            </div>
          </div>
        </>
      )}

      {!invoices?.length ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText size={28} className="text-gray-300" />
          </div>
          <p className="font-semibold text-gray-700 mb-1">No invoices yet</p>
          <p className="text-gray-400 text-sm mb-6">Create your first invoice to start tracking payments.</p>
          <Link href="/invoices/new"
            className="inline-flex items-center gap-2 bg-[#22C55E] hover:bg-[#16a34a] text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all">
            <Plus size={15} /> Create Invoice
          </Link>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {invoices.map(invoice => {
              const client = (invoice.clients as { name: string }[] | null)?.[0] ?? null
              const project = (invoice.projects as { name: string }[] | null)?.[0] ?? null
              return (
                <div key={invoice.id}
                  className={`bg-white rounded-2xl border shadow-sm p-4 ${invoice.status === 'overdue' ? 'border-red-200' : 'border-gray-100'}`}>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex-1 min-w-0">
                      {invoice.status === 'overdue' && <AlertCircle size={13} className="text-red-500 inline mr-1" />}
                      <p className="font-semibold text-gray-900 text-sm truncate inline">{invoice.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{client?.name ?? '—'}{project?.name ? ` · ${project.name}` : ''}</p>
                    </div>
                    <p className="text-lg font-bold text-gray-900 flex-shrink-0">{formatCurrency(invoice.amount)}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <StatusSelect table="invoices" id={invoice.id} currentStatus={invoice.status} />
                    <p className="text-xs text-gray-400">
                      {invoice.status === 'paid' ? `Paid ${formatDate(invoice.paid_date)}` : `Due ${formatDate(invoice.due_date)}`}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-50 bg-gray-50/50">
                  {['Invoice', 'Client', 'Project', 'Amount', 'Status', 'Due / Paid'].map(h => (
                    <th key={h} className={`text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider ${h === 'Amount' ? 'text-right' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map(invoice => {
                  const client = (invoice.clients as { name: string }[] | null)?.[0] ?? null
                  const project = (invoice.projects as { name: string }[] | null)?.[0] ?? null
                  return (
                    <tr key={invoice.id} className={`border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors ${invoice.status === 'overdue' ? 'bg-red-50/30' : ''}`}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          {invoice.status === 'overdue' && <AlertCircle size={13} className="text-red-500 flex-shrink-0" />}
                          <span className="font-medium text-gray-900">{invoice.title}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-gray-500">{client?.name ?? '—'}</td>
                      <td className="px-5 py-3.5 text-gray-500">{project?.name ?? '—'}</td>
                      <td className="px-5 py-3.5 text-right font-bold text-gray-900">{formatCurrency(invoice.amount)}</td>
                      <td className="px-5 py-3.5">
                        <StatusSelect table="invoices" id={invoice.id} currentStatus={invoice.status} />
                      </td>
                      <td className="px-5 py-3.5 text-xs text-gray-400">
                        {invoice.status === 'paid' ? formatDate(invoice.paid_date) : formatDate(invoice.due_date)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
