/**
 * Member Login Page
 * Split-screen layout with branding on left and login form on right.
 */

import React, { useState } from 'react';
import { useAuthStore } from '@/stores/authStore'; // <-- UPDATED IMPORT
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, FileText, ClipboardList, PlayCircle } from 'lucide-react';
import Header from '@/components/layout/Header';
import { toast } from 'sonner'; // <-- ADDED IMPORT for notifications

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation() as any
  const from = location.state?.from?.pathname || '/dashboard'
  const login = useAuthStore((s) => s.login)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (e: any) {
      setError(e?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh grid lg:grid-cols-2">
      <div className="hidden lg:flex items-center justify-center bg-slate-50">
        <div className="max-w-md p-8">
          <h1 className="text-3xl font-bold">ClinicalRxQ Member Hub</h1>
          <p className="mt-2 text-slate-600">Secure access for member pharmacies.</p>
        </div>
      </div>

          <div className="relative z-10 max-w-md">
            <div className="mb-6 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-white/20 text-xl font-bold">
                CR
              </div>
              <div className="text-lg font-semibold">ClinicalRxQ</div>
            </div>
            <h1 className="mb-3 text-3xl font-bold">Where dispensing meets direct patient care</h1>
            <p className="mb-8 text-white/90">
              Access 190+ resources, protocols, and training materials to transform your pharmacy
              into a clinical care destination.
            </p>

            <div className="mt-4 grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-white/10 p-3 backdrop-blur">
                <FileText className="mb-2 h-5 w-5" />
                <div className="text-sm font-semibold">Docs</div>
                <div className="text-xs text-white/80">Legally compliant forms</div>
              </div>
              <div className="rounded-lg bg-white/10 p-3 backdrop-blur">
                <ClipboardList className="mb-2 h-5 w-5" />
                <div className="text-sm font-semibold">Protocols</div>
                <div className="text-xs text-white/80">Evidence-based workflows</div>
              </div>
              <div className="rounded-lg bg-white/10 p-3 backdrop-blur">
                <PlayCircle className="mb-2 h-5 w-5" />
                <div className="text-sm font-semibold">Training</div>
                <div className="text-xs text-white/80">Modules and webinars</div>
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2 text-sm">
              <ShieldCheck className="h-4 w-4" />
              HIPAA-aligned. Updated monthly.
            </div>
          </div>
        </div>

   <div className="flex items-center justify-center p-6">
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              className="mt-1 w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-blue-600"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          {error && <div className="rounded-md bg-red-50 p-3 text-red-700 text-sm">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-3 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>

          <div className="text-center">
            <Link className="text-sm text-blue-700 hover:underline" to="/">
              Back to home
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
