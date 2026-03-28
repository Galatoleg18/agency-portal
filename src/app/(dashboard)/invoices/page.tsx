import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate, statusBadgeClass, statusLabel } from '@/lib/utils'
import { FileText, Plus, AlertCircle } from 'lucide-react'

export default async function InvoicesPage() {
  const supabase = await createClient()

  const { data: invoices } = await supabase
    .from('invoices')
    .select(`id, title, amount, status, due_date, paid_date, clients(name), projects(name)`)
    .order('created_at', { ascending: false })

  const totalUnpaid = invoices?.filter(i => i.status === 'unpaid' || i.status === 'overdue')
    .reduce((s, i) => s + (i.amount ?? 0), 0) ?? 0
  const totalPaid = invoices?.filter(i => i.status === 'paid')
    .reduce((s, i) => s + (i.amount ?? 0), 0) ?? 0

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500 mt-0.5">{invoices?.length ?? 0} total</p>
        </div>
        <Link href="/invoices/new"
          className="inline-flex items-center gap-2 bg-[#C9A96E] hover:bg-[#b8924d] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors shadow-sm">
          <Plus size={16} />
          <span className="hidden sm:inline">New Invoice</span>
          <span className="sm:hidden">New</span>
        </Link>
      </div>

      {/* Summary */}
      {invoices && invoices.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:gap-5 mb-6">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
            <p className="text-xs text-gray-500 mb-1">Outstanding</p>
            <p className="text-xl sm:text-2xl font-bold text-red-500">{formatCurrency(totalUnpaid)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 sm:p-5">
            <p className="text-xs text-gray-500 mb-1">Collected</p>
            <p className="text-xl sm:text-2xl font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
          </div>
        </div>
      )}

      {!invoices || invoices.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <FileText size={40} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-700 font-medium mb-1">No invoices yet</p>
          <p className="text-gray-400 text-sm mb-5">Create your first invoice to start tracking payments.</p>
          <Link href="/invoices/new"
            className="inline-flex items-center gap-2 bg-[#C9A96E] hover:bg-[#b8924d] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
            <Plus size={15} /> Create First Invoice
          </Link>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="sm:hidden space-y-3">
            {invoices.map((invoice) => {
              const client = (invoice.clients as { name: string }[] | null)?.[0] ?? null
              const project = (invoice.projects as { name: string }[] | null)?.[0] ?? null
              const isOverdue = invoice.status === 'overdue'
              return (
                <div key={invoice.id}
                  className={`bg-white rounded-xl border shadow-sm p-4 ${isOverdue ? 'border-red-200' : 'border-gray-100'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0 pr-3">
                      <div className="flex items-center gap-1.5">
                        {isOverdue && <AlertCircle size={14} className="text-red-500 flex-shrink-0" />}
                        <p className="font-semibold text-gray-900 truncate">{invoice.title}</p>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {client?.name ?? 'No client'}{project?.name ? ` · ${project.name}` : ''}
                      </p>
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold flex-shrink-0 ${statusBadgeClass(invoice.status)}`}>
                      {statusLabel(invoice.status)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(invoice.amount)}</p>
                    <p className="text-xs text-gray-400">
                      {invoice.status === 'paid' ? `Paid ${formatDate(invoice.paid_date)}` : `Due ${formatDate(invoice.due_date)}`}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden sm:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Invoice', 'Client', 'Project', 'Amount', 'Status', 'Due', 'Paid'].map(h => (
                      <th key={h} className={`${h === 'Amount' ? 'text-right' : 'text-left'} px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => {
                    const client = (invoice.clients as { name: string }[] | null)?.[0] ?? null
                    const project = (invoice.projects as { name: string }[] | null)?.[0] ?? null
                    return (
                      <tr key={invoice.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-4 font-medium text-gray-900">{invoice.title}</td>
                        <td className="px-5 py-4 text-gray-500">{client?.name ?? '—'}</td>
                        <td className="px-5 py-4 text-gray-500">{project?.name ?? '—'}</td>
                        <td className="px-5 py-4 text-right font-semibold text-gray-900">{formatCurrency(invoice.amount)}</td>
                        <td className="px-5 py-4">
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(invoice.status)}`}>
                            {statusLabel(invoice.status)}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-gray-500">{formatDate(invoice.due_date)}</td>
                        <td className="px-5 py-4 text-gray-500">{formatDate(invoice.paid_date)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
