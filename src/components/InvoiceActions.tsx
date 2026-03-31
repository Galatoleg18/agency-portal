'use client'

import { useState } from 'react'
import { Archive, ArchiveRestore, Trash2 } from 'lucide-react'
import { archiveInvoice, unarchiveInvoice, deleteInvoice } from '@/app/actions/invoices'

export default function InvoiceActions({ id, isArchived }: { id: string; isArchived: boolean }) {
  const [loading, setLoading] = useState<string | null>(null)

  async function handleArchive() {
    setLoading('archive')
    if (isArchived) await unarchiveInvoice(id)
    else await archiveInvoice(id)
    setLoading(null)
  }

  async function handleDelete() {
    if (!confirm('Delete this invoice permanently? This cannot be undone.')) return
    setLoading('delete')
    await deleteInvoice(id)
    setLoading(null)
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={handleArchive}
        disabled={!!loading}
        title={isArchived ? 'Restore invoice' : 'Archive invoice'}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-amber-500 hover:bg-amber-50 transition-all disabled:opacity-40"
      >
        {loading === 'archive'
          ? <span className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
          : isArchived ? <ArchiveRestore size={13} /> : <Archive size={13} />}
      </button>
      <button
        onClick={handleDelete}
        disabled={!!loading}
        title="Delete invoice"
        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-40"
      >
        {loading === 'delete'
          ? <span className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
          : <Trash2 size={13} />}
      </button>
    </div>
  )
}
