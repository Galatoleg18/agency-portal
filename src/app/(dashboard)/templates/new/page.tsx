'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Plus, X, GripVertical } from 'lucide-react'
import Link from 'next/link'

interface TaskDraft { id: string; title: string }
interface PhaseDraft { id: string; name: string; tasks: TaskDraft[] }

export default function NewTemplatePage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [phases, setPhases] = useState<PhaseDraft[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function addPhase() {
    setPhases(p => [...p, { id: crypto.randomUUID(), name: '', tasks: [] }])
  }

  function removePhase(id: string) {
    setPhases(p => p.filter(ph => ph.id !== id))
  }

  function updatePhase(id: string, name: string) {
    setPhases(p => p.map(ph => ph.id === id ? { ...ph, name } : ph))
  }

  function addTask(phaseId: string) {
    setPhases(p => p.map(ph => ph.id === phaseId
      ? { ...ph, tasks: [...ph.tasks, { id: crypto.randomUUID(), title: '' }] }
      : ph))
  }

  function removeTask(phaseId: string, taskId: string) {
    setPhases(p => p.map(ph => ph.id === phaseId
      ? { ...ph, tasks: ph.tasks.filter(t => t.id !== taskId) }
      : ph))
  }

  function updateTask(phaseId: string, taskId: string, title: string) {
    setPhases(p => p.map(ph => ph.id === phaseId
      ? { ...ph, tasks: ph.tasks.map(t => t.id === taskId ? { ...t, title } : t) }
      : ph))
  }

  async function handleSave() {
    if (!name.trim()) { setError('Template name is required.'); return }
    if (phases.some(p => !p.name.trim())) { setError('All phases need a name.'); return }
    setLoading(true)
    setError(null)
    const supabase = createClient()

    const { data: tmpl, error: e1 } = await supabase
      .from('project_templates').insert({ name: name.trim(), description: description.trim() || null })
      .select().single()
    if (e1 || !tmpl) { setError(e1?.message ?? 'Failed to create template'); setLoading(false); return }

    for (let i = 0; i < phases.length; i++) {
      const ph = phases[i]
      const { data: tPhase } = await supabase
        .from('template_phases').insert({ template_id: tmpl.id, name: ph.name.trim(), sort_order: i })
        .select().single()
      if (tPhase && ph.tasks.length > 0) {
        await supabase.from('template_tasks').insert(
          ph.tasks.filter(t => t.title.trim()).map((t, j) => ({
            template_phase_id: tPhase.id, title: t.title.trim(), sort_order: j
          }))
        )
      }
    }

    router.push('/templates')
  }

  const inputCls = "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent transition-all"

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-7">
        <Link href="/templates" className="w-8 h-8 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-all">
          <ArrowLeft size={16} />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Template</h1>
      </div>

      <div className="space-y-5">
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Template Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} className={inputCls} placeholder="e.g. Standard Website Project" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
              className={`${inputCls} resize-none`} placeholder="What kind of project is this for?" />
          </div>
        </div>

        {/* Phases */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Phases & Tasks</h2>
            <button onClick={addPhase}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#C9A96E] hover:text-[#b8924d] transition-colors">
              <Plus size={15} /> Add Phase
            </button>
          </div>

          {phases.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-8 text-center">
              <p className="text-gray-400 text-sm mb-3">No phases yet.</p>
              <button onClick={addPhase} className="text-sm font-semibold text-[#C9A96E] hover:text-[#b8924d]">
                + Add your first phase
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {phases.map((phase, idx) => (
                <div key={phase.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-[#0D1F3C]/5 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-[#0D1F3C]/40">{idx + 1}</span>
                    </div>
                    <input value={phase.name} onChange={e => updatePhase(phase.id, e.target.value)}
                      className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A96E] font-medium"
                      placeholder="Phase name, e.g. Discovery" />
                    <button onClick={() => removePhase(phase.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                      <X size={16} />
                    </button>
                  </div>

                  <div className="ml-8 space-y-1.5">
                    {phase.tasks.map(task => (
                      <div key={task.id} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                        <input value={task.title} onChange={e => updateTask(phase.id, task.id, e.target.value)}
                          className="flex-1 px-3 py-1.5 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A96E] bg-gray-50"
                          placeholder="Task name" />
                        <button onClick={() => removeTask(phase.id, task.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                    <button onClick={() => addTask(phase.id)}
                      className="text-xs text-gray-400 hover:text-[#C9A96E] transition-colors flex items-center gap-1 mt-1">
                      <Plus size={12} /> Add task
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>}

        <div className="flex gap-3">
          <button onClick={handleSave} disabled={loading}
            className="flex-1 bg-[#C9A96E] hover:bg-[#b8924d] text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50">
            {loading ? 'Saving…' : 'Save Template'}
          </button>
          <Link href="/templates" className="px-5 py-3 border border-gray-200 rounded-xl text-sm text-gray-500 hover:bg-gray-50 font-medium">
            Cancel
          </Link>
        </div>
      </div>
    </div>
  )
}
