import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Plus, Building2, Mail, Phone, FolderKanban } from 'lucide-react'
import InviteButton from '@/components/InviteButton'

export default async function ClientsPage() {
  const supabase = await createClient()

  const { data: clients } = await supabase
    .from('clients')
    .select(`id, name, email, phone, company, notes, projects(count)`)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-400 mt-0.5">{clients?.length ?? 0} total</p>
        </div>
        <Link href="/clients/new"
          className="flex items-center gap-2 bg-[#C9A96E] hover:bg-[#b8924d] text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all shadow-sm hover:shadow-md">
          <Plus size={16} />
          <span className="hidden sm:inline">Add Client</span>
          <span className="sm:hidden">Add</span>
        </Link>
      </div>

      {!clients?.length ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 size={28} className="text-gray-300" />
          </div>
          <p className="font-semibold text-gray-700 mb-1">No clients yet</p>
          <p className="text-gray-400 text-sm mb-6">Add your first client to get started.</p>
          <Link href="/clients/new"
            className="inline-flex items-center gap-2 bg-[#C9A96E] hover:bg-[#b8924d] text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all">
            <Plus size={15} /> Add Client
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {clients.map((client) => {
            const projectCount = (client.projects as unknown as { count: number }[])?.[0]?.count ?? 0
            return (
              <div key={client.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-all hover:-translate-y-0.5">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0 pr-2">
                    <h3 className="font-bold text-gray-900 truncate">{client.name}</h3>
                    {client.company && <p className="text-sm text-gray-400 mt-0.5 truncate">{client.company}</p>}
                  </div>
                  <div className="flex items-center gap-1.5 bg-[#0D1F3C]/5 rounded-xl px-2.5 py-1 flex-shrink-0">
                    <FolderKanban size={13} className="text-[#0D1F3C]/50" />
                    <span className="text-xs font-bold text-[#0D1F3C]/60">{projectCount}</span>
                  </div>
                </div>

                {/* Contact */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail size={13} className="text-gray-300 flex-shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone size={13} className="text-gray-300 flex-shrink-0" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.notes && (
                    <p className="text-xs text-gray-400 bg-gray-50 rounded-xl px-3 py-2 mt-2">{client.notes}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-gray-50 flex items-center justify-between">
                  <Link href={`/projects?client=${client.id}`}
                    className="text-sm text-[#C9A96E] hover:text-[#b8924d] font-semibold transition-colors">
                    View projects →
                  </Link>
                  <InviteButton email={client.email} name={client.name} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
