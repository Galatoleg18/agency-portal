'use client'

import { useState } from 'react'
import { Share2, Check, Copy } from 'lucide-react'

export default function ShareStatusButton({ projectId }: { projectId: string }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    const url = `${window.location.origin}/status/${projectId}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button onClick={copy}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-[#6366F1] transition-colors border border-gray-200 hover:border-[#6366F1]/30 rounded-lg px-3 py-1.5">
      {copied ? <><Check size={12} className="text-green-500" /> Copied!</> : <><Share2 size={12} /> Share Status</>}
    </button>
  )
}
