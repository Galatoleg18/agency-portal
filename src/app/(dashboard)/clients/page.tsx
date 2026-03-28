import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Plus, Building2, Mail, Phone, FolderKanban } from 'lucide-react'

export default async function ClientsPage() {
  const supabase = await createClient()

  const { data: clients } = await supabase
    .from('clients')
    .select(`id, name, email, phone, company, projects(count)`)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500 mt-0.5">{clients?.length ?? 0} total</p>
        </div>
        <Link href="/clients/new"
          className="flex items-center gap-2 bg-[#C9A96E] hover:bg-[#b8924d] text-white font-semibold px-4 py-2.5 rounded-lg text-sm transition-colors shadow-sm">
          <Plus size={16} />
          <span className="hidden sm:inline">Add Client</span>
          <span className="sm:hidden">Add</span>
        </Link>
      </div>

      {!clients || clients.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <Building2 size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 mb-4">No clients yet.</p>
          <Link href="/clients/new"
            className="inline-flex items-center gap-2 bg-[#C9A96E] hover:bg-[#b8924d] text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors">
            <Plus size={15} /> Add your first client
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {clients.map((client) => {
            const projectCount = (client.projects as unknown as { count: number }[])?.[0]?.count ?? 0
            return (
              <div key={client.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="font-semibold text-gray-900 text-base truncate">{client.name}</h3>
                    {client.company && (
                      <p className="text-sm text-gray-400 mt-0.5 truncate">{client.company}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#0D1F3C]/5 rounded-lg px-2.5 py-1 flex-shrink-0">
                    <FolderKanban size={13} className="text-[#0D1F3C]" />
                    <span className="text-xs font-semibold text-[#0D1F3C]">{projectCount}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail size={14} className="text-gray-400 flex-shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone size={14} className="text-gray-400 flex-shrink-0" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-4">
                  <Link href={`/projects?client=${client.id}`}
                    className="text-sm text-[#C9A96E] hover:text-[#b8924d] font-medium transition-colors">
                    View projects →
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
