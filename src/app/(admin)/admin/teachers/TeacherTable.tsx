'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { GraduationCap, Search, Pencil } from 'lucide-react'
import type { TeacherListItem } from './page'

function resolveOne<T>(val: T | T[] | null | undefined): T | null {
  if (!val) return null
  return Array.isArray(val) ? (val[0] ?? null) : val
}

export default function TeacherTable({ teachers }: { teachers: TeacherListItem[] }) {
  const [query, setQuery] = useState('')

  const filtered = teachers.filter((t) => {
    if (!query.trim()) return true
    const q = query.toLowerCase()
    const profile = resolveOne(t.profiles)
    return (
      profile?.full_name?.toLowerCase().includes(q) ||
      profile?.email?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome ou email..."
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[#e2e8f0] bg-white text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#1a56db] focus:border-transparent transition"
        />
      </div>

      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        {filtered.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e2e8f0] bg-[#f8fafc]">
                  {['Nome', 'Email', 'Especialidades', 'Turmas ativas', 'Status', 'Cadastro', ''].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-medium text-[#64748b] uppercase tracking-wide whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => {
                  const profile = resolveOne(t.profiles)
                  const active = profile?.active ?? false

                  return (
                    <tr
                      key={t.id}
                      className="border-b border-[#f1f5f9] last:border-0 hover:bg-[#f8fafc] transition"
                    >
                      <td className="px-4 py-3 font-medium text-[#0f172a]">
                        <Link
                          href={`/admin/teachers/${t.id}`}
                          className="hover:text-[#1a56db] transition"
                        >
                          {profile?.full_name ?? '—'}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-[#64748b]">{profile?.email ?? '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(t.specialties ?? []).length > 0 ? (
                            (t.specialties ?? []).slice(0, 3).map((s) => (
                              <span
                                key={s}
                                className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-[#ebf3ff] text-[#1a56db]"
                              >
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-[#64748b]">—</span>
                          )}
                          {(t.specialties ?? []).length > 3 && (
                            <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-[#f1f5f9] text-[#64748b]">
                              +{(t.specialties ?? []).length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#64748b] text-center">
                        {t._classCount ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            active
                              ? 'bg-[#ecfdf5] text-[#10b981]'
                              : 'bg-[#f1f5f9] text-[#64748b]'
                          }`}
                        >
                          {active ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#64748b] whitespace-nowrap">
                        {formatDate(t.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/teachers/${t.id}/edit`}
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-[#64748b] hover:text-[#1a56db] transition"
                        >
                          <Pencil size={13} />
                          Editar
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <GraduationCap size={40} className="text-[#e2e8f0] mb-3" />
            <p className="text-sm text-[#64748b]">
              {query.trim()
                ? 'Nenhum professor encontrado para esta busca.'
                : 'Nenhum professor cadastrado ainda.'}
            </p>
            {!query.trim() && (
              <p className="text-xs text-[#94a3b8] mt-1">
                Clique em &quot;Novo Professor&quot; para começar.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
