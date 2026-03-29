'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, FolderKanban, Users, FileText, X, Loader2 } from 'lucide-react'
import { statusBadgeClass, statusLabel } from '@/lib/utils'

interface Result {
  type: 'project' | 'client' | 'invoice'
  id: string
  title: string
  subtitle: string
  status?: string
  href: string
}

const typeIcon = { project: FolderKanban, client: Users, invoice: FileText }
const typeLabel = { project: 'Project', client: 'Client', invoice: 'Invoice' }

export default function GlobalSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Result[]>([])
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // CMD+K / CTRL+K to open
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
        setTimeout(() => inputRef.current?.focus(), 50)
      }
      if (e.key === 'Escape') { setOpen(false); setQuery(''); setResults([]) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!query.trim() || query.length < 2) { setResults([]); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setResults(data.results ?? [])
        setSelected(0)
      } finally { setLoading(false) }
    }, 250)
  }, [query])

  function navigate(href: string) {
    setOpen(false); setQuery(''); setResults([])
    router.push(href)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, results.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)) }
    if (e.key === 'Enter' && results[selected]) navigate(results[selected].href)
  }

  if (!open) return (
    <button onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50) }}
      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 bg-gray-50 border border-gray-200 rounded-xl hover:border-gray-300 transition-all w-48 sm:w-64">
      <Search size={14} />
      <span className="flex-1 text-left">Search…</span>
      <kbd className="text-xs bg-white border border-gray-200 rounded px-1.5 py-0.5 font-mono hidden sm:block">⌘K</kbd>
    </button>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => { setOpen(false); setQuery(''); setResults([]) }} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-100">
          {loading ? <Loader2 size={18} className="text-gray-400 animate-spin flex-shrink-0" /> : <Search size={18} className="text-gray-400 flex-shrink-0" />}
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search projects, clients, invoices…"
            className="flex-1 text-sm text-gray-900 placeholder-gray-400 focus:outline-none bg-transparent"
            autoComplete="off"
          />
          {query && (
            <button onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus() }} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          )}
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="max-h-80 overflow-y-auto">
            {results.map((r, idx) => {
              const Icon = typeIcon[r.type]
              return (
                <button key={r.id} onClick={() => navigate(r.href)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${idx === selected ? 'bg-[#6366F1]/5' : 'hover:bg-gray-50'}`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                    ${r.type === 'project' ? 'bg-sky-50' : r.type === 'client' ? 'bg-violet-50' : 'bg-amber-50'}`}>
                    <Icon size={15} className={r.type === 'project' ? 'text-sky-500' : r.type === 'client' ? 'text-violet-500' : 'text-amber-500'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{r.title}</p>
                    <p className="text-xs text-gray-400 truncate">{typeLabel[r.type]} · {r.subtitle}</p>
                  </div>
                  {r.status && (
                    <span className={`text-xs font-semibold rounded-full px-2 py-0.5 flex-shrink-0 ${statusBadgeClass(r.status)}`}>
                      {statusLabel(r.status)}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        )}

        {query.length >= 2 && !loading && results.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-gray-400">No results for "{query}"</div>
        )}

        {!query && (
          <div className="px-4 py-4 text-xs text-gray-400 flex items-center justify-between">
            <span>Type to search</span>
            <span className="flex items-center gap-2">
              <kbd className="bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 font-mono">↑↓</kbd> navigate
              <kbd className="bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 font-mono">↵</kbd> open
              <kbd className="bg-gray-50 border border-gray-200 rounded px-1.5 py-0.5 font-mono">esc</kbd> close
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
