import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import PrintBar from './PrintBar'

interface PageProps { params: Promise<{ id: string }> }

export default async function InvoicePDFPage({ params }: PageProps) {
  const { id } = await params

  // Use service role / anon key — invoice is public by ID (no login required)
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

  // Recalculate totals from line items if available
  const subtotal = items.length
    ? items.reduce((s: number, it: any) => s + (it.amount ?? (it.quantity * it.unit_price)), 0)
    : (invoice.amount ?? 0)
  const taxRate = (invoice as any).tax_rate ?? 0
  const discount = (invoice as any).discount ?? 0
  const taxAmt = subtotal * (taxRate / 100)
  const total = items.length ? subtotal + taxAmt - discount : (invoice.amount ?? 0)

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  const statusColors: Record<string, { bg: string; color: string }> = {
    paid:    { bg: '#d1fae5', color: '#065f46' },
    unpaid:  { bg: '#fef3c7', color: '#92400e' },
    overdue: { bg: '#fee2e2', color: '#991b1b' },
  }
  const statusStyle = statusColors[invoice.status] ?? { bg: '#f1f5f9', color: '#475569' }

  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{invNum} — {client?.name ?? 'Invoice'}</title>
        <style>{`
          * { margin:0; padding:0; box-sizing:border-box; }
          body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; color:#0f172a; background:#f8fafc; }
          .wrap { background:white; max-width:780px; margin:32px auto; padding:60px; border-radius:16px; box-shadow:0 4px 32px rgba(0,0,0,.06); }
          /* Header */
          .hdr { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:52px; }
          .brand { display:flex; flex-direction:column; gap:6px; }
          .brand-name { font-size:26px; font-weight:900; letter-spacing:-0.5px; color:#0f172a; }
          .brand-bar { width:28px; height:3px; background:#6366F1; border-radius:2px; }
          .inv-meta { text-align:right; }
          .inv-number { font-size:28px; font-weight:900; letter-spacing:-1px; color:#0f172a; }
          .inv-status { display:inline-block; margin-top:8px; padding:4px 14px; border-radius:20px; font-size:11px; font-weight:700; letter-spacing:0.5px; text-transform:uppercase; background:${statusStyle.bg}; color:${statusStyle.color}; }
          /* Bill/Date grid */
          .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:40px; margin-bottom:44px; }
          .info-label { font-size:9px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px; }
          .info-val { font-size:14px; color:#0f172a; font-weight:500; line-height:1.6; }
          .info-val.sm { font-size:12px; color:#475569; }
          .date-grid { display:grid; grid-template-columns:1fr 1fr; gap:20px; }
          /* Divider */
          hr { border:none; border-top:1px solid #e2e8f0; margin:0; }
          /* Table */
          table { width:100%; border-collapse:collapse; margin:28px 0; }
          thead th { font-size:9px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:1px; padding:0 0 12px; border-bottom:1px solid #e2e8f0; text-align:left; }
          thead th.r { text-align:right; }
          tbody td { padding:14px 0; border-bottom:1px solid #f1f5f9; font-size:13px; color:#334155; vertical-align:top; }
          tbody td.r { text-align:right; font-weight:600; color:#0f172a; }
          tbody td.sm { font-size:11px; color:#94a3b8; margin-top:2px; }
          tbody tr:last-child td { border-bottom:none; }
          /* Totals */
          .totals { display:flex; flex-direction:column; align-items:flex-end; gap:6px; margin-top:8px; }
          .tot-row { display:flex; gap:60px; font-size:13px; color:#64748b; }
          .tot-row span:last-child { min-width:90px; text-align:right; }
          .tot-grand { font-size:20px; font-weight:800; color:#0f172a; padding-top:14px; margin-top:8px; border-top:2px solid #0f172a; }
          /* Notes */
          .notes { background:#f8fafc; border-radius:10px; padding:18px 20px; margin-top:32px; }
          .notes-label { font-size:9px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px; }
          .notes-text { font-size:12px; color:#475569; line-height:1.7; }
          /* Footer */
          .footer { margin-top:52px; padding-top:20px; border-top:1px solid #e2e8f0; display:flex; justify-content:space-between; font-size:11px; color:#94a3b8; }
          body { padding-top:60px; }
          @media print {
            body { background:white; padding-top:0; }
            .wrap { margin:0; padding:40px; border-radius:0; box-shadow:none; }
            * { print-color-adjust:exact; -webkit-print-color-adjust:exact; }
            @page { margin:0; size:A4; }
          }
        `}</style>
      </head>
      <body>
        {/* Print bar — client component for onClick handlers */}
        <PrintBar invNum={invNum} clientName={client?.name ?? 'Invoice'} />

        <div className="wrap">

          {/* Header */}
          <div className="hdr">
            <div className="brand">
              <div className="brand-name">DOT IT</div>
              <div className="brand-bar" />
            </div>
            <div className="inv-meta">
              <div className="inv-number">{invNum}</div>
              <div className="inv-status">{invoice.status}</div>
            </div>
          </div>

          {/* Bill to + dates */}
          <div className="info-grid">
            <div>
              <div className="info-label">Bill To</div>
              <div className="info-val">{client?.name ?? '—'}</div>
              {client?.company && <div className="info-val sm">{client.company}</div>}
              {client?.email  && <div className="info-val sm">{client.email}</div>}
              {client?.phone  && <div className="info-val sm">{client.phone}</div>}
            </div>
            <div>
              <div className="date-grid">
                <div>
                  <div className="info-label">Issue Date</div>
                  <div className="info-val">{formatDate(invoice.created_at)}</div>
                </div>
                <div>
                  <div className="info-label">Due Date</div>
                  <div className="info-val" style={invoice.status === 'overdue' ? {color:'#dc2626'} : {}}>{formatDate(invoice.due_date)}</div>
                </div>
                {project && (
                  <div style={{gridColumn:'1/-1'}}>
                    <div className="info-label">Project</div>
                    <div className="info-val">{project.name}</div>
                  </div>
                )}
                {invoice.status === 'paid' && invoice.paid_date && (
                  <div style={{gridColumn:'1/-1'}}>
                    <div className="info-label">Paid On</div>
                    <div className="info-val" style={{color:'#059669'}}>{formatDate(invoice.paid_date)}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <hr />

          {/* Line items table */}
          <table>
            <thead>
              <tr>
                <th style={{width: items.length > 0 ? '50%' : '80%'}}>Description</th>
                {items.length > 0 && <>
                  <th className="r" style={{width:'12%'}}>Qty</th>
                  <th className="r" style={{width:'18%'}}>Unit Price</th>
                </>}
                <th className="r" style={{width: items.length > 0 ? '18%' : '20%'}}>Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? items.map((item: any) => (
                <tr key={item.id}>
                  <td><div style={{fontWeight:500,color:'#0f172a'}}>{item.description}</div></td>
                  <td className="r">{Number(item.quantity) % 1 === 0 ? Math.floor(item.quantity) : item.quantity}</td>
                  <td className="r">{fmt(item.unit_price)}</td>
                  <td className="r">{fmt(item.amount ?? item.quantity * item.unit_price)}</td>
                </tr>
              )) : (
                <tr>
                  <td><div style={{fontWeight:500,color:'#0f172a'}}>{invoice.title}</div></td>
                  <td className="r">{fmt(invoice.amount ?? 0)}</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Totals */}
          <div className="totals">
            {items.length > 0 && (
              <div className="tot-row">
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
              <div className="tot-row" style={{color:'#dc2626'}}>
                <span>Discount</span>
                <span>−{fmt(discount)}</span>
              </div>
            )}
            <div className="tot-row tot-grand">
              <span>Total Due</span>
              <span>{fmt(total)}</span>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="notes">
              <div className="notes-label">Notes</div>
              <div className="notes-text">{invoice.notes}</div>
            </div>
          )}

          {/* Footer */}
          <div className="footer">
            <span>DOT IT Agency · ask.dot.it@gmail.com</span>
            <span>Thank you for your business</span>
          </div>

        </div>
      </body>
    </html>
  )
}
