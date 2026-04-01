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

  const client = (invoice.clients as any) ?? null
  const project = (invoice.projects as any) ?? null
  const invNum = (invoice as any).invoice_number ?? `DI-${id.slice(0, 8).toUpperCase()}`
  const items = rawItems ?? []

  const subtotal = items.length
    ? items.reduce((s: number, it: any) => s + Number(it.amount ?? (it.quantity * it.unit_price)), 0)
    : Number(invoice.amount ?? 0)
  const taxRate = Number((invoice as any).tax_rate ?? 0)
  const discount = Number((invoice as any).discount ?? 0)
  const taxAmt = subtotal * (taxRate / 100)
  const total = items.length ? subtotal + taxAmt - discount : Number(invoice.amount ?? 0)

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  const statusMap: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    paid:     { label: 'PAID',      color: '#065f46', bg: '#d1fae5', dot: '#10b981' },
    unpaid:   { label: 'UNPAID',    color: '#92400e', bg: '#fef3c7', dot: '#f59e0b' },
    overdue:  { label: 'OVERDUE',   color: '#991b1b', bg: '#fee2e2', dot: '#ef4444' },
    archived: { label: 'ARCHIVED',  color: '#475569', bg: '#f1f5f9', dot: '#94a3b8' },
  }
  const st = statusMap[invoice.status] ?? { label: invoice.status.toUpperCase(), color: '#475569', bg: '#f1f5f9', dot: '#94a3b8' }

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{invNum} · {client?.name ?? 'Invoice'}</title>
        <style>{`
          *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
          html, body { background:#eef0f4; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Helvetica Neue',Arial,sans-serif; color:#1e293b; -webkit-font-smoothing:antialiased; font-size:14px; }
          body { padding: 80px 16px 48px; }

          .sheet { background:#fff; max-width:760px; margin:0 auto; box-shadow:0 2px 8px rgba(0,0,0,.08),0 16px 48px rgba(0,0,0,.07); }

          /* Left stripe */
          .stripe { width:5px; background:linear-gradient(180deg,#6366F1 0%,#8b5cf6 100%); flex-shrink:0; }

          /* Header */
          .inv-head { display:flex; }
          .inv-head-inner { flex:1; padding:36px 40px 28px; display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px solid #f1f5f9; }
          .brand { }
          .brand-name { font-size:18px; font-weight:900; letter-spacing:2.5px; color:#0f172a; text-transform:uppercase; }
          .brand-tagline { font-size:9.5px; color:#94a3b8; letter-spacing:1.5px; text-transform:uppercase; margin-top:3px; }
          .inv-id-block { text-align:right; }
          .inv-id-label { font-size:9px; font-weight:700; letter-spacing:2px; color:#94a3b8; text-transform:uppercase; }
          .inv-id-num { font-size:20px; font-weight:800; color:#0f172a; letter-spacing:1px; font-variant-numeric:tabular-nums; margin-top:4px; }
          .status-badge { display:inline-flex; align-items:center; gap:5px; margin-top:8px; padding:4px 10px; border-radius:3px; font-size:9.5px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; background:${st.bg}; color:${st.color}; }
          .status-dot { width:5px; height:5px; border-radius:50%; background:${st.dot}; }

          /* Meta 3-col */
          .meta { display:grid; grid-template-columns:1fr 1fr 1fr; border-bottom:1px solid #f1f5f9; }
          .meta-col { padding:20px 40px; border-right:1px solid #f1f5f9; }
          .meta-col:last-child { border-right:none; }
          .ml { font-size:8.5px; font-weight:700; letter-spacing:1.5px; color:#94a3b8; text-transform:uppercase; margin-bottom:6px; }
          .mv { font-size:13px; font-weight:600; color:#0f172a; line-height:1.5; }
          .mv-sm { font-size:11.5px; font-weight:400; color:#64748b; line-height:1.5; }
          .mv-ok  { color:#059669; font-weight:600; }
          .mv-bad { color:#dc2626; font-weight:600; }

          /* Items table */
          .items { padding:28px 40px; }
          .tbl { width:100%; border-collapse:collapse; }
          .tbl thead th { font-size:8.5px; font-weight:700; letter-spacing:1.5px; color:#94a3b8; text-transform:uppercase; padding-bottom:12px; border-bottom:1.5px solid #f1f5f9; text-align:left; }
          .tbl thead th.r { text-align:right; }
          .tbl tbody tr { border-bottom:1px solid #f8fafc; }
          .tbl tbody tr:last-child { border-bottom:none; }
          .tbl td { padding:13px 0; font-size:13px; color:#334155; vertical-align:top; }
          .tbl td.r { text-align:right; }
          .td-desc { font-weight:500; color:#0f172a; line-height:1.45; max-width:340px; }
          .td-muted { font-size:12px; color:#64748b; font-weight:400; }
          .td-amt { font-weight:700; color:#0f172a; }

          /* Totals */
          .totals { display:flex; justify-content:flex-end; padding:4px 40px 28px; }
          .tot-wrap { width:220px; }
          .tr { display:flex; justify-content:space-between; font-size:12.5px; color:#64748b; padding:5px 0; }
          .tr.sep { border-bottom:1px solid #f1f5f9; padding-bottom:10px; margin-bottom:4px; }
          .tr.grand { border-top:1.5px solid #0f172a; margin-top:8px; padding-top:10px; }
          .tr.grand span:first-child { font-size:13px; font-weight:700; color:#0f172a; }
          .tr.grand span:last-child { font-size:19px; font-weight:800; color:#0f172a; letter-spacing:-0.5px; }
          .disc { color:#dc2626; }

          /* Notes */
          .notes { margin:0 40px 24px; background:#f8fafc; border-left:3px solid #6366F1; padding:14px 18px; border-radius:0 4px 4px 0; }
          .notes-lbl { font-size:8.5px; font-weight:700; letter-spacing:1.5px; color:#6366F1; text-transform:uppercase; margin-bottom:6px; }
          .notes-txt { font-size:12px; color:#475569; line-height:1.75; white-space:pre-line; }

          /* Footer */
          .inv-foot { display:flex; align-items:center; justify-content:space-between; padding:14px 40px; background:#f8fafc; border-top:1px solid #f1f5f9; }
          .foot-left { font-size:10px; font-weight:700; color:#94a3b8; letter-spacing:1px; text-transform:uppercase; }
          .foot-mid { font-size:10px; color:#94a3b8; }
          .foot-right { font-size:10px; color:#94a3b8; font-style:italic; }

          @media print {
            html, body { background:white; padding:0; }
            .sheet { box-shadow:none; max-width:100%; }
            @page { margin:0; size:A4 portrait; }
          }
          @media(max-width:600px){
            body { padding:68px 0 0; }
            .inv-head-inner,.meta-col,.items,.totals,.notes,.inv-foot { padding-left:20px; padding-right:20px; }
            .meta { grid-template-columns:1fr; }
            .meta-col { border-right:none; border-bottom:1px solid #f1f5f9; padding:14px 20px; }
            .tot-wrap { width:100%; }
          }
        `}</style>
      </head>
      <body>
        <PrintBar invNum={invNum} clientName={client?.name ?? 'Invoice'} />

        <div className="sheet">
          {/* Header */}
          <div className="inv-head">
            <div className="stripe" />
            <div className="inv-head-inner">
              <div className="brand">
                <div className="brand-name">DOT IT</div>
                <div className="brand-tagline">Creative Agency</div>
              </div>
              <div className="inv-id-block">
                <div className="inv-id-label">Invoice</div>
                <div className="inv-id-num">{invNum}</div>
                <div className="status-badge">
                  <div className="status-dot" />
                  {st.label}
                </div>
              </div>
            </div>
          </div>

          {/* Meta strip */}
          <div className="meta">
            <div className="meta-col">
              <div className="ml">Bill To</div>
              {client ? (
                <>
                  <div className="mv">{client.name}</div>
                  {client.company && <div className="mv-sm">{client.company}</div>}
                  {client.email   && <div className="mv-sm">{client.email}</div>}
                  {client.phone   && <div className="mv-sm">{client.phone}</div>}
                </>
              ) : <div className="mv-sm">—</div>}
            </div>
            <div className="meta-col">
              <div className="ml">Issued</div>
              <div className="mv">{formatDate(invoice.created_at)}</div>
              {project && <>
                <div className="ml" style={{marginTop:16}}>Project</div>
                <div className="mv">{project.name}</div>
              </>}
            </div>
            <div className="meta-col">
              <div className="ml">Due Date</div>
              <div className={`mv ${invoice.status === 'overdue' ? 'mv-bad' : ''}`}>
                {invoice.due_date ? formatDate(invoice.due_date) : '—'}
              </div>
              {invoice.status === 'paid' && invoice.paid_date && <>
                <div className="ml" style={{marginTop:16}}>Paid On</div>
                <div className="mv mv-ok">{formatDate(invoice.paid_date)}</div>
              </>}
            </div>
          </div>

          {/* Line items */}
          <div className="items">
            <table className="tbl">
              <thead>
                <tr>
                  <th style={{width: items.length ? '50%' : '80%'}}>Description</th>
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
                    <td><div className="td-desc">{item.description}</div></td>
                    <td className="r td-muted">{Number(item.quantity) % 1 === 0 ? Math.floor(item.quantity) : item.quantity}</td>
                    <td className="r td-muted">{fmt(item.unit_price)}</td>
                    <td className="r td-amt">{fmt(item.amount ?? item.quantity * item.unit_price)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td><div className="td-desc">{invoice.title}</div></td>
                    <td className="r td-amt">{fmt(Number(invoice.amount ?? 0))}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="totals">
            <div className="tot-wrap">
              {items.length > 0 && (
                <div className={`tr${(taxRate > 0 || discount > 0) ? ' sep' : ''}`}>
                  <span>Subtotal</span><span>{fmt(subtotal)}</span>
                </div>
              )}
              {taxRate > 0 && <div className="tr"><span>Tax ({taxRate}%)</span><span>{fmt(taxAmt)}</span></div>}
              {discount > 0 && <div className="tr"><span>Discount</span><span className="disc">−{fmt(discount)}</span></div>}
              <div className="tr grand">
                <span>Total Due</span>
                <span>{fmt(total)}</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="notes">
              <div className="notes-lbl">Notes & Payment Instructions</div>
              <div className="notes-txt">{invoice.notes}</div>
            </div>
          )}

          {/* Footer */}
          <div className="inv-foot">
            <div className="foot-left">DOT IT Agency</div>
            <div className="foot-right">Thank you for your business</div>
          </div>
        </div>
      </body>
    </html>
  )
}
