'use client'

import { useState } from 'react'
import { Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

export default function InviteButton({ email, name }: { email: string; name: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

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
        setState('done')
      }
    } catch {
      setErrorMsg('Network error')
      setState('error')
    }
  }

  if (state === 'done') return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-600">
      <CheckCircle2 size={13} /> Invite sent!
    </span>
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
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C9A96E] hover:text-[#b8924d] transition-colors disabled:opacity-50"
    >
      {state === 'loading'
        ? <><Loader2 size={13} className="animate-spin" /> Sending…</>
        : <><Mail size={13} /> Send Invite</>
      }
    </button>
  )
}
