'use client'

import { useRouter } from 'next/navigation'
import { Archive, Trash2 } from 'lucide-react'
import { archiveProject, deleteProject } from '@/app/actions/projects'

interface Props {
  projectId: string
  isArchived: boolean
}

export default function ProjectActions({ projectId, isArchived }: Props) {
  const router = useRouter()

  async function handleArchive() {
    if (!window.confirm(isArchived ? 'Unarchive this project?' : 'Archive this project?')) return
    await archiveProject(projectId)
    router.refresh()
  }

  async function handleDelete() {
    if (!window.confirm('Are you sure you want to permanently delete this project? This cannot be undone.')) return
    await deleteProject(projectId)
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleArchive}
        title={isArchived ? 'Unarchive project' : 'Archive project'}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-100 border border-gray-200 transition-all"
      >
        <Archive size={14} />
        <span className="hidden sm:inline">{isArchived ? 'Unarchive' : 'Archive'}</span>
      </button>
      <button
        onClick={handleDelete}
        title="Delete project"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm text-red-500 hover:text-red-700 hover:bg-red-50 border border-red-200 transition-all"
      >
        <Trash2 size={14} />
        <span className="hidden sm:inline">Delete</span>
      </button>
    </div>
  )
}
