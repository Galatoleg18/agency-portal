import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency, formatDate, statusBadgeClass, statusLabel } from '@/lib/utils'
import { FileText } from 'lucide-react'

export default async function InvoicesPage() {
  const supabase = await createClient()

  const { data: invoices } = await supabase
    .from('invoices')
    .select(`
      id, title, amount, status, due_date, paid_date,
      clients(name),
      projects(name)
    `)
    .order('created_at', { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
        <Link href="/invoices/new"
          className="inline-flex items-center gap-2 bg-[#C9A96E] hover:bg-[#b8924d] text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors">
          + New Invoice
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {!invoices || invoices.length === 0 ? (
          <div className="p-12 text-center">
            <FileText size={40} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-700 font-medium mb-1">No invoices yet</p>
            <p className="text-gray-400 text-sm mb-5">Create your first invoice to start tracking payments.</p>
            <Link href="/invoices/new"
              className="inline-flex items-center gap-2 bg-[#C9A96E] hover:bg-[#b8924d] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
              + Create First Invoice
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Project
                  </th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Paid Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice) => {
                  const client = (invoice.clients as { name: string }[] | null)?.[0] ?? null
                  const project = (invoice.projects as { name: string }[] | null)?.[0] ?? null

                  return (
                    <tr
                      key={invoice.id}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {invoice.title}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {client?.name ?? '—'}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {project?.name ?? '—'}
                      </td>
                      <td className="px-6 py-4 text-right font-semibold text-gray-900">
                        {formatCurrency(invoice.amount)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(
                            invoice.status
                          )}`}
                        >
                          {statusLabel(invoice.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {formatDate(invoice.due_date)}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {formatDate(invoice.paid_date)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
