import { createClient } from '@/lib/supabase/server'

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role, avatar_url')
    .eq('id', user?.id ?? '')
    .single()

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>

      <div className="max-w-lg space-y-5">
        {/* Account info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">
            Account Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Email
              </label>
              <p className="text-sm text-gray-900">{user?.email}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Name
              </label>
              <p className="text-sm text-gray-900">
                {profile?.full_name ?? '—'}
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                Role
              </label>
              <span className="inline-block rounded-full px-3 py-1 text-xs font-semibold bg-[#0D1F3C]/10 text-[#0D1F3C] capitalize">
                {profile?.role ?? 'client'}
              </span>
            </div>
          </div>
        </div>

        {/* Portal info */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            About DOT IT Portal
          </h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            This portal is your window into every project we&apos;re running for
            you. Track progress, review deliverables, and stay in the loop —
            without ever needing to ask for an update.
          </p>
          <p className="text-xs text-gray-400 mt-4">
            © {new Date().getFullYear()} DOT IT Agency
          </p>
        </div>
      </div>
    </div>
  )
}
