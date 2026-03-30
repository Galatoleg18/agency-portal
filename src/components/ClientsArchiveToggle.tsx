'use client'

import { useRouter } from 'next/navigation'
import { Archive, ArchiveRestore } from 'lucide-react'

interface Props {
  showArchived: boolean
  archivedCount: number
}

export default function ClientsArchiveToggle({ showArchived, archivedCount }: Props) {
  const router = useRouter()

  function toggle() {
    router.push(showArchived ? '/clients' : '/clients?showArchived=1')
  }

  return (
    <button
      onClick={toggle}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm border transition-all ${
        showArchived
          ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
          : 'border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50'
      }`}
    >
      {showArchived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
      <span className="hidden sm:inline">
        {showArchived ? 'Active clients' : `Archived (${archivedCount})`}
      </span>
    </button>
  )
}
