'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MoreVertical, Pencil, Archive, ArchiveRestore, Trash2 } from 'lucide-react'
import { archiveClient, unarchiveClient, deleteClient } from '@/app/actions/clients'

interface Props {
  clientId: string
  isArchived: boolean
}

export default function ClientCardMenu({ clientId, isArchived }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function handleArchive() {
    setOpen(false)
    if (isArchived) {
      await unarchiveClient(clientId)
    } else {
      await archiveClient(clientId)
    }
    router.refresh()
  }

  async function handleDelete() {
    setOpen(false)
    if (!window.confirm('Are you sure you want to permanently delete this client? This cannot be undone.')) return
    await deleteClient(clientId)
    router.refresh()
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { e.preventDefault(); setOpen(v => !v) }}
        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
        aria-label="Client options"
      >
        <MoreVertical size={15} />
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-50 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 text-sm">
          <button
            onClick={(e) => { e.preventDefault(); setOpen(false); router.push(`/clients/${clientId}/edit`) }}
            className="flex items-center gap-2.5 w-full px-3.5 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Pencil size={14} className="text-gray-400" />
            Edit
          </button>
          <button
            onClick={(e) => { e.preventDefault(); handleArchive() }}
            className="flex items-center gap-2.5 w-full px-3.5 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {isArchived
              ? <><ArchiveRestore size={14} className="text-gray-400" />Unarchive</>
              : <><Archive size={14} className="text-gray-400" />Archive</>
            }
          </button>
          <div className="border-t border-gray-100 my-1" />
          <button
            onClick={(e) => { e.preventDefault(); handleDelete() }}
            className="flex items-center gap-2.5 w-full px-3.5 py-2 text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} className="text-red-400" />
            Delete
          </button>
        </div>
      )}
    </div>
  )
}
