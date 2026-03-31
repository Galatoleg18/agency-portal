import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import PrintBar from './PrintBar'

interface PageProps { params: Promise<{ id: string }> }

export default async function InvoicePDFPage({ params }: PageProps) {
  const { id } = await params

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  )

  const { data: invoice } = await supabase
    .from('invoices')
    .select(`id, title, amount, status, due_date, paid_date, notes, invoice_number, created_at, tax_rate, discount,
      clients(name, email, company, phone),
      projects(name)`)
    .eq('id', id).single()

  if (!invoice) notFound()

  const { data: rawItems } = await supabase
    .from('invoice_items')
    .select('id, description, quantity, unit_price, amount, sort_order')
    .eq('invoice_id', id)
    .order('sort_order')

  const client = (invoice.clients as any)?.[0] ?? null
  const project = (invoice.projects as any)?.[0] ?? null
  const invNum = (invoice as any).invoice_number ?? `INV-${id.slice(0, 8).toUpperCase()}`
  const items = rawItems ?? []

  const subtotal = items.length
    ? items.reduce((s: number, it: any) => s + Number(it.amount ?? (it.quantity * it.unit_price)), 0)
    : Number(invoice.amount ?? 0)
  const taxRate = Number((invoice as any).tax_rate ?? 0)
  const discount = Number((invoice as any).discount ?? 0)
  const taxAmt = subtotal * (taxRate / 100)
  const total = items.length ? subtotal + taxAmt - discount : Number(invoice.amount ?? 0)

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  const statusMap: Record<string, { label: string; color: string; bg: string }> = {
    paid:    { label: 'PAID',    color: '#065f46', bg: '#d1fae5' },
    unpaid:  { label: 'UNPAID',  color: '#92400e', bg: '#fef3c7' },
    overdue: { label: 'OVERDUE', color: '#991b1b', bg: '#fee2e2' },
  }
  const st = statusMap[invoice.status] ?? { label: invoice.status.toUpperCase(), color: '#475569', bg: '#f1f5f9' }

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{invNum} · {client?.name ?? 'Invoice'}</title>
        <style>{`
          *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
          html, body { background:#f0f2f5; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif; color:#1e293b; -webkit-font-smoothing:antialiased; }
          body { padding: 80px 20px 48px; }

          .invoice { background:#fff; max-width:800px; margin:0 auto; border-radius:4px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,.08),0 8px 32px rgba(0,0,0,.06); }

          /* Top accent bar */
          .accent-bar { height:6px; background:linear-gradient(90deg,#6366F1,#8b5cf6); }

          /* Header */
          .inv-header { padding:44px 52px 36px; display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px solid #f1f5f9; }
          .brand-name { font-size:22px; font-weight:900; letter-spacing:2px; color:#0f172a; text-transform:uppercase; }
          .brand-sub { font-size:11px; color:#94a3b8; letter-spacing:1px; margin-top:4px; }
          .inv-title-block { text-align:right; }
          .inv-label { font-size:11px; font-weight:700; letter-spacing:2px; color:#94a3b8; text-transform:uppercase; margin-bottom:6px; }
          .inv-number { font-size:26px; font-weight:800; color:#0f172a; letter-spacing:-0.5px; }
          .status-pill { display:inline-block; margin-top:10px; padding:5px 14px; border-radius:4px; font-size:10px; font-weight:800; letter-spacing:1.5px; text-transform:uppercase; background:${st.bg}; color:${st.color}; }

          /* Meta row */
          .meta-row { display:grid; grid-template-columns:1fr 1fr 1fr; gap:0; border-bottom:1px solid #f1f5f9; }
          .meta-cell { padding:28px 52px; border-right:1px solid #f1f5f9; }
          .meta-cell:last-child { border-right:none; }
          .meta-label { font-size:9px; font-weight:700; letter-spacing:1.5px; color:#94a3b8; text-transform:uppercase; margin-bottom:8px; }
          .meta-value { font-size:14px; font-weight:600; color:#0f172a; line-height:1.5; }
          .meta-value.muted { font-size:12px; font-weight:400; color:#64748b; }
          .meta-value.overdue { color:#dc2626; }
          .meta-value.paid { color:#059669; }

          /* Items */
          .items-section { padding:36px 52px; }
          .items-table { width:100%; border-collapse:collapse; }
          .items-table thead th {
            font-size:9px; font-weight:700; letter-spacing:1.5px; color:#94a3b8;
            text-transform:uppercase; padding:0 0 14px; border-bottom:2px solid #f1f5f9;
            text-align:left;
          }
          .items-table thead th.r { text-align:right; }
          .items-table tbody tr { border-bottom:1px solid #f8fafc; }
          .items-table tbody tr:last-child { border-bottom:none; }
          .items-table tbody td { padding:16px 0; font-size:13.5px; color:#334155; vertical-align:top; }
          .items-table tbody td.r { text-align:right; font-weight:600; color:#0f172a; }
          .item-desc { font-weight:500; color:#0f172a; line-height:1.4; }
          .item-sub { font-size:11px; color:#94a3b8; margin-top:3px; }

          /* Totals */
          .totals-section { border-top:2px solid #f1f5f9; padding:24px 52px 36px; display:flex; justify-content:flex-end; }
          .totals-box { min-width:260px; }
          .tot-row { display:flex; justify-content:space-between; align-items:center; gap:40px; font-size:13px; color:#64748b; padding:7px 0; }
          .tot-row.sub { border-bottom:1px solid #f1f5f9; margin-bottom:4px; padding-bottom:12px; }
          .tot-row.grand { margin-top:12px; padding-top:14px; border-top:2px solid #0f172a; }
          .tot-row.grand span:first-child { font-size:14px; font-weight:700; color:#0f172a; }
          .tot-row.grand span:last-child { font-size:22px; font-weight:800; color:#0f172a; }
          .tot-row .disc { color:#dc2626; }

          /* Notes */
          .notes-section { margin:0 52px 36px; background:#f8fafc; border-radius:6px; padding:20px 24px; border-left:3px solid #6366F1; }
          .notes-label { font-size:9px; font-weight:700; letter-spacing:1.5px; color:#6366F1; text-transform:uppercase; margin-bottom:8px; }
          .notes-text { font-size:12.5px; color:#475569; line-height:1.7; }

          /* Footer */
          .inv-footer { background:#f8fafc; border-top:1px solid #f1f5f9; padding:20px 52px; display:flex; justify-content:space-between; align-items:center; }
          .footer-brand { font-size:11px; font-weight:700; color:#94a3b8; letter-spacing:1px; text-transform:uppercase; }
          .footer-contact { font-size:11px; color:#94a3b8; }
          .footer-thanks { font-size:11px; color:#94a3b8; font-style:italic; }

          @media print {
            html, body { background:white; padding:0; }
            .invoice { box-shadow:none; border-radius:0; max-width:100%; }
            @page { margin:0; size:A4 portrait; }
          }
          @media (max-width: 640px) {
            body { padding: 72px 0 0; }
            .inv-header { padding:28px 24px; }
            .meta-row { grid-template-columns:1fr; }
            .meta-cell { padding:16px 24px; border-right:none; border-bottom:1px solid #f1f5f9; }
            .items-section { padding:24px; }
            .totals-section { padding:16px 24px 24px; }
            .totals-box { min-width:100%; }
            .notes-section { margin:0 24px 24px; }
            .inv-footer { padding:16px 24px; flex-direction:column; gap:6px; text-align:center; }
          }
        `}</style>
      </head>
      <body>
        <PrintBar invNum={invNum} clientName={client?.name ?? 'Invoice'} />

        <div className="invoice">
          <div className="accent-bar" />

          {/* Header */}
          <div className="inv-header">
            <div>
              <div className="brand-name">DOT IT</div>
              <div className="brand-sub">CREATIVE AGENCY</div>
            </div>
            <div className="inv-title-block">
              <div className="inv-label">Invoice</div>
              <div className="inv-number">{invNum}</div>
              <div className="status-pill">{st.label}</div>
            </div>
          </div>

          {/* Meta: Bill To / Issue Date / Due Date */}
          <div className="meta-row">
            <div className="meta-cell">
              <div className="meta-label">Bill To</div>
              {client ? (
                <>
                  <div className="meta-value">{client.name}</div>
                  {client.company && <div className="meta-value muted">{client.company}</div>}
                  {client.email   && <div className="meta-value muted">{client.email}</div>}
                  {client.phone   && <div className="meta-value muted">{client.phone}</div>}
                </>
              ) : <div className="meta-value muted">—</div>}
            </div>
            <div className="meta-cell">
              <div className="meta-label">Issue Date</div>
              <div className="meta-value">{formatDate(invoice.created_at)}</div>
              {project && (
                <>
                  <div className="meta-label" style={{marginTop:'18px'}}>Project</div>
                  <div className="meta-value">{project.name}</div>
                </>
              )}
            </div>
            <div className="meta-cell">
              <div className="meta-label">Due Date</div>
              <div className={`meta-value ${invoice.status === 'overdue' ? 'overdue' : ''}`}>
                {formatDate(invoice.due_date)}
              </div>
              {invoice.status === 'paid' && invoice.paid_date && (
                <>
                  <div className="meta-label" style={{marginTop:'18px'}}>Paid On</div>
                  <div className="meta-value paid">{formatDate(invoice.paid_date)}</div>
                </>
              )}
            </div>
          </div>

          {/* Line items */}
          <div className="items-section">
            <table className="items-table">
              <thead>
                <tr>
                  <th style={{width: items.length ? '52%' : '80%'}}>Description</th>
                  {items.length > 0 && <>
                    <th className="r" style={{width:'10%'}}>Qty</th>
                    <th className="r" style={{width:'18%'}}>Unit Price</th>
                  </>}
                  <th className="r" style={{width: items.length ? '18%' : '20%'}}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.length > 0 ? items.map((item: any) => (
                  <tr key={item.id}>
                    <td><div className="item-desc">{item.description}</div></td>
                    <td className="r" style={{color:'#64748b'}}>
                      {Number(item.quantity) % 1 === 0 ? Math.floor(item.quantity) : item.quantity}
                    </td>
                    <td className="r" style={{color:'#64748b'}}>{fmt(item.unit_price)}</td>
                    <td className="r">{fmt(item.amount ?? item.quantity * item.unit_price)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td><div className="item-desc">{invoice.title}</div></td>
                    <td className="r">{fmt(Number(invoice.amount ?? 0))}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="totals-section">
            <div className="totals-box">
              {items.length > 0 && (
                <div className={`tot-row${(taxRate > 0 || discount > 0) ? ' sub' : ''}`}>
                  <span>Subtotal</span>
                  <span>{fmt(subtotal)}</span>
                </div>
              )}
              {taxRate > 0 && (
                <div className="tot-row">
                  <span>Tax ({taxRate}%)</span>
                  <span>{fmt(taxAmt)}</span>
                </div>
              )}
              {discount > 0 && (
                <div className="tot-row">
                  <span>Discount</span>
                  <span className="disc">−{fmt(discount)}</span>
                </div>
              )}
              <div className="tot-row grand">
                <span>Total Due</span>
                <span>{fmt(total)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="notes-section">
              <div className="notes-label">Notes & Payment Instructions</div>
              <div className="notes-text">{invoice.notes}</div>
            </div>
          )}

          {/* Footer */}
          <div className="inv-footer">
            <div className="footer-brand">DOT IT Agency</div>
            <div className="footer-contact">ask.dot.it@gmail.com</div>
            <div className="footer-thanks">Thank you for your business</div>
          </div>
        </div>
      </body>
    </html>
  )
}
