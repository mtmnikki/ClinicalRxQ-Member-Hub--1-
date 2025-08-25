import React from 'react'
import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold">ClinicalRxQ</h1>
      <p className="mt-2 text-slate-600">Training hub for community pharmacy teams.</p>

      <div className="mt-6 flex gap-3">
        <Link
          to="/login"
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Member Login
        </Link>
        <a
          href="mailto:support@clinicalrxq.com"
          className="rounded-md border px-4 py-2 hover:bg-slate-50"
        >
          Contact
        </a>
      </div>
    </main>
  )
}
