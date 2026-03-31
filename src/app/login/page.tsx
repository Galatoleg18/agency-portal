'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resetMode, setResetMode] = useState(false)
  const [resetSent, setResetSent] = useState(false)

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (!email) { setError('Enter your email address first.'); return }
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    setResetSent(true)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Invalid email or password.'); setLoading(false); return }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#F5F6FA] flex items-center justify-center p-4">
      {/* Subtle grid bg */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:40px_40px] opacity-40" />

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-block">
            <span className="text-4xl font-black text-[#0F172A] tracking-tight">DOT IT</span>
            <div className="h-0.5 bg-[#6366F1] rounded-full mt-1.5" />
          </div>
          <p className="text-gray-400 text-sm mt-3">Sign in to your portal</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl p-8 shadow-xl border border-gray-100">
          {resetSent ? (
            <div className="text-center py-4">
              <CheckCircle2 size={40} className="text-emerald-500 mx-auto mb-3" />
              <p className="font-semibold text-gray-800 mb-1">Check your inbox</p>
              <p className="text-sm text-gray-400 mb-5">We sent a password reset link to <strong>{email}</strong></p>
              <button onClick={() => { setResetSent(false); setResetMode(false) }}
                className="text-sm text-[#6366F1] font-semibold hover:underline">
                Back to sign in
              </button>
            </div>
          ) : (
            <form onSubmit={resetMode ? handleReset : handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Email</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent transition-all"
                  placeholder="you@example.com" />
              </div>

              {!resetMode && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Password</label>
                    <button type="button" onClick={() => { setResetMode(true); setError(null) }}
                      className="text-xs text-[#6366F1] hover:underline font-medium">
                      Forgot password?
                    </button>
                  </div>
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1] focus:border-transparent transition-all"
                    placeholder="••••••••" />
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-600">{error}</div>
              )}

              <button type="submit" disabled={loading}
                className="w-full bg-[#6366F1] hover:bg-[#4f46e5] text-white font-bold py-3 rounded-xl transition-all disabled:opacity-60 text-sm mt-2">
                {loading ? (resetMode ? 'Sending…' : 'Signing in…') : (resetMode ? 'Send Reset Link' : 'Sign In')}
              </button>

              {resetMode && (
                <button type="button" onClick={() => { setResetMode(false); setError(null) }}
                  className="w-full text-sm text-gray-400 hover:text-gray-600 font-medium py-1">
                  ← Back to sign in
                </button>
              )}
            </form>
          )}
        </div>

        <p className="text-center text-gray-400 text-xs mt-6">© 2026 DOT IT Agency</p>
      </div>
    </div>
  )
}
