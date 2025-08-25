import React from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useProfileStore } from '@/stores/profileStore'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const account = useAuthStore((s) => s.account)
  const logout = useAuthStore((s) => s.logout)

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <button
          onClick={logout}
          className="rounded-md bg-slate-900 px-3 py-2 text-white hover:bg-black"
        >
          Sign out
        </button>
      </div>

      <div className="rounded-lg border p-4">
        <div className="text-sm text-slate-500">Signed in as</div>
        <div className="font-medium">{account?.email}</div>
        <div className="text-sm text-slate-600 mt-1">
          {account?.pharmacyName ?? '—'} ({account?.subscriptionStatus ?? 'inactive'})
        </div>
      </div>

      <Link className="text-blue-700 hover:underline" to="/">
        ← Back to home
      </Link>
    </div>
  )
}
