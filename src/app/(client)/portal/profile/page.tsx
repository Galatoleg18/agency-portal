'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, KeyRound, CheckCircle2 } from 'lucide-react'

export default function ProfilePage() {
  const supabase = createClient()

  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [nameLoading, setNameLoading] = useState(false)
  const [nameSuccess, setNameSuccess] = useState(false)
  const [nameError, setNameError] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwError, setPwError] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setEmail(user.email ?? '')
        setDisplayName(user.user_metadata?.full_name ?? '')
      }
    }
    load()
  }, [supabase])

  async function handleUpdateName(e: React.FormEvent) {
    e.preventDefault()
    setNameLoading(true)
    setNameError('')
    setNameSuccess(false)

    const { error } = await supabase.auth.updateUser({
      data: { full_name: displayName },
    })

    setNameLoading(false)
    if (error) {
      setNameError(error.message)
    } else {
      setNameSuccess(true)
      setTimeout(() => setNameSuccess(false), 3000)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwError('')
    setPwSuccess(false)

    if (newPassword !== confirmPassword) {
      setPwError('Passwords do not match.')
      return
    }
    if (newPassword.length < 8) {
      setPwError('Password must be at least 8 characters.')
      return
    }

    setPwLoading(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPwLoading(false)

    if (error) {
      setPwError(error.message)
    } else {
      setPwSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPwSuccess(false), 3000)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-400 mt-0.5">{email}</p>
      </div>

      {/* Display name */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-5">
          <User size={16} className="text-[#6366F1]" />
          <h2 className="font-bold text-gray-900">Display Name</h2>
        </div>
        <form onSubmit={handleUpdateName} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30 focus:border-[#6366F1]"
            />
          </div>
          {nameError && <p className="text-sm text-red-500">{nameError}</p>}
          {nameSuccess && (
            <p className="text-sm text-emerald-600 flex items-center gap-1.5">
              <CheckCircle2 size={14} /> Name updated successfully.
            </p>
          )}
          <button
            type="submit"
            disabled={nameLoading}
            className="w-full bg-[#6366F1] hover:bg-[#4f46e5] text-white font-bold py-2.5 rounded-xl text-sm transition-all disabled:opacity-60"
          >
            {nameLoading ? 'Saving…' : 'Save Name'}
          </button>
        </form>
      </div>

      {/* Change password */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-5">
          <KeyRound size={16} className="text-[#6366F1]" />
          <h2 className="font-bold text-gray-900">Change Password</h2>
        </div>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30 focus:border-[#6366F1]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repeat password"
              className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#6366F1]/30 focus:border-[#6366F1]"
            />
          </div>
          {pwError && <p className="text-sm text-red-500">{pwError}</p>}
          {pwSuccess && (
            <p className="text-sm text-emerald-600 flex items-center gap-1.5">
              <CheckCircle2 size={14} /> Password changed successfully.
            </p>
          )}
          <button
            type="submit"
            disabled={pwLoading || !newPassword || !confirmPassword}
            className="w-full bg-[#6366F1] hover:bg-[#4f46e5] text-white font-bold py-2.5 rounded-xl text-sm transition-all disabled:opacity-60"
          >
            {pwLoading ? 'Updating…' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
