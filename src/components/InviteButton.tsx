'use client'

import { useState } from 'react'
import { Mail, CheckCircle2, AlertCircle, Loader2, RefreshCw } from 'lucide-react'

export default function InviteButton({ email, name }: { email: string; name: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [type, setType] = useState<'invite' | 'reset' | null>(null)

  async function sendInvite() {
    setState('loading')
    try {
      const res = await fetch('/api/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrorMsg(data.error ?? 'Failed to send invite')
        setState('error')
      } else {
        setType(data.type)
        setState('done')
      }
    } catch {
      setErrorMsg('Network error')
      setState('error')
    }
  }

  if (state === 'done') return (
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-600">
        <CheckCircle2 size={13} />
        {type === 'reset' ? 'Reset email sent!' : 'Invite sent!'}
      </span>
      <button onClick={() => setState('idle')} className="text-xs text-gray-400 hover:text-gray-600 underline">resend</button>
    </div>
  )

  if (state === 'error') return (
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center gap-1 text-xs text-red-500">
        <AlertCircle size={12} /> {errorMsg}
      </span>
      <button onClick={() => setState('idle')} className="text-xs text-gray-400 hover:text-gray-600 underline">retry</button>
    </div>
  )

  return (
    <button
      onClick={sendInvite}
      disabled={state === 'loading'}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#6366F1] hover:text-[#4f46e5] transition-colors disabled:opacity-50"
    >
      {state === 'loading'
        ? <><Loader2 size={13} className="animate-spin" /> Sending…</>
        : <><Mail size={13} /> Send Invite</>
      }
    </button>
  )
}
