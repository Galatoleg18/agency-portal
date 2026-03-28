import { createClient } from '@/lib/supabase/server'
import { User, Shield, Bell, Palette } from 'lucide-react'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user?.id ?? '').single()

  return (
    <div className="max-w-2xl">
      <div className="mb-7">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-400 mt-0.5">Manage your account and preferences.</p>
      </div>

      <div className="space-y-5">
        {/* Profile */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-xl bg-[#C9A96E]/10 flex items-center justify-center">
              <User size={16} className="text-[#C9A96E]" />
            </div>
            <h2 className="font-bold text-gray-900">Profile</h2>
          </div>

          <div className="flex items-center gap-4 mb-5">
            <div className="w-14 h-14 rounded-2xl bg-[#0D1F3C] flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              {(profile?.full_name ?? user?.email ?? '?')[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{profile?.full_name ?? 'No name set'}</p>
              <p className="text-sm text-gray-400">{user?.email}</p>
              <span className="inline-block mt-1 text-xs font-semibold bg-[#0D1F3C]/5 text-[#0D1F3C] px-2 py-0.5 rounded-full capitalize">
                {profile?.role ?? 'client'}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Full Name</label>
                <div className="px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 bg-gray-50">
                  {profile?.full_name ?? '—'}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Email</label>
                <div className="px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 bg-gray-50">
                  {user?.email}
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400">To update your profile, contact your administrator.</p>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
              <Shield size={16} className="text-blue-500" />
            </div>
            <h2 className="font-bold text-gray-900">Security</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-gray-50">
              <div>
                <p className="text-sm font-medium text-gray-700">Password</p>
                <p className="text-xs text-gray-400 mt-0.5">Last changed: unknown</p>
              </div>
              <button className="text-sm font-semibold text-[#C9A96E] hover:text-[#b8924d] transition-colors">
                Change →
              </button>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-gray-700">Account ID</p>
                <p className="text-xs text-gray-400 font-mono mt-0.5">{user?.id?.slice(0, 16)}…</p>
              </div>
            </div>
          </div>
        </div>

        {/* Portal info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 rounded-xl bg-[#C9A96E]/10 flex items-center justify-center">
              <Palette size={16} className="text-[#C9A96E]" />
            </div>
            <h2 className="font-bold text-gray-900">Portal</h2>
          </div>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-400">Version</span>
              <span className="font-medium">1.0.0</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-50">
              <span className="text-gray-400">Agency</span>
              <span className="font-medium">DOT IT</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-400">Support</span>
              <a href="mailto:ask.dot.it@gmail.com" className="font-medium text-[#C9A96E] hover:underline">ask.dot.it@gmail.com</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
