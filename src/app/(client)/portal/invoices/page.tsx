import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatCurrency, formatDate, statusBadgeClass, statusLabel } from '@/lib/utils'
import { FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react'

export default async function ClientInvoicesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: clientRecord } = await supabase
    .from('clients').select('id, name').eq('email', user.email ?? '').single()
  if (!clientRecord) redirect('/portal')

  const { data: invoices } = await supabase
    .from('invoices')
    .select('id, title, amount, status, due_date, paid_date, notes, projects(name)')
    .eq('client_id', clientRecord.id)
    .order('created_at', { ascending: false })

  const totalDue = invoices?.filter(i => i.status !== 'paid' && i.status !== 'cancelled')
    .reduce((s, i) => s + (i.amount ?? 0), 0) ?? 0
  const totalPaid = invoices?.filter(i => i.status === 'paid')
    .reduce((s, i) => s + (i.amount ?? 0), 0) ?? 0

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">Your Invoices</h1>
        <p className="text-sm text-gray-400 mt-0.5">{invoices?.length ?? 0} invoice{invoices?.length !== 1 ? 's' : ''}</p>
      </div>

      {invoices && invoices.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400 mb-1">Outstanding</p>
            <p className="text-xl font-bold text-amber-600">{formatCurrency(totalDue)}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-xs text-gray-400 mb-1">Paid</p>
            <p className="text-xl font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
          </div>
        </div>
      )}

      {!invoices?.length ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <FileText size={36} className="mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400 text-sm">No invoices yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map(invoice => {
            const project = (invoice.projects as { name: string }[] | null)?.[0] ?? null
            const isOverdue = invoice.status === 'overdue'
            const isPaid = invoice.status === 'paid'
            return (
              <div key={invoice.id}
                className={`bg-white rounded-2xl border p-5 ${isOverdue ? 'border-red-200' : 'border-gray-100'}`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      {isPaid && <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />}
                      {isOverdue && <AlertCircle size={14} className="text-red-500 flex-shrink-0" />}
                      {!isPaid && !isOverdue && <Clock size={14} className="text-amber-500 flex-shrink-0" />}
                      <p className="font-semibold text-gray-900 truncate">{invoice.title}</p>
                    </div>
                    {project && <p className="text-xs text-gray-400">{project.name}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(invoice.amount)}</p>
                    <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${statusBadgeClass(invoice.status)}`}>
                      {statusLabel(invoice.status)}
                    </span>
                  </div>
                </div>

                {invoice.notes && (
                  <p className="text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2 mb-3">{invoice.notes}</p>
                )}

                <div className="flex items-center justify-between text-xs text-gray-400">
                  {isPaid
                    ? <span className="text-green-500 font-medium">Paid on {formatDate(invoice.paid_date)}</span>
                    : <span className={isOverdue ? 'text-red-500 font-semibold' : ''}>Due: {formatDate(invoice.due_date)}</span>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
