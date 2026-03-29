import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { formatCurrency, formatDate } from '@/lib/utils'

interface PageProps { params: Promise<{ id: string }> }

export default async function InvoicePDFPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: invoice } = await supabase
    .from('invoices')
    .select(`id, title, amount, status, due_date, paid_date, notes, invoice_number, created_at,
      clients(name, email, company, phone),
      projects(name)`)
    .eq('id', id).single()

  if (!invoice) notFound()

  const client = (invoice.clients as any)?.[0] ?? null
  const project = (invoice.projects as any)?.[0] ?? null
  const invNum = (invoice as any).invoice_number ?? `INV-${id.slice(0, 8).toUpperCase()}`

  return (
    <html>
      <head>
        <title>{invNum} — {client?.name}</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a; background: white; }
          .page { max-width: 800px; margin: 0 auto; padding: 60px 60px; min-height: 100vh; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 60px; }
          .logo { font-size: 28px; font-weight: 900; letter-spacing: -0.5px; color: #0f172a; }
          .logo-bar { width: 32px; height: 3px; background: #6366F1; border-radius: 2px; margin-top: 6px; }
          .invoice-badge { background: #6366F1; color: white; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 700; letter-spacing: 0.5px; }
          .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 50px; }
          .meta-label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
          .meta-value { font-size: 15px; color: #0f172a; font-weight: 500; line-height: 1.5; }
          .meta-value.small { font-size: 13px; color: #475569; }
          .divider { border: none; border-top: 1px solid #e2e8f0; margin: 30px 0; }
          .line-items { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .line-items th { text-align: left; font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; padding: 0 0 12px; border-bottom: 1px solid #e2e8f0; }
          .line-items th:last-child { text-align: right; }
          .line-items td { padding: 16px 0; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: #334155; vertical-align: top; }
          .line-items td:last-child { text-align: right; font-weight: 600; }
          .totals { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; margin-top: 16px; }
          .total-row { display: flex; gap: 40px; font-size: 14px; color: #64748b; }
          .total-row.grand { font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 8px; padding-top: 16px; border-top: 2px solid #0f172a; }
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; }
          .status-paid { background: #d1fae5; color: #065f46; }
          .status-unpaid { background: #fef3c7; color: #92400e; }
          .status-overdue { background: #fee2e2; color: #991b1b; }
          .notes-box { background: #f8fafc; border-radius: 12px; padding: 20px; margin-top: 30px; }
          .notes-title { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
          .notes-text { font-size: 13px; color: #475569; line-height: 1.6; }
          .footer { margin-top: 60px; padding-top: 24px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; font-size: 12px; color: #94a3b8; }
          @media print {
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            .no-print { display: none !important; }
            .page { padding: 40px; }
          }
        `}</style>
      </head>
      <body>
        {/* Print button — hidden when printing */}
        <div className="no-print" style={{position:'fixed',top:'20px',right:'20px',zIndex:100,display:'flex',gap:'8px'}}>
          <button onClick={() => window.print()}
            style={{background:'#6366F1',color:'white',border:'none',padding:'10px 20px',borderRadius:'10px',fontWeight:700,fontSize:'14px',cursor:'pointer'}}>
            Download PDF
          </button>
          <button onClick={() => window.close()}
            style={{background:'#f1f5f9',color:'#475569',border:'none',padding:'10px 20px',borderRadius:'10px',fontWeight:700,fontSize:'14px',cursor:'pointer'}}>
            Close
          </button>
        </div>

        <div className="page">
          {/* Header */}
          <div className="header">
            <div>
              <div className="logo">DOT IT</div>
              <div className="logo-bar" />
            </div>
            <div style={{textAlign:'right'}}>
              <div style={{fontSize:'32px',fontWeight:900,color:'#0f172a',letterSpacing:'-1px'}}>{invNum}</div>
              <div style={{marginTop:'8px'}}>
                <span className={`status-badge status-${invoice.status}`}>
                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Meta */}
          <div className="meta">
            <div>
              <div className="meta-label">Bill To</div>
              <div className="meta-value">{client?.name ?? '—'}</div>
              {client?.company && <div className="meta-value small">{client.company}</div>}
              {client?.email && <div className="meta-value small">{client.email}</div>}
              {client?.phone && <div className="meta-value small">{client.phone}</div>}
            </div>
            <div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px'}}>
                <div>
                  <div className="meta-label">Issue Date</div>
                  <div className="meta-value">{formatDate(invoice.created_at)}</div>
                </div>
                <div>
                  <div className="meta-label">Due Date</div>
                  <div className="meta-value" style={invoice.status==='overdue'?{color:'#dc2626'}:{}}>{formatDate(invoice.due_date)}</div>
                </div>
                {project && (
                  <div style={{gridColumn:'1/-1'}}>
                    <div className="meta-label">Project</div>
                    <div className="meta-value">{project.name}</div>
                  </div>
                )}
                {invoice.status === 'paid' && invoice.paid_date && (
                  <div style={{gridColumn:'1/-1'}}>
                    <div className="meta-label">Paid On</div>
                    <div className="meta-value" style={{color:'#059669'}}>{formatDate(invoice.paid_date)}</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <hr className="divider" />

          {/* Line items */}
          <table className="line-items">
            <thead>
              <tr>
                <th>Description</th>
                <th style={{textAlign:'right'}}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <div style={{fontWeight:600,color:'#0f172a',marginBottom:'4px'}}>{invoice.title}</div>
                  {project && <div style={{fontSize:'12px',color:'#94a3b8'}}>Project: {project.name}</div>}
                </td>
                <td>{formatCurrency(invoice.amount)}</td>
              </tr>
            </tbody>
          </table>

          {/* Totals */}
          <div className="totals">
            <div className="total-row grand">
              <span>Total Due</span>
              <span>{formatCurrency(invoice.amount)}</span>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="notes-box">
              <div className="notes-title">Notes</div>
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
