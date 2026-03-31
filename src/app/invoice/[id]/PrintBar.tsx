'use client'

export default function PrintBar({ invNum, clientName }: { invNum: string; clientName: string }) {
  return (
    <div style={{
      position:'fixed',top:0,left:0,right:0,background:'white',
      borderBottom:'1px solid #e2e8f0',padding:'12px 24px',
      display:'flex',alignItems:'center',justifyContent:'space-between',
      zIndex:100,boxShadow:'0 2px 8px rgba(0,0,0,.06)'
    }}>
      <span style={{fontSize:'13px',fontWeight:600,color:'#0f172a'}}>
        {invNum} — {clientName}
      </span>
      <div style={{display:'flex',gap:'8px'}}>
        <button
          onClick={() => window.print()}
          style={{background:'#6366F1',color:'white',border:'none',padding:'9px 20px',borderRadius:'9px',fontWeight:700,fontSize:'13px',cursor:'pointer'}}
        >
          ⬇ Download PDF
        </button>
        <button
          onClick={() => window.history.back()}
          style={{background:'#f1f5f9',color:'#475569',border:'none',padding:'9px 16px',borderRadius:'9px',fontWeight:600,fontSize:'13px',cursor:'pointer'}}
        >
          ← Back
        </button>
      </div>
    </div>
  )
}
