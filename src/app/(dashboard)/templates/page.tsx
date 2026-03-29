import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, LayoutTemplate, ChevronRight } from 'lucide-react'

export default async function TemplatesPage() {
  const supabase = await createClient()
  const { data: templates } = await supabase
    .from('project_templates')
    .select(`id, name, description, created_at, template_phases(id, name, template_tasks(id))`)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Templates</h1>
          <p className="text-sm text-gray-400 mt-0.5">Reusable phase/task structures for new projects.</p>
        </div>
        <Link href="/templates/new"
          className="inline-flex items-center gap-2 bg-[#6366F1] hover:bg-[#4f46e5] text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm">
          <Plus size={16} />
          <span className="hidden sm:inline">New Template</span>
          <span className="sm:hidden">New</span>
        </Link>
      </div>

      {!templates?.length ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-14 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <LayoutTemplate size={28} className="text-gray-300" />
          </div>
          <p className="font-semibold text-gray-700 mb-1">No templates yet</p>
          <p className="text-gray-400 text-sm mb-6">Create a template to quickly scaffold new projects.</p>
          <Link href="/templates/new"
            className="inline-flex items-center gap-2 bg-[#6366F1] hover:bg-[#4f46e5] text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all">
            <Plus size={15} /> Create Template
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map(t => {
            const phases = (t.template_phases as { id: string; name: string; template_tasks: { id: string }[] }[]) ?? []
            const taskCount = phases.reduce((s, p) => s + (p.template_tasks?.length ?? 0), 0)
            return (
              <div key={t.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-1">
                      <LayoutTemplate size={16} className="text-[#6366F1] flex-shrink-0" />
                      <h3 className="font-semibold text-gray-900">{t.name}</h3>
                    </div>
                    {t.description && <p className="text-sm text-gray-400 mb-3">{t.description}</p>}
                    <div className="flex flex-wrap gap-2">
                      {phases.map(p => (
                        <span key={p.id} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                          {p.name} ({p.template_tasks?.length ?? 0})
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">{phases.length} phases · {taskCount} tasks</p>
                  </div>
                  <Link href={`/projects/new?template=${t.id}`}
                    className="flex-shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-[#6366F1] hover:text-[#4f46e5] transition-colors">
                    Use <ChevronRight size={14} />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
